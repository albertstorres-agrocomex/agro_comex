from django.conf import settings
from django.db import models
from commodities.models import Comomodity


# Utilidade da tebela é garantir uma série histórica local, para calcular a volatilidade com dados do próprio sistema. Possivel exclusão no futuro.
class CacheDadosMercado(models.Model):
    commodity = models.ForeignKey(
        Comomodity, 
        on_delete=models.PROTECT
    )
    data_preco = models.DateField()
    preco_fechamento = models.BigIntegerField()
    fonte = models.CharField(max_length=50, null=True, blank=True)
    obtido_em = models.DateTimeField(auto_now_add=True)


    class Meta:
        db_table = "cache_dados_mercado"
        unique_together = ("commodity", "data_preco", "fonte")


class DadosMacroeconomicos(models.Model):
    """
    Armazena series macroeconomicas do BCB (SGS):
      - USD_BRL: cotacao dolar comercial venda (serie 10813)
      - EUR_BRL: cotacao euro venda (serie 21619)
      - SELIC:   taxa SELIC diaria (serie 1)
      - IPCA:    IPCA mensal (serie 433)

    Separado de CacheDadosMercado pois indicadores macro nao sao commodities.
    Usados em ResultadoAnalise para taxa_juros_utilizada e correcao.
    """
    INDICADORES = [
        ("USD_BRL", "Dolar Comercial Venda (BRL)"),
        ("EUR_BRL", "Euro Venda (BRL)"),
        ("SELIC",   "Taxa SELIC (% a.a.)"),
        ("IPCA",    "IPCA (% mensal)"),
    ]

    indicador  = models.CharField(max_length=20, choices=INDICADORES)
    data       = models.DateField()
    valor      = models.DecimalField(max_digits=18, decimal_places=6)
    fonte      = models.CharField(max_length=50)
    obtido_em  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table       = "dados_macroeconomicos"
        unique_together = ("indicador", "data")
        indexes         = [models.Index(fields=["indicador", "data"])]


class Analise(models.Model):
    STATUS_CHOICES = [
        ("aprovado",   "Aprovado"),
        ("pendente",   "Pendente"),
        ("rejeitado",  "Rejeitado"),
        ("em_analise", "Em Analise"),
    ]

    user                 = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="analises",
    )
    commodity_code       = models.CharField(max_length=10)
    title                = models.CharField(max_length=255)
    status               = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pendente")
    sale_price           = models.DecimalField(max_digits=18, decimal_places=2)
    sale_price_currency  = models.CharField(max_length=10, default="USD")
    sale_price_unit      = models.CharField(max_length=20, default="/ton")
    contract_type        = models.CharField(max_length=20)
    expiry_year          = models.IntegerField()
    total_contract_value = models.CharField(max_length=100)
    country              = models.CharField(max_length=100)
    quantidade_toneladas = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True
    )
    resultado            = models.TextField(blank=True, default="")
    created_at           = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "analise"
        ordering = ["-created_at"]