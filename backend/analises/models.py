from django.db import models
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from usuario.models import Usuario
from meses_contrato_futuro.models import MesContratoFurturo

class SolicitacaoAnalise(models.Model):
    class Status(models.TextChoices):
        AGUARDANDO = "aguardando"
        PROCESSANDO = "processando"
        CONCLUIDO = "concluido"
        ERRO = "erro"
        APROVADO = "aprovado"
        REJEITADO = "rejeitado"

    usuario = models.ForeignKey(
        Usuario, 
        on_delete=models.PROTECT, 
        null=False
    )
    commodity = models.ForeignKey(
        Comomodity, 
        on_delete=models.PROTECT, 
        null=False
    )
    tipo_derivativo = models.ForeignKey(
        TipoDerivativo, 
        on_delete=models.PROTECT, 
        null=False
    )
    mes_contrato = models.ForeignKey(
        MesContratoFurturo, 
        on_delete=models.PROTECT, 
        null=True, 
        blank=True
    )
    preco_mercado_atual = models.IntegerField()
    preco_exercicio = models.IntegerField()
    quantidade_sacas = models.IntegerField(null=True, blank=True)
    posicao = models.CharField(max_length=12, null=True, blank=True)
    nivel_barreira = models.IntegerField(null=True, blank=True)
    KNOCK_IN = "knock_in"
    KNOCK_OUT = "knock_out"
    BARREIRA_TIPO_CHOICES = [
        (KNOCK_IN, "Knock-in (entrada)"),
        (KNOCK_OUT, "Knock-out (saida)"),
    ]
    barreira_tipo = models.CharField(
        max_length=10, choices=BARREIRA_TIPO_CHOICES, null=True, blank=True
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.AGUARDANDO)
    id_tarefa_worker = models.CharField(max_length=100, null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)


    class Meta:
        db_table = "solicitacoes_analise"


class ResultadoAnalise(models.Model):
    solicitacao = models.ForeignKey(
        SolicitacaoAnalise, 
        on_delete=models.CASCADE
    )
    premio_calculado = models.IntegerField(null=True, blank=True)
    percentual_premio = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    valor_total_contrato = models.IntegerField(null=True, blank=True)
    lucro_maximo = models.IntegerField(null=True, blank=True)
    volatilidade_utilizada = models.DecimalField(max_digits=8, decimal_places=6, null=True, blank=True)
    taxa_juros_utilizada = models.DecimalField(max_digits=8, decimal_places=6, null=True, blank=True)
    d1 = models.DecimalField(max_digits=12, decimal_places=6, null=True, blank=True)
    d2 = models.DecimalField(max_digits=12, decimal_places=6, null=True, blank=True)
    calculado_em = models.DateTimeField(auto_now_add=True)


    class Meta:
        db_table = "resultados_analise"


class CenarioAnalise(models.Model):
    class NomeCenario(models.TextChoices):
        CONSERVADOR = "conservador"
        MODERADO    = "moderado"
        AGRESSIVO   = "agressivo"
        PROPOSTO    = "proposto"

    resultado                 = models.ForeignKey(
        ResultadoAnalise,
        on_delete=models.CASCADE,
        related_name="cenarios",
    )
    nome                      = models.CharField(max_length=20, choices=NomeCenario.choices)
    preco_exercicio_centavos  = models.IntegerField()
    premio_centavos           = models.IntegerField()
    e_recomendado             = models.BooleanField(default=False)
    escolhido_pelo_usuario    = models.BooleanField(default=False)
    escolhido_em              = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table      = "cenarios_analise"
        unique_together = [("resultado", "nome")]


class PontoCurvaResultado(models.Model):
    cenario            = models.ForeignKey(
        CenarioAnalise,
        on_delete=models.CASCADE,
        related_name="pontos_curva",
    )
    preco_centavos     = models.IntegerField()
    resultado_centavos = models.IntegerField()

    class Meta:
        db_table = "pontos_curva_resultado"
        ordering = ["preco_centavos"]