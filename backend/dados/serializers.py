from django.utils import timezone
from rest_framework import serializers
from dados.models import CacheDadosMercado, Analise
from commodities.models import Comomodity


class CacheDadosMercadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CacheDadosMercado
        fields = "__all__"


class AnaliseSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()
    commodity_image_url = serializers.SerializerMethodField()

    class Meta:
        model  = Analise
        fields = [
            "id", "commodity_code", "title", "status",
            "sale_price", "sale_price_currency", "sale_price_unit",
            "contract_type", "expiry_year", "total_contract_value",
            "quantidade_toneladas", "country", "resultado",
            "time_ago", "commodity_image_url",
        ]

    def get_commodity_image_url(self, obj) -> str | None:
        try:
            commodity = Comomodity.objects.get(codigo=obj.commodity_code)
            return commodity.imagem_url or None
        except Comomodity.DoesNotExist:
            return None

    def get_time_ago(self, obj) -> str:
        seconds = int((timezone.now() - obj.created_at).total_seconds())
        if seconds < 60:
            return "agora"
        if seconds < 3600:
            m = seconds // 60
            return f"{m}min ago"
        if seconds < 86400:
            h = seconds // 3600
            return f"{h}h ago"
        d = seconds // 86400
        return f"{d}d ago"


class AnaliseCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analise
        fields = [
            "commodity_code",
            "title",
            "sale_price",
            "sale_price_currency",
            "sale_price_unit",
            "contract_type",
            "expiry_year",
            "total_contract_value",
            "quantidade_toneladas",
            "country",
        ]

    def create(self, validated_data):
        user = self.context["request"].user
        return Analise.objects.create(user=user, status="pendente", **validated_data)


class AnaliseDetailSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()
    commodity_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Analise
        fields = [
            "id",
            "commodity_code",
            "title",
            "status",
            "sale_price",
            "sale_price_currency",
            "sale_price_unit",
            "contract_type",
            "expiry_year",
            "total_contract_value",
            "quantidade_toneladas",
            "country",
            "resultado",
            "time_ago",
            "commodity_image_url",
            "created_at",
        ]

    def get_time_ago(self, obj) -> str:
        seconds = int((timezone.now() - obj.created_at).total_seconds())
        if seconds < 60:
            return "agora"
        if seconds < 3600:
            m = seconds // 60
            return f"{m}min ago"
        if seconds < 86400:
            h = seconds // 3600
            return f"{h}h ago"
        d = seconds // 86400
        return f"{d}d ago"

    def get_commodity_image_url(self, obj) -> str | None:
        try:
            commodity = Comomodity.objects.get(codigo=obj.commodity_code)
            return commodity.imagem_url or None
        except Comomodity.DoesNotExist:
            return None


class AnaliseStatusCountSerializer(serializers.Serializer):
    pendente = serializers.IntegerField()
    em_analise = serializers.IntegerField()
    aprovado = serializers.IntegerField()
    rejeitado = serializers.IntegerField()
    total = serializers.IntegerField()