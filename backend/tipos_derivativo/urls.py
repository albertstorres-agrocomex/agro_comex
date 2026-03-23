from rest_framework.routers import DefaultRouter
from tipos_derivativo.views import TipoDerivativoViewSet

router = DefaultRouter()
router.register("tipos_derivativo", TipoDerivativoViewSet)

urlpatterns = router.urls