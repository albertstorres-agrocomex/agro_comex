from django.test import TestCase
from django.core.management import call_command
from django_celery_beat.models import PeriodicTask


class SeedAgendamentoTest(TestCase):
    def test_cria_periodic_tasks(self):
        call_command("seed_agendamento")
        self.assertTrue(PeriodicTask.objects.filter(task="dados.tasks.agrobr.atualizar_precos_cepea").exists())
        self.assertTrue(PeriodicTask.objects.filter(task="dados.tasks.bcb.atualizar_cambio").exists())

    def test_idempotente(self):
        call_command("seed_agendamento")
        call_command("seed_agendamento")
        self.assertEqual(PeriodicTask.objects.filter(task="dados.tasks.agrobr.atualizar_precos_cepea").count(), 1)
