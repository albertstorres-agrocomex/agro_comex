from rest_framework import viewsets
from tipos_derivativo.models import TipoDerivativo
from tipos_derivativo.serializers import TipoDerivativoSerializer


class TipoDerivativoViewSet (viewsets.ModelViewSet):
    queryset = TipoDerivativo.objects.filter(disponivel=True)
    serializer_class = TipoDerivativoSerializer