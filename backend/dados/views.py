from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework import status as http_status
from django.db.models import Count, Q

from dados.models import CacheDadosMercado, Analise
from dados.serializers import (
    CacheDadosMercadoSerializer,
    AnaliseSerializer,
    AnaliseCreateSerializer,
    AnaliseDetailSerializer,
)


class CacheDadosMercadoViewSet(viewsets.ModelViewSet):
    queryset = CacheDadosMercado.objects.all()
    serializer_class = CacheDadosMercadoSerializer


class IndiceExportacaoView(APIView):
    """
    GET /api/v1/dados/indice_exportacao/

    Retorna o indice de exportacao base 100 por trimestre para as commodities
    do usuario autenticado. Fluxo: verifica cache Redis -> Celery task -> Redis.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.core.cache import cache
        from usuario.models import Usuario
        from dados.tasks.indice_exportacao import calcular_indice_exportacao, _cache_key

        try:
            usuario = (
                Usuario.objects
                .prefetch_related("commodities")
                .get(user=request.user)
            )
            commodity_ids = list(
                usuario.commodities.filter(ativo=True).values_list("id", flat=True)
            )
        except Usuario.DoesNotExist:
            return Response({"chart_data": [], "series": [], "stats": []})

        if not commodity_ids:
            return Response({"chart_data": [], "series": [], "stats": []})

        cache_key = _cache_key(commodity_ids)
        cached = cache.get(cache_key)
        if cached:
            return Response(cached)

        # Cache miss: computar via task (chamada sincrona — dados ja estao no DB local)
        result = calcular_indice_exportacao(commodity_ids)
        return Response(result)


class AnalisePagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = "page_size"
    max_page_size = 6


class AnaliseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Analise.objects.filter(user=request.user)
        status_filter = request.query_params.get("status")
        if status_filter and status_filter != "todos":
            qs = qs.filter(status=status_filter)

        paginator = AnalisePagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = AnaliseSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AnaliseCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AnaliseCreateSerializer(
            data=request.data, context={"request": request}
        )
        if serializer.is_valid():
            analise = serializer.save()
            from dados.tasks.processar_analise import processar_analise
            processar_analise.delay(analise.id)
            return Response(
                AnaliseDetailSerializer(analise).data,
                status=http_status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=http_status.HTTP_400_BAD_REQUEST)


class AnaliseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            analise = Analise.objects.get(pk=pk, user=request.user)
        except Analise.DoesNotExist:
            return Response(status=http_status.HTTP_404_NOT_FOUND)
        return Response(AnaliseDetailSerializer(analise).data)


class AnaliseAprovarView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            analise = Analise.objects.get(pk=pk, user=request.user, status="em_analise")
        except Analise.DoesNotExist:
            return Response(
                {"detail": "Analise nao encontrada ou nao esta em analise."},
                status=http_status.HTTP_404_NOT_FOUND,
            )
        analise.status = "aprovado"
        analise.save(update_fields=["status"])
        return Response(AnaliseDetailSerializer(analise).data)


class AnaliseReprovarView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            analise = Analise.objects.get(pk=pk, user=request.user, status="em_analise")
        except Analise.DoesNotExist:
            return Response(
                {"detail": "Analise nao encontrada ou nao esta em analise."},
                status=http_status.HTTP_404_NOT_FOUND,
            )
        analise.status = "rejeitado"
        analise.save(update_fields=["status"])
        return Response(AnaliseDetailSerializer(analise).data)


class AnaliseStatusCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Analise.objects.filter(user=request.user)
        counts = qs.aggregate(
            pendente=Count("id", filter=Q(status="pendente")),
            em_analise=Count("id", filter=Q(status="em_analise")),
            aprovado=Count("id", filter=Q(status="aprovado")),
            rejeitado=Count("id", filter=Q(status="rejeitado")),
        )
        counts["total"] = sum(counts.values())
        return Response(counts)
