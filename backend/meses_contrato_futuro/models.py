from django.db import models
from commodities.models import Comomodity

class MesContratoFurturo(models.Model):
    commodity = models.ForeignKey(Comomodity, on_delete=models.PROTECT)
    codigo_mes = models.Charfield(max_length=1)
    ano = models.SmallIntegerField()
    data_vencimento = models.DateField()
    ticket_completo = models.CharField(max_length=20, null=True, blank=True)
    ativo = models.BooleanField(default=True)


    class Meta: 
        db_table = "meses_contrato_futuro"
        unique_together = ("commodity", "codigo_mes", "ano")