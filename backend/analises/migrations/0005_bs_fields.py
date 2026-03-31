from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("analises", "0004_add_preco_exercicio"),
    ]

    operations = [
        migrations.AddField(
            model_name="solicitacaoanalise",
            name="quantidade_sacas",
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.RemoveField(
            model_name="resultadoanalise",
            name="nivel_acumulacao",
        ),
        migrations.AddField(
            model_name="resultadoanalise",
            name="premio_calculado",
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="resultadoanalise",
            name="percentual_premio",
            field=models.DecimalField(max_digits=8, decimal_places=4, null=True, blank=True),
        ),
        migrations.AddField(
            model_name="resultadoanalise",
            name="valor_total_contrato",
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="resultadoanalise",
            name="lucro_maximo",
            field=models.IntegerField(null=True, blank=True),
        ),
    ]
