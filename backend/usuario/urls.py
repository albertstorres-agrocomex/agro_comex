from rest_framework.routers import DefaultRouter
from usuario.views import UsuarioViewSet

router = DefaultRouter()
router.register("usuario", UsuarioViewSet)

urlpatterns = router.urls