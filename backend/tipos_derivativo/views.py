from rest_framework import viewsets
from tipos_derivativo.models import TipoDerivativo
from tipos_derivativo.serializers import TipoDerivativoSerializer


class TipoDerivativoViewSet (viewsets.ModelViewSet):
    queryset = TipoDerivativo.objects.all()
    serializer_class = TipoDerivativoSerializer