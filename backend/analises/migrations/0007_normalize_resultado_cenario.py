from django.db import migrations, models


def migrar_d1_d2_de_dados_brutos(apps, schema_editor):
    ResultadoAnalise = apps.get_model("analises", "ResultadoAnalise")
    for resultado in ResultadoAnalise.objects.exclude(dados_brutos=None):
        dados = resultado.dados_brutos or {}
        d1 = dados.get("d1")
        d2 = dados.get("d2")
        if d1 is not None or d2 is not None:
            resultado.d1 = d1
            resultado.d2 = d2
            resultado.save(update_fields=["d1", "d2"])


class Migration(migrations.Migration):

    dependencies = [
        ("analises", "0006_cenarios_analise"),
    ]

    operations = [
        # 1. Adiciona d1 e d2 em ResultadoAnalise
        migrations.AddField(
            model_name="resultadoanalise",
            name="d1",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name="resultadoanalise",
            name="d2",
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=12, null=True),
        ),
        # 2. Migra dados existentes de dados_brutos para d1/d2
        migrations.RunPython(migrar_d1_d2_de_dados_brutos, migrations.RunPython.noop),
        # 3. Remove dados_brutos
        migrations.RemoveField(model_name="resultadoanalise", name="dados_brutos"),
        # 4. Remove campos derivados de CenarioAnalise
        migrations.RemoveField(model_name="cenarioanalise", name="fator"),
        migrations.RemoveField(model_name="cenarioanalise", name="nivel_risco"),
        migrations.RemoveField(model_name="cenarioanalise", name="ponto_equilibrio_centavos"),
        migrations.RemoveField(model_name="cenarioanalise", name="valor_total_centavos"),
    ]
