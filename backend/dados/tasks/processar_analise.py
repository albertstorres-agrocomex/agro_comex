import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def processar_analise(analise_id: int) -> None:
    """
    Processa uma analise de forma assincrona.
    Stub: marca como em_analise imediatamente e gera resultado placeholder.
    A logica real de analise deve ser implementada aqui.
    """
    from dados.models import Analise

    try:
        analise = Analise.objects.get(pk=analise_id)
    except Analise.DoesNotExist:
        logger.error("Analise %s nao encontrada para processamento.", analise_id)
        return

    analise.status = "em_analise"
    analise.resultado = (
        "Analise em processamento. "
        "O resultado sera disponibilizado em breve."
    )
    analise.save(update_fields=["status", "resultado"])

    logger.info("Analise %s processada com sucesso.", analise_id)
