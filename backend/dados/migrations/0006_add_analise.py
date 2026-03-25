from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("dados", "0005_bigint_preco_fechamento"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Analise",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("user", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="analises",
                    to=settings.AUTH_USER_MODEL,
                )),
                ("commodity_code",       models.CharField(max_length=10)),
                ("title",                models.CharField(max_length=255)),
                ("status",               models.CharField(
                    choices=[
                        ("aprovado",   "Aprovado"),
                        ("pendente",   "Pendente"),
                        ("rejeitado",  "Rejeitado"),
                        ("em_analise", "Em Analise"),
                    ],
                    default="pendente",
                    max_length=20,
                )),
                ("sale_price",           models.DecimalField(decimal_places=2, max_digits=18)),
                ("sale_price_currency",  models.CharField(default="USD", max_length=10)),
                ("sale_price_unit",      models.CharField(default="/ton", max_length=20)),
                ("contract_type",        models.CharField(max_length=20)),
                ("expiry_year",          models.IntegerField()),
                ("total_contract_value", models.CharField(max_length=100)),
                ("country",              models.CharField(max_length=100)),
                ("created_at",           models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "analise",
                "ordering": ["-created_at"],
            },
        ),
    ]
