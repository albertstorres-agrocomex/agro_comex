from rest_framework import serializers
from dados.models import CacheDadosMercado


class CacheDadosMercadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CacheDadosMercado
        fields = "__all__"
