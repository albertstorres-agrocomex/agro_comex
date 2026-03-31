import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=30)
def processar_analise(self, solicitacao_id: int) -> dict:
    """
    Processa uma SolicitacaoAnalise de forma assincrona via Black-Scholes.

    Fluxo:
      1. Carrega a solicitacao e marca como PROCESSANDO
      2. Executa o calculo Black-Scholes
      3. Persiste ResultadoAnalise com todos os campos calculados
      4. Marca a solicitacao como CONCLUIDO (ou ERRO)
    """
    from analises.models import SolicitacaoAnalise, ResultadoAnalise

    try:
        solicitacao = SolicitacaoAnalise.objects.select_related(
            "commodity", "tipo_derivativo", "mes_contrato"
        ).get(pk=solicitacao_id)
    except SolicitacaoAnalise.DoesNotExist:
        logger.error("SolicitacaoAnalise %s nao encontrada.", solicitacao_id)
        raise

    solicitacao.status = SolicitacaoAnalise.Status.PROCESSANDO
    solicitacao.save(update_fields=["status"])

    try:
        from analises.calculators import executar_calculo_bs
        resultado = executar_calculo_bs(solicitacao)

        ResultadoAnalise.objects.create(
            solicitacao=solicitacao,
            premio_calculado=resultado["premio_calculado"],
            percentual_premio=resultado["percentual_premio"],
            valor_total_contrato=resultado["valor_total_contrato"],
            lucro_maximo=resultado["lucro_maximo"],
            volatilidade_utilizada=resultado["volatilidade_utilizada"],
            taxa_juros_utilizada=resultado["taxa_juros_utilizada"],
            dados_brutos=resultado["dados_brutos"],
        )

        solicitacao.status = SolicitacaoAnalise.Status.CONCLUIDO
        solicitacao.save(update_fields=["status"])

        logger.info("Analise %s concluida. Premio: %s centavos.", solicitacao_id, resultado["premio_calculado"])
        return {"solicitacao_id": solicitacao_id, "status": "concluido"}

    except Exception as exc:
        logger.exception("Erro ao processar analise %s: %s", solicitacao_id, exc)
        solicitacao.status = SolicitacaoAnalise.Status.ERRO
        solicitacao.save(update_fields=["status"])
        raise
