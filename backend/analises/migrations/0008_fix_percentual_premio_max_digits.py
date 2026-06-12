from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("analises", "0007_normalize_resultado_cenario"),
    ]

    operations = [
        migrations.AlterField(
            model_name="resultadoanalise",
            name="percentual_premio",
            field=models.DecimalField(
                blank=True,
                decimal_places=4,
                max_digits=12,
                null=True,
            ),
        ),
    ]
