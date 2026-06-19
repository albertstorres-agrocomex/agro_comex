from django.db import migrations


def desativar_forward_swap(apps, schema_editor):
    TipoDerivativo = apps.get_model("tipos_derivativo", "TipoDerivativo")
    TipoDerivativo.objects.filter(rotulo__in=["FWD", "SWAP"]).update(disponivel=False)


def reativar_forward_swap(apps, schema_editor):
    TipoDerivativo = apps.get_model("tipos_derivativo", "TipoDerivativo")
    TipoDerivativo.objects.filter(rotulo__in=["FWD", "SWAP"]).update(disponivel=True)


class Migration(migrations.Migration):

    dependencies = [
        ("tipos_derivativo", "0004_tipoderivativo_disponivel"),
    ]

    operations = [
        migrations.RunPython(desativar_forward_swap, reativar_forward_swap),
    ]
