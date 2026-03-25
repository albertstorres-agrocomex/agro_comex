from django.urls import path
from rest_framework.routers import DefaultRouter
from usuario.views import UsuarioViewSet, UserCommoditiesView

router = DefaultRouter()
router.register("usuario", UsuarioViewSet)

urlpatterns = [
    path('usuario/commodities/', UserCommoditiesView.as_view(), name='usuario-commodities'),
] + router.urls