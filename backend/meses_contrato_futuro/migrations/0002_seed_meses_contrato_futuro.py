import calendar
from datetime import date
from django.db import migrations

COMMODITY_MESES = {
    "soja":   ["F", "H", "K", "N", "Q", "U", "X"],
    "milho":  ["H", "K", "N", "U", "Z"],
    "cafe":   ["H", "K", "N", "U", "Z"],
    "acucar": ["H", "K", "N", "V"],
}

CODIGO_MES_NUMERO = {
    "F": 1, "G": 2, "H": 3, "J": 4, "K": 5, "M": 6,
    "N": 7, "Q": 8, "U": 9, "V": 10, "X": 11, "Z": 12,
}

ANOS = [2026, 2027, 2028]


def seed_meses(apps, schema_editor):
    Commodity = apps.get_model("commodities", "Comomodity")
    MesContratoFurturo = apps.get_model("meses_contrato_futuro", "MesContratoFurturo")
    today = date.today()

    for nome_busca, codigos in COMMODITY_MESES.items():
        for commodity in Commodity.objects.filter(nome__icontains=nome_busca, ativo=True):
            for ano in ANOS:
                for codigo in codigos:
                    numero_mes = CODIGO_MES_NUMERO[codigo]
                    ultimo_dia = calendar.monthrange(ano, numero_mes)[1]
                    data_venc = date(ano, numero_mes, ultimo_dia)
                    ano_2dig = str(ano)[-2:]
                    MesContratoFurturo.objects.get_or_create(
                        commodity=commodity,
                        codigo_mes=codigo,
                        ano=ano,
                        defaults={
                            "data_vencimento": data_venc,
                            "ticket_completo": f"{commodity.codigo}{codigo}{ano_2dig}",
                            "ativo": data_venc >= today,
                        },
                    )


def unseed_meses(apps, schema_editor):
    MesContratoFurturo = apps.get_model("meses_contrato_futuro", "MesContratoFurturo")
    MesContratoFurturo.objects.filter(ano__in=ANOS).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("meses_contrato_futuro", "0001_initial"),
        ("commodities", "0003_populate_imagem_url"),
    ]

    operations = [
        migrations.RunPython(seed_meses, unseed_meses),
    ]
