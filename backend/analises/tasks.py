import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def processar_analise(self, solicitacao_id: int) -> dict:
    """
    Processa uma SolicitacaoAnalise de forma assincrona.

    Fluxo:
      1. Carrega a solicitacao e marca como PROCESSANDO
      2. Executa o calculo (substituir pelo calculo real)
      3. Persiste ResultadoAnalise
      4. Marca a solicitacao como CONCLUIDO
    """
    from analises.models import SolicitacaoAnalise, ResultadoAnalise

    try:
        solicitacao = SolicitacaoAnalise.objects.select_related(
            "commodity", "tipo_derivativo", "mes_contrato"
        ).get(pk=solicitacao_id)
    except SolicitacaoAnalise.DoesNotExist:
        logger.error("Solicitacao de Analise %s nao encontrada.", solicitacao_id)
        raise 
    
    solicitacao.status = SolicitacaoAnalise.Status.PROCESSANDO
    solicitacao.save(update_fields=["status"])

    try:
        resultado_calculado = _executar_calculo(solicitacao)

        ResultadoAnalise.objects.create(
            solicitacao=solicitacao,
            nivel_acumulacao=resultado_calculado.get("nivel_acumulacao"),
            volatilidade_utilizada=resultado_calculado.get("volatilidade"),
            taxa_juros_utilizada=resultado_calculado.get("taxa_juros"),
            dados_brutos=resultado_calculado,
        )

        solicitacao.status = SolicitacaoAnalise.Status.CONCLUIDO
        solicitacao.save(update_fields=["status"])

        logger.info("Analise %s concluida.", solicitacao_id)
        return {"solicitacao_id": solicitacao_id, "status": "concluido"}
    except Exception as exc:
        logger.exception("Erro ao processar analise %s: %s", solicitacao_id, exc)
        solicitacao.status = SolicitacaoAnalise.Status.ERRO 
        solicitacao.save(update_fields=["status"])

def _executar_calculo(solicitacao) -> dict:
    """Placeholder — substituir pela logica de calculo real."""
    return {
        "nivel_acumulacao": None,
        "volatilidade": None,
        "taxa_juros": None,
    }