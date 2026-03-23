from rest_framework.routers import DefaultRouter
from meses_contrato_futuro.views import MesContratoFurturoViewSet

router = DefaultRouter()
router.register("meses_contrato_futuro", MesContratoFurturoViewSet)

urlpatterns = router.urls