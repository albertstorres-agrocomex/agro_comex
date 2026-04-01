from django.urls import path
from analises.views import (
    SolicitacaoAnaliseListCreateView,
    SolicitacaoAnaliseDetailView,
    SolicitacaoAnaliseStatusCountView,
    EscolherCenarioView,
)

urlpatterns = [
    path("solicitacao_analise/", SolicitacaoAnaliseListCreateView.as_view(), name="solicitacao_analise_list_create"),
    path("solicitacao_analise/status-count/", SolicitacaoAnaliseStatusCountView.as_view(), name="solicitacao_analise_status_count"),
    path("solicitacao_analise/<int:pk>/", SolicitacaoAnaliseDetailView.as_view(), name="solicitacao_analise_detail"),
    path("cenarios/<int:pk>/escolher/", EscolherCenarioView.as_view(), name="cenario_escolher"),
]
