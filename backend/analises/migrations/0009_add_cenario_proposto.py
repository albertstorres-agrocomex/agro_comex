from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("analises", "0008_fix_percentual_premio_max_digits"),
    ]

    operations = [
        migrations.AlterField(
            model_name="solicitacaoanalise",
            name="preco_exercicio",
            field=models.IntegerField(),
        ),
        migrations.AlterField(
            model_name="cenarioanalise",
            name="nome",
            field=models.CharField(
                choices=[
                    ("conservador", "Conservador"),
                    ("moderado", "Moderado"),
                    ("agressivo", "Agressivo"),
                    ("proposto", "Proposto"),
                ],
                max_length=20,
            ),
        ),
    ]
