from django.db import models
from django.contrib.auth.models import User


class Usuario(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="usuarios"
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)


    class Meta:
        db_table = "usuarios"
