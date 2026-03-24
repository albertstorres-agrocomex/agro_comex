from django.db import migrations


TASKS = [
    {
        "name": "Atualizar cambio (BCB)",
        "task": "dados.tasks.atualizar_cambio",
        "minute": "0",
        "hour": "19",
        "day_of_week": "1-5",
        "day_of_month": "*",
        "month_of_year": "*",
    },
    {
        "name": "Atualizar SELIC e IPCA (BCB)",
        "task": "dados.tasks.atualizar_selic_ipca",
        "minute": "0",
        "hour": "20",
        "day_of_week": "1-5",
        "day_of_month": "*",
        "month_of_year": "*",
    },
    {
        "name": "Atualizar futuros B3",
        "task": "dados.tasks.atualizar_futuros_b3",
        "minute": "30",
        "hour": "19",
        "day_of_week": "1-5",
        "day_of_month": "*",
        "month_of_year": "*",
    },
    {
        "name": "Atualizar precos CEPEA",
        "task": "dados.tasks.atualizar_precos_cepea",
        "minute": "0",
        "hour": "18",
        "day_of_week": "1-5",
        "day_of_month": "*",
        "month_of_year": "*",
    },
    {
        "name": "Atualizar estimativa de safra",
        "task": "dados.tasks.atualizar_estimativa_safra",
        "minute": "0",
        "hour": "8",
        "day_of_week": "*",
        "day_of_month": "5",
        "month_of_year": "*",
    },
    {
        "name": "Atualizar exportacao",
        "task": "dados.tasks.atualizar_exportacao",
        "minute": "0",
        "hour": "8",
        "day_of_week": "*",
        "day_of_month": "6",
        "month_of_year": "*",
    },
    {
        "name": "Atualizar precos PROHORT",
        "task": "dados.tasks.atualizar_precos_prohort",
        "minute": "0",
        "hour": "8",
        "day_of_week": "1-5",
        "day_of_month": "*",
        "month_of_year": "*",
    },
]


def criar_periodic_tasks(apps, schema_editor):
    CrontabSchedule = apps.get_model("django_celery_beat", "CrontabSchedule")
    PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")

    for t in TASKS:
        crontab, _ = CrontabSchedule.objects.get_or_create(
            minute=t["minute"],
            hour=t["hour"],
            day_of_week=t["day_of_week"],
            day_of_month=t["day_of_month"],
            month_of_year=t["month_of_year"],
            timezone="America/Sao_Paulo",
        )
        PeriodicTask.objects.update_or_create(
            name=t["name"],
            defaults={
                "task": t["task"],
                "crontab": crontab,
                "enabled": True,
            },
        )


def remover_periodic_tasks(apps, schema_editor):
    PeriodicTask = apps.get_model("django_celery_beat", "PeriodicTask")
    nomes = [t["name"] for t in TASKS]
    PeriodicTask.objects.filter(name__in=nomes).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("dados", "0001_initial"),
        ("django_celery_beat", "0019_alter_periodictasks_options"),
    ]

    operations = [
        migrations.RunPython(criar_periodic_tasks, remover_periodic_tasks),
    ]
