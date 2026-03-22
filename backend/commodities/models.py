from django.db import models

class Comomodity(models.Model):
    codigo = models.Charfield(max_length=10)
    nome = models.Charfield(max_length=100)
    bolsa = models.Charfield(max_length=20)
    unidade = models.Charfield(max_length=30)
    moeda = models.Charfield(max_length=5)
    ativo = models.BooleanField(default=True)


    class Meta:
        db_table = "commodities" 