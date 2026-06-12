from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("analises", "0003_add_status_aprovado_rejeitado"),
    ]

    operations = [
        migrations.AddField(
            model_name="solicitacaoanalise",
            name="preco_exercicio",
            field=models.IntegerField(null=True, blank=True),
        ),
    ]
