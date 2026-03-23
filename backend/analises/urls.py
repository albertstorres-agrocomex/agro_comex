from rest_framework.routers import DefaultRouter
from analises.views import SolicitacaoAnaliseViewSet, ResultadoAnaliseViewSet

router = DefaultRouter()
router.register("solicitacao_analise", SolicitacaoAnaliseViewSet)
router.register("resultado_analise", ResultadoAnaliseViewSet)

urlpatterns = router.urls