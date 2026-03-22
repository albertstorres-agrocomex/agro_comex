from django.db import models
from commodities.models import Comomodity


# Utilidade da tebela é garantir uma série histórica local, para calcular a volatilidade com dados do próprio sistema. Possivel exclusão no futuro.
class CacheDadosMercado(models.Model):
    commodity = models.ForeignKey(commodity, on_delete=models.PROTECT)
    data_preco = models.DateField()
    preco_fechamento = models.IntegerField()
    fonte = models.CharField(max_length=50, null=True, blank=True)
    obtido_em = models.DateTimeField(auto_now_add=True)


    class Meta:
        db_table = "cache_dados_mercado"
        unique_together = ("commodity", "data_preco", "fonte")