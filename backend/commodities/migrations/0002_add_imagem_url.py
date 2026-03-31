from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('commodities', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='comomodity',
            name='imagem_url',
            field=models.URLField(blank=True, max_length=500, null=True),
        ),
    ]
