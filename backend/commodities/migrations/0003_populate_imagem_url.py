from django.db import migrations


IMAGEM_MAP = {
    'cafe': 'https://raw.githubusercontent.com/albertstorres/imagem-embed/main/safra_cafe.jpg',
    'café': 'https://raw.githubusercontent.com/albertstorres/imagem-embed/main/safra_cafe.jpg',
    'acucar': 'https://raw.githubusercontent.com/albertstorres/imagem-embed/main/safra_acucar.jpg',
    'açucar': 'https://raw.githubusercontent.com/albertstorres/imagem-embed/main/safra_acucar.jpg',
    'açúcar': 'https://raw.githubusercontent.com/albertstorres/imagem-embed/main/safra_acucar.jpg',
    'milho': 'https://raw.githubusercontent.com/albertstorres/imagem-embed/main/safra_milho.jpg',
    'soja': 'https://raw.githubusercontent.com/albertstorres/imagem-embed/main/safra_soja.jpg',
}


def populate_imagem_url(apps, schema_editor):
    Comomodity = apps.get_model('commodities', 'Comomodity')
    for commodity in Comomodity.objects.all():
        nome_lower = commodity.nome.lower().strip()
        for chave, url in IMAGEM_MAP.items():
            if chave in nome_lower:
                commodity.imagem_url = url
                commodity.save(update_fields=['imagem_url'])
                break


def reverse_populate_imagem_url(apps, schema_editor):
    Comomodity = apps.get_model('commodities', 'Comomodity')
    Comomodity.objects.all().update(imagem_url=None)


class Migration(migrations.Migration):

    dependencies = [
        ('commodities', '0002_add_imagem_url'),
    ]

    operations = [
        migrations.RunPython(populate_imagem_url, reverse_populate_imagem_url),
    ]
