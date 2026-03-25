from django.urls import path
from rest_framework.routers import DefaultRouter

from dados.views import (
    CacheDadosMercadoViewSet,
    IndiceExportacaoView,
    AnaliseListView,
    AnaliseCreateView,
    AnaliseDetailView,
    AnaliseAprovarView,
    AnaliseReprovarView,
    AnaliseStatusCountView,
)

router = DefaultRouter()
router.register("cache_dados_mercado", CacheDadosMercadoViewSet)

urlpatterns = router.urls + [
    path("dados/indice_exportacao/", IndiceExportacaoView.as_view(), name="indice_exportacao"),
    path("dados/analises/", AnaliseListView.as_view(), name="analise_list"),
    path("dados/analises/create/", AnaliseCreateView.as_view(), name="analise_create"),
    path("dados/analises/status-count/", AnaliseStatusCountView.as_view(), name="analise_status_count"),
    path("dados/analises/<int:pk>/", AnaliseDetailView.as_view(), name="analise_detail"),
    path("dados/analises/<int:pk>/aprovar/", AnaliseAprovarView.as_view(), name="analise_aprovar"),
    path("dados/analises/<int:pk>/reprovar/", AnaliseReprovarView.as_view(), name="analise_reprovar"),
]
