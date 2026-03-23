from rest_framework import serializers
from analises.models import SolicitacaoAnalise, ResultadoAnalise


class SolicitacaoAnaliseSerializer (serializers.ModelSerializer):


    class Meta:
        model = SolicitacaoAnalise
        fields = "__all__"


class ResultadoAnaliseSerializer (serializers.ModelSerializer):


    class Meta:
        model = ResultadoAnalise
        fields = "__all__"