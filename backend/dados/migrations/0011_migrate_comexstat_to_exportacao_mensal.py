from django.db import migrations


def migrar_comexstat_para_exportacao_mensal(apps, schema_editor):
    CacheDadosMercado = apps.get_model("dados", "CacheDadosMercado")
    ExportacaoMensal = apps.get_model("dados", "ExportacaoMensal")

    registros = list(CacheDadosMercado.objects.filter(fonte="COMEXSTAT_EXPORT"))
    para_criar = [
        ExportacaoMensal(
            commodity_id=r.commodity_id,
            data_referencia=r.data_preco,
            valor_fob_usd=r.preco_fechamento,
            fonte=r.fonte,
        )
        for r in registros
    ]
    ExportacaoMensal.objects.bulk_create(para_criar, ignore_conflicts=True)
    CacheDadosMercado.objects.filter(fonte="COMEXSTAT_EXPORT").delete()


def reverter_migracao(apps, schema_editor):
    CacheDadosMercado = apps.get_model("dados", "CacheDadosMercado")
    ExportacaoMensal = apps.get_model("dados", "ExportacaoMensal")

    registros = list(ExportacaoMensal.objects.all())
    para_criar = [
        CacheDadosMercado(
            commodity_id=r.commodity_id,
            data_preco=r.data_referencia,
            preco_fechamento=r.valor_fob_usd,
            fonte=r.fonte,
        )
        for r in registros
    ]
    CacheDadosMercado.objects.bulk_create(para_criar, ignore_conflicts=True)
    ExportacaoMensal.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("dados", "0010_alter_exportacaomensal_fonte"),
    ]

    operations = [
        migrations.RunPython(
            migrar_comexstat_para_exportacao_mensal,
            reverse_code=reverter_migracao,
        ),
    ]
