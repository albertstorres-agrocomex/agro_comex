from django.db import migrations


def migrar_comexstat_para_exportacao_mensal(apps, schema_editor):
    CacheDadosMercado = apps.get_model("dados", "CacheDadosMercado")
    ExportacaoMensal = apps.get_model("dados", "ExportacaoMensal")

    # Preflight: ensure no conflicts exist before attempting migration
    existentes = ExportacaoMensal.objects.filter(fonte="COMEXSTAT_EXPORT").count()
    if existentes > 0:
        raise Exception(
            f"Abortando migracao: ExportacaoMensal ja contem {existentes} registros "
            f"com fonte='COMEXSTAT_EXPORT'. Investigue antes de prosseguir."
        )

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
    # A migracao e automaticamente atomica no PostgreSQL (transactional DDL).
    # Se bulk_create falhar, o delete nao sera executado e a transacao sera revertida.
    ExportacaoMensal.objects.bulk_create(para_criar)
    CacheDadosMercado.objects.filter(fonte="COMEXSTAT_EXPORT").delete()


def reverter_migracao(apps, schema_editor):
    CacheDadosMercado = apps.get_model("dados", "CacheDadosMercado")
    ExportacaoMensal = apps.get_model("dados", "ExportacaoMensal")

    registros = list(ExportacaoMensal.objects.filter(fonte="COMEXSTAT_EXPORT"))
    para_criar = [
        CacheDadosMercado(
            commodity_id=r.commodity_id,
            data_preco=r.data_referencia,
            preco_fechamento=r.valor_fob_usd,
            fonte=r.fonte,
        )
        for r in registros
    ]
    CacheDadosMercado.objects.bulk_create(para_criar)
    ExportacaoMensal.objects.filter(fonte="COMEXSTAT_EXPORT").delete()


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
