from rest_framework import serializers
from meses_contrato_futuro.models import MesContratoFurturo


class MesContratoFurturoSerializer (serializers.ModelSerializer):


    class Meta:
        model = MesContratoFurturo
        fields = "__all__"