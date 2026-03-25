from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from commodities.models import Comomodity
from commodities.serializers import CommoditySerializer


class CommodityPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'


class ComomodityViewSet(viewsets.ModelViewSet):
    queryset = Comomodity.objects.filter(ativo=True).order_by('nome')
    serializer_class = CommoditySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CommodityPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['nome', 'bolsa']