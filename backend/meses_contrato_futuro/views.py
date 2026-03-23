from rest_framework import viewsets
from meses_contrato_futuro.models import MesContratoFurturo
from meses_contrato_futuro.serializers import MesContratoFurturoSerializer


class MesContratoFurturoViewSet (viewsets.ModelViewSet):
    queryset = MesContratoFurturo.objects.all()
    serializer_class = MesContratoFurturoSerializer