from django.urls import path
from rest_framework.routers import DefaultRouter
from dados.views import CacheDadosMercadoViewSet, IndiceExportacaoView

router = DefaultRouter()
router.register("cache_dados_mercado", CacheDadosMercadoViewSet)

urlpatterns = router.urls + [
    path("dados/indice_exportacao/", IndiceExportacaoView.as_view(), name="indice_exportacao"),
]
