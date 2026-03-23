from rest_framework import viewsets
from analises.models import SolicitacaoAnalise, ResultadoAnalise
from analises.serializers import SolicitacaoAnaliseSerializer, ResultadoAnaliseSerializer


class SolicitacaoAnaliseViewSet (viewsets.ModelViewSet):
    queryset = SolicitacaoAnalise.objects.all()
    serializer_class = SolicitacaoAnaliseSerializer


class ResultadoAnaliseViewSet (viewsets.ModelViewSet):
    queryset = ResultadoAnalise.objects.all()
    serializer_class = ResultadoAnaliseSerializer
