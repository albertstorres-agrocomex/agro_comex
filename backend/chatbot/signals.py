from django.db.models.signals import post_save
from django.dispatch import receiver
from analises.models import SolicitacaoAnalise
from chatbot.tasks import reembedar_analise


@receiver(post_save, sender=SolicitacaoAnalise)
def agendar_reembedding(sender, instance, **kwargs):
    reembedar_analise.delay(instance.id)
