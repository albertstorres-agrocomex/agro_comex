from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Q

from analises.models import SolicitacaoAnalise, ResultadoAnalise
from analises.serializers import (
    SolicitacaoAnaliseCreateSerializer,
    SolicitacaoAnaliseReadSerializer,
    ResultadoAnaliseSerializer,
)


class AnalisePagination(PageNumberPagination):
    page_size = 6
    max_page_size = 6


class SolicitacaoAnaliseListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perfil = request.user.usuarios
        qs = SolicitacaoAnalise.objects.filter(usuario=perfil).select_related(
            "commodity", "tipo_derivativo", "mes_contrato"
        )
        status_filter = request.query_params.get("status")
        if status_filter and status_filter != "todos":
            qs = qs.filter(status=status_filter)

        paginator = AnalisePagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = SolicitacaoAnaliseReadSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = SolicitacaoAnaliseCreateSerializer(
            data=request.data, context={"request": request}
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        from django.db import transaction

        solicitacao = serializer.save()

        def _dispatch():
            from analises.tasks import processar_analise
            task = processar_analise.delay(solicitacao.id)
            SolicitacaoAnalise.objects.filter(pk=solicitacao.id).update(
                id_tarefa_worker=task.id
            )

        transaction.on_commit(_dispatch)

        return Response(
            SolicitacaoAnaliseReadSerializer(solicitacao).data,
            status=status.HTTP_201_CREATED,
        )


class SolicitacaoAnaliseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_object(self, request, pk):
        perfil = request.user.usuarios
        try:
            return SolicitacaoAnalise.objects.select_related(
                "commodity", "tipo_derivativo", "mes_contrato"
            ).get(pk=pk, usuario=perfil)
        except SolicitacaoAnalise.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get_object(request, pk)
        if obj is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        data = SolicitacaoAnaliseReadSerializer(obj).data
        if obj.status == SolicitacaoAnalise.Status.CONCLUIDO:
            resultado = (
                ResultadoAnalise.objects.filter(solicitacao=obj)
                .order_by("-calculado_em")
                .first()
            )
            if resultado:
                data["resultado"] = ResultadoAnaliseSerializer(resultado).data
        return Response(data)


class SolicitacaoAnaliseStatusCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        perfil = request.user.usuarios
        qs = SolicitacaoAnalise.objects.filter(usuario=perfil)
        counts = qs.aggregate(
            aguardando=Count("id", filter=Q(status="aguardanto")),
            processando=Count("id", filter=Q(status="processando")),
            concluido=Count("id", filter=Q(status="concluido")),
            erro=Count("id", filter=Q(status="erro")),
        )
        counts["total"] = sum(counts.values())
        return Response(counts)
