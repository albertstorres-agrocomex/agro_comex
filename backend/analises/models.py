from django.db import models
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo

class SolicitacaoAnalise(models.Model):
    class Status(models.TextChoices):
        AGUARDANTO = "aguardanto"
        PROCESSANDO = "processando"
        CONCLUIDO = "concluido"
        ERRO = "erro"

    usuario_id = models.IntegerField() # É um IntegerField simples porque o schema SQL nao define FK para uma tabela de usuarios (ainda não criei) — quando o modelo User do Django estiver definido, trocar por ForeignKey(settings.AUTH_USER_MODEL, ...).
    commodity = models.ForeignKey(Comomodity, on_delete=models.PROTECT, null=False)
    tipo_derivativo = models.ForeignKey(TipoDerivativo, on_delete=models.PROTECT, null=False)
    preco_mercado_atual = models.IntegerField()
    posicao = models.CharField(max_length=12, null=True, blank=True)
    codigo_mes_vencimento = models.CharField(max_length=1, null=True, blank=True)
    ano_vencimento = models.SmallIntegerField(null=True, blank=True)
    nivel_barreira = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AGUARDANTO)
    id_tarefa_worker = models.CharField(max_length=100, null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)


    class Meta:
        db_table = "solicitacoes_analise"


class ResultadoAnalise(models.Model):
    solicitacao = models.ForeignKey(SolicitacaoAnalise, on_delete=models.CASCADE)
    nivel_acumulacao = models.IntegerField(null=True, blank=True)
    tipo_derivativo = models.CharField(max_length=50, null=True, blank=True)
    rotulo_vencimento = models.CharField(max_length=10, null=True, blank=True)
    data_vencimento = models.DateField(null=True, blank=True)
    nivel_barreira = models.IntegerField(null=True, blank=True)
    posicao = models.CharField(max_length=12, null=True, blank=True)
    volatilidade_utilizada = models.DecimalField(max_digits=8, decimal_places=6, null=True, blank=True)
    taxa_juros_utilizada = models.DecimalField(max_digits=8, decimal_places=6, null=True, blank=True)
    dados_brutos = models.JSONField(null=True, blank=True)
    calculado_em = models.DateTimeField(auto_now_add=True)


    class Meta:
        db_table = "resultados_analise"