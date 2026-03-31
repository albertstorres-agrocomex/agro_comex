from django.db import models

class Comomodity(models.Model):
    codigo = models.CharField(max_length=10)
    nome = models.CharField(max_length=100)
    bolsa = models.CharField(max_length=20)
    unidade = models.CharField(max_length=30)
    moeda = models.CharField(max_length=5)
    ativo = models.BooleanField(default=True)
    imagem_url = models.URLField(max_length=500, blank=True, null=True)


    class Meta:
        db_table = "commodities" 