from django.db import migrations

TASK_PATH_UPDATES = {
    "dados.tasks.atualizar_cambio": "dados.tasks.bcb.atualizar_cambio",
    "dados.tasks.atualizar_selic_ipca": "dados.tasks.bcb.atualizar_selic_ipca",
    "dados.tasks.atualizar_futuros_b3": "dados.tasks.agrobr.atualizar_futuros_b3",
    "dados.tasks.atualizar_precos_cepea": "dados.tasks.agrobr.atualizar_precos_cepea",
    "dados.tasks.atualizar_estimativa_safra": "dados.tasks.agrobr.atualizar_estimativa_safra",
    "dados.tasks.atualizar_exportacao": "dados.tasks.agrobr.atualizar_exportacao",
    "dados.tasks.atualizar_precos_prohort": "dados.tasks.agrobr.atualizar_precos_prohort",
}


def atualizar_paths(apps, schema_editor):
    PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")
    for old_path, new_path in TASK_PATH_UPDATES.items():
        PeriodicTask.objects.filter(task=old_path).update(task=new_path)


def reverter_paths(apps, schema_editor):
    PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")
    for old_path, new_path in TASK_PATH_UPDATES.items():
        PeriodicTask.objects.filter(task=new_path).update(task=old_path)


class Migration(migrations.Migration):

    dependencies = [
        ("dados", "0003_dadosmacroeconomicos"),
        ("django_celery_beat", "0019_alter_periodictasks_options"),
    ]

    operations = [
        migrations.RunPython(atualizar_paths, reverter_paths),
    ]
