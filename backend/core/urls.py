from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path("api/v1/", include("analises.urls")),
    path("api/v1/", include("commodities.urls")),
    path("api/v1/", include("dados.urls")),
    path("api/v1/", include("meses_contrato_futuro.urls")),
    path("api/v1/", include("tipos_derivativo.urls")),
    path("api/v1/", include("usuario.urls")),
]