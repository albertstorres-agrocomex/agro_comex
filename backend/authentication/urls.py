from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView
from .views import CustomTokenObtainPairView, CustomTokenRefreshView, LogoutView, MeuPerfilView

urlpatterns = [
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeuPerfilView.as_view(), name='meu_perfil'),
]
