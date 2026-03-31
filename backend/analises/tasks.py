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
        from analises.calculators import executar_calculo_bs, executar_analise_cenarios
        resultado = executar_calculo_bs(solicitacao)

        resultado_obj = ResultadoAnalise.objects.create(
            solicitacao=solicitacao,
            premio_calculado=resultado["premio_calculado"],
            percentual_premio=resultado["percentual_premio"],
            valor_total_contrato=resultado["valor_total_contrato"],
            lucro_maximo=resultado["lucro_maximo"],
            volatilidade_utilizada=resultado["volatilidade_utilizada"],
            taxa_juros_utilizada=resultado["taxa_juros_utilizada"],
            dados_brutos=resultado["dados_brutos"],
        )

        # motor de cenarios
        from analises.models import CenarioAnalise, PontoCurvaResultado
        cenarios_data = executar_analise_cenarios(solicitacao)

        for dados_cenario in cenarios_data:
            pontos_curva = dados_cenario.pop("pontos_curva")
            cenario_obj = CenarioAnalise.objects.create(
                resultado=resultado_obj,
                **dados_cenario,
            )
            PontoCurvaResultado.objects.bulk_create([
                PontoCurvaResultado(
                    cenario=cenario_obj,
                    preco_centavos=p["preco_centavos"],
                    resultado_centavos=p["resultado_centavos"],
                )
                for p in pontos_curva
            ])

        solicitacao.status = SolicitacaoAnalise.Status.CONCLUIDO
        solicitacao.save(update_fields=["status"])

        logger.info(
            "Analise %s concluida. Premio: %s centavos. Cenarios: %s.",
            solicitacao_id,
            resultado["premio_calculado"],
            [c["nome"] for c in cenarios_data],
        )
        return {"solicitacao_id": solicitacao_id, "status": "concluido"}

    except Exception as exc:
        logger.exception("Erro ao processar analise %s: %s", solicitacao_id, exc)
        solicitacao.status = SolicitacaoAnalise.Status.ERRO
        solicitacao.save(update_fields=["status"])
        raise
