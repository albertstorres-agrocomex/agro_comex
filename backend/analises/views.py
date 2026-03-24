from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response 

from analises.models import SolicitacaoAnalise, ResultadoAnalise
from analises.serializers import SolicitacaoAnaliseSerializer, ResultadoAnaliseSerializer


class SolicitacaoAnaliseViewSet (viewsets.ModelViewSet):
    queryset = SolicitacaoAnalise.objects.all()
    serializer_class = SolicitacaoAnaliseSerializer

    def perform_create(self, serializer):
        from analises.tasks import processar_analise

        solicitacao = serializer.save()
        task = processar_analise.delay(solicitacao.id)
        solicitacao.id_tarefa_worker = task.id
        solicitacao.save(update_fields=["id_tarefa_worker"])

        @action(detail=True, methods=["get"], url_path="status")
        def status_analise(self, request, pk=None):
            """GET /api/v1/solicitacao_analise/{id}/status/"""
            solicitacao = self.get_object()
            data = {
                "id": solicitacao.id,
                "status": solicitacao.status,
                "id_tarefa_worker": solicitacao.id_tarefa_worker,
            }

            if solicitacao.status == SolicitacaoAnalise.Status.CONCLUIDO:
                resultado = ResultadoAnalise.objects.filter(
                    solicitacao=solicitacao
                ).order_by("-calculado_em").first()
                if resultado:
                    data["resultado"] = ResultadoAnaliseSerializer(resultado).data
            
            return Response(data, status=status.HTTP_200_OK)


class ResultadoAnaliseViewSet (viewsets.ModelViewSet):
    queryset = ResultadoAnalise.objects.all()
    serializer_class = ResultadoAnaliseSerializer
