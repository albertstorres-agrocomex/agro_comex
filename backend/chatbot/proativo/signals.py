# backend/chatbot/proativo/signals.py
from celery.signals import task_success

from chatbot.proativo.deteccao import varrer_alertas_proativos

_TASKS_GATILHO = {
    "dados.tasks.agrobr.atualizar_precos_cepea",
    "dados.tasks.agrobr.atualizar_futuros_b3",
    "dados.tasks.bcb.atualizar_cambio",
}


@task_success.connect
def disparar_varredura(sender=None, **kwargs):
    if sender is not None and getattr(sender, "name", None) in _TASKS_GATILHO:
        varrer_alertas_proativos.delay()
