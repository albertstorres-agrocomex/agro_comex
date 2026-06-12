from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("analises", "0002_fix_status_aguardando"),
    ]

    operations = [
        migrations.AlterField(
            model_name="solicitacaoanalise",
            name="status",
            field=models.CharField(
                choices=[
                    ("aguardando", "Aguardando"),
                    ("processando", "Processando"),
                    ("concluido", "Concluido"),
                    ("erro", "Erro"),
                    ("aprovado", "Aprovado"),
                    ("rejeitado", "Rejeitado"),
                ],
                default="aguardando",
                max_length=20,
            ),
        ),
    ]
