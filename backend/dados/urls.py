from rest_framework.routers import DefaultRouter
from dados.views import CacheDadosMercadoViewSet

router = DefaultRouter()
router.register("cache_dados_mercado", CacheDadosMercadoViewSet)

urlpatterns = router.urls