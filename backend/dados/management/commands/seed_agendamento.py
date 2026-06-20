from django.core.management.base import BaseCommand
from django_celery_beat.models import IntervalSchedule, PeriodicTask

AGENDAMENTOS = [
    ("dados.tasks.agrobr.atualizar_precos_cepea", "Atualizar precos CEPEA", 1, IntervalSchedule.HOURS),
    ("dados.tasks.agrobr.atualizar_futuros_b3", "Atualizar futuros B3", 1, IntervalSchedule.HOURS),
    ("dados.tasks.bcb.atualizar_cambio", "Atualizar cambio BCB", 1, IntervalSchedule.HOURS),
]


class Command(BaseCommand):
    help = "Cria/atualiza de forma idempotente o agendamento periodico das tasks de atualizacao de dados."

    def handle(self, *args, **options):
        for task_path, nome, every, period in AGENDAMENTOS:
            schedule, _ = IntervalSchedule.objects.get_or_create(every=every, period=period)
            PeriodicTask.objects.update_or_create(
                name=nome,
                defaults={
                    "task": task_path,
                    "interval": schedule,
                    "enabled": True,
                    "crontab": None,
                },
            )
            self.stdout.write(self.style.SUCCESS(f"Agendado: {nome} -> {task_path}"))
