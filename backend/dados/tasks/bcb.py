import logging
from celery import shared_task

logger = logging.getLogger(__name__)

SERIES_BCB = {
    "USD_BRL": 10813,
    "EUR_BRL": 21619,
    "SELIC":   1,
    "IPCA":    433,
}


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def atualizar_cambio(self):
    """
    Busca cotacoes diarias de dolar e euro no BCB SGS.
    Persiste em DadosMacroeconomicos (nao em CacheDadosMercado,
    pois cambio e indicador macro, nao preco de commodity).
    Agendar: diariamente em dia util (ex: 19:00 BRT).
    """
    from bcb import sgs
    from dados.limpeza.bcb import normalizar_serie_bcb
    from dados.servicos import persistir_dados_macroeconomicos

    try:
        df = sgs.get(
            {"USD_BRL": SERIES_BCB["USD_BRL"], "EUR_BRL": SERIES_BCB["EUR_BRL"]},
            last=20,
        )
    except Exception as exc:
        logger.exception(
            "Falha ao buscar cambio do BCB SGS (series %s/%s): %s",
            SERIES_BCB["USD_BRL"], SERIES_BCB["EUR_BRL"], exc
        )
        raise self.retry(exc=exc)

    registros  = normalizar_serie_bcb(df, fonte="BCB_SGS_CAMBIO")
    persistidos = persistir_dados_macroeconomicos(registros)
    logger.info("BCB cambio: %d registros persistidos em DadosMacroeconomicos.", persistidos)
    return {"fonte": "BCB_SGS_CAMBIO", "registros": persistidos}


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def atualizar_selic_ipca(self):
    """
    Busca SELIC e IPCA do BCB SGS.
    Alimentam taxa_juros_utilizada e correcao em ResultadoAnalise.
    Persiste em DadosMacroeconomicos.
    Agendar: diariamente.
    """
    from bcb import sgs
    from dados.limpeza.bcb import normalizar_serie_bcb
    from dados.servicos import persistir_dados_macroeconomicos

    try:
        df = sgs.get(
            {"SELIC": SERIES_BCB["SELIC"], "IPCA": SERIES_BCB["IPCA"]},
            last=20,
        )
    except Exception as exc:
        logger.exception(
            "Falha ao buscar SELIC/IPCA do BCB SGS (series %s/%s): %s",
            SERIES_BCB["SELIC"], SERIES_BCB["IPCA"], exc
        )
        raise self.retry(exc=exc)

    registros   = normalizar_serie_bcb(df, fonte="BCB_SGS_MACRO")
    persistidos = persistir_dados_macroeconomicos(registros)
    logger.info("BCB SELIC/IPCA: %d registros persistidos em DadosMacroeconomicos.", persistidos)
    return {"fonte": "BCB_SGS_MACRO", "registros": persistidos}
