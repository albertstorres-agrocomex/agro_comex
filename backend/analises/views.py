from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Q

from analises.models import SolicitacaoAnalise, ResultadoAnalise, CenarioAnalise
from analises.serializers import (
    SolicitacaoAnaliseCreateSerializer,
    SolicitacaoAnaliseReadSerializer,
    ResultadoAnaliseSerializer,
    CenarioAnaliseSerializer,
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
        if obj.status in (SolicitacaoAnalise.Status.CONCLUIDO, SolicitacaoAnalise.Status.APROVADO):
            resultado = (
                ResultadoAnalise.objects.filter(solicitacao=obj)
                .order_by("-calculado_em")
                .first()
            )
            if resultado:
                data["resultado"] = ResultadoAnaliseSerializer(resultado).data
        return Response(data)

    def patch(self, request, pk):
        obj = self._get_object(request, pk)
        if obj is None:
            return Response(status=status.HTTP_404_NOT_FOUND)

        novo_status = request.data.get("status")
        TRANSICOES_VALIDAS = {
            SolicitacaoAnalise.Status.CONCLUIDO: {
                SolicitacaoAnalise.Status.APROVADO,
                SolicitacaoAnalise.Status.REJEITADO,
            },
            SolicitacaoAnalise.Status.AGUARDANDO: {
                SolicitacaoAnalise.Status.REJEITADO,
            },
        }

        permitidos = TRANSICOES_VALIDAS.get(obj.status, set())
        if novo_status not in permitidos:
            return Response(
                {"detail": f"Transicao de '{obj.status}' para '{novo_status}' nao permitida."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        obj.status = novo_status
        obj.save(update_fields=["status"])
        data = SolicitacaoAnaliseReadSerializer(obj).data
        if obj.status == SolicitacaoAnalise.Status.APROVADO:
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
            avaliacao=Count("id", filter=Q(status=SolicitacaoAnalise.Status.CONCLUIDO)),
            aprovado=Count("id", filter=Q(status=SolicitacaoAnalise.Status.APROVADO)),
            rejeitado=Count("id", filter=Q(status=SolicitacaoAnalise.Status.REJEITADO)),
        )
        counts["total"] = sum(counts.values())
        return Response(counts)


class EscolherCenarioView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from django.utils import timezone

        perfil = request.user.usuarios
        try:
            cenario = CenarioAnalise.objects.select_related(
                "resultado__solicitacao__usuario"
            ).get(pk=pk)
        except CenarioAnalise.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if cenario.resultado.solicitacao.usuario != perfil:
            return Response(status=status.HTTP_403_FORBIDDEN)

        if request.data.get("escolhido_pelo_usuario") is not True:
            return Response(
                {"detail": "Apenas {'escolhido_pelo_usuario': true} e aceito."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        CenarioAnalise.objects.filter(
            resultado=cenario.resultado
        ).exclude(pk=pk).update(escolhido_pelo_usuario=False, escolhido_em=None)

        cenario.escolhido_pelo_usuario = True
        cenario.escolhido_em = timezone.now()
        cenario.save(update_fields=["escolhido_pelo_usuario", "escolhido_em"])

        return Response(CenarioAnaliseSerializer(cenario).data)
