from rest_framework import viewsets
from meses_contrato_futuro.models import MesContratoFurturo
from meses_contrato_futuro.serializers import MesContratoFurturoSerializer


class MesContratoFurturoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MesContratoFurturoSerializer

    def get_queryset(self):
        qs = MesContratoFurturo.objects.filter(ativo=True).order_by("ano", "codigo_mes")
        commodity_id = self.request.query_params.get("commodity_id")
        if commodity_id:
            qs = qs.filter(commodity_id=commodity_id)
        return qs
