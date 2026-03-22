from django.db import models

class TipoDerivativo(models.Model):
    nome = models.Charfield(max_length=50)
    rotulo = models.CharField(max_length=50)
    descricao = models.TextField(null=True, blank=True)
    requer_barreira = models.BooleanField(default=False)
    requer_posicao = models.BooleanField(default=False)


    class Meta:
        db_table = "tipos_derivativo"