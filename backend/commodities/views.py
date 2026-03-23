from rest_framework import viewsets
from commodities.models import Comomodity
from commodities.serializers import CommoditySerializer


class ComomodityViewSet (viewsets.ModelViewSet):
    queryset = Comomodity.objects.all()
    serializer_class = CommoditySerializer