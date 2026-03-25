from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from dados.models import CacheDadosMercado
from dados.serializers import CacheDadosMercadoSerializer


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
