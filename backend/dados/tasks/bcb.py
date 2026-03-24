import logging
from celery import shared_task

logger = logging.getLogger(__name__)

SERIES_BCB = {
    "USD_BRL": 10813,   # Dolar comercial - venda diaria
    "EUR_BRL": 21619,   # Euro - venda diaria 
    "SELIC": 1,         # Taxa SELIC
    "IPCA": 433,        # IPCA
}


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def atualizar_cambio(self):
    """
    Busca cotacoes diarias de dolar e euro no BCB SGS.
    Agendar: diariamente em dia util (ex: 19:00 BRT).
    """
    from bcb import sgs
    from dados.limpeza.bcb import normalizar_serie_bcb
    from dados.servicos import persistir_cache_dados_mercado

    try:
        df = sgs.get(
            {"USD_BRL": SERIES_BCB["USD_BRL"], "EUR_BRL": SERIES_BCB
            ["EUR_BRL"]},
            last=20,
        )
    except Exception as exc:
        logger.exception("Erro ao buscar cambio BCB: %s", exc)
        raise self.retry(exc=exc)
    
    registros = normalizar_serie_bcb(df, fonte="BCB_SGS_CAMBIO")
    persistidos = persistir_cache_dados_mercado(registros)
    logger.info("Cambio BCB: %d registros persistidos.", persistidos)
    return {"fonte": "BCB_SGS_CAMBIO", "registros": persistidos}


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def atualizar_selic_ipca(self):
    """
    Busca SELIC e IPCA do BCB SGS.
    Alimentam taxa_juros_utilizada e correcao em ResultadoAnalise.
    Agendar: diariamente.
    """
    from bcb import sgs 
    from dados.limpeza.bcb import normalizar_serie_bcb
    from dados.servicos import persistir_cache_dados_mercado

    try:
        df = sgs.get(
            {"SELIC": SERIES_BCB["SELIC"], "IPCA": SERIES_BCB["IPCA"]},
            last=20,
        )
    except Exception as exc:
        logger.exception("Erro ao buscar SELIC/IPCA BCB: %s", exc)
        raise self.retry(exc=exc)
    
    registros = normalizar_serie_bcb(df, fonte="BCB_SGS_MACRO")
    persistidos = persistir_cache_dados_mercado(registros)
    logger.info("SELIC/IPCA BCB: %d registros persistidos.", persistidos)
    return {"fonte": "BCB_SGS_MACRO", "registros": persistidos}