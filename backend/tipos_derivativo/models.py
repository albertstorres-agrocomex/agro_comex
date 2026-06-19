from django.db import models

class TipoDerivativo(models.Model):
    POSICAO_CHOICES = [
        ("comprador", "Comprador"),
        ("vendedor", "Vendedor"),
    ]

    nome = models.CharField(max_length=50)
    rotulo = models.CharField(max_length=50)
    descricao = models.TextField(null=True, blank=True)
    requer_barreira = models.BooleanField(default=False)
    requer_posicao = models.BooleanField(default=False)
    posicao_implicita = models.CharField(
        max_length=12,
        choices=POSICAO_CHOICES,
        null=True,
        blank=True,
        help_text="Se preenchido, a posicao e automaticamente definida para este tipo de contrato.",
    )
    disponivel = models.BooleanField(
        default=True,
        help_text="Se False, o tipo nao e ofertado na selecao de nova analise.",
    )

    class Meta:
        db_table = "tipos_derivativo"