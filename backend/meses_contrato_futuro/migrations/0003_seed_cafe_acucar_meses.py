import calendar
from datetime import date
from django.db import migrations

# Meses padrao por codigo de commodity (mais confiavel que nome, que pode ter acentuacao variavel)
COMMODITY_CODIGO_MESES = {
    "KC": ["H", "K", "N", "U", "Z"],  # Cafe Arabica
    "SB": ["H", "K", "N", "V"],       # Acucar Bruto
}

CODIGO_MES_NUMERO = {
    "F": 1, "G": 2, "H": 3, "J": 4, "K": 5, "M": 6,
    "N": 7, "Q": 8, "U": 9, "V": 10, "X": 11, "Z": 12,
}

ANOS = [2026, 2027, 2028]


def seed_meses_cafe_acucar(apps, schema_editor):
    Commodity = apps.get_model("commodities", "Comomodity")
    MesContratoFurturo = apps.get_model("meses_contrato_futuro", "MesContratoFurturo")
    today = date.today()

    for codigo_commodity, codigos_mes in COMMODITY_CODIGO_MESES.items():
        try:
            commodity = Commodity.objects.get(codigo=codigo_commodity, ativo=True)
        except Commodity.DoesNotExist:
            continue

        for ano in ANOS:
            for codigo in codigos_mes:
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


def unseed_meses_cafe_acucar(apps, schema_editor):
    Commodity = apps.get_model("commodities", "Comomodity")
    MesContratoFurturo = apps.get_model("meses_contrato_futuro", "MesContratoFurturo")

    for codigo_commodity in COMMODITY_CODIGO_MESES:
        try:
            commodity = Commodity.objects.get(codigo=codigo_commodity)
        except Commodity.DoesNotExist:
            continue
        MesContratoFurturo.objects.filter(commodity=commodity, ano__in=ANOS).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("meses_contrato_futuro", "0002_seed_meses_contrato_futuro"),
        ("commodities", "0003_populate_imagem_url"),
    ]

    operations = [
        migrations.RunPython(seed_meses_cafe_acucar, unseed_meses_cafe_acucar),
    ]
