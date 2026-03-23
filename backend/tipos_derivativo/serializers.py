from rest_framework import serializers
from tipos_derivativo.models import TipoDerivativo


class TipoDerivativoSerializer (serializers.ModelSerializer):


    class Meta:
        model = TipoDerivativo
        fields = "__all__"