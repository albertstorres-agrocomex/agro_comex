from rest_framework import viewsets
from dados.models import CacheDadosMercado
from dados.serializers import CacheDadosMercadoSerializer


class CacheDadosMercadoViewSet (viewsets.ModelViewSet):
    queryset = CacheDadosMercado.objects.all()
    serializer_class = CacheDadosMercadoSerializer