import asyncio
import logging
from datetime import date, timedelta

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def atualizar_futuros_b3(self):
    """
    Busca ajustes diarios e posicoes em aberto dos contratos futuros agricolas
    da B3: boi, cafe_arabica, cafe_conillon, etanol, milho, soja_cross, soja_fob.
    Agendar: diariamente em dia util (ex: 19:30 BRT, apos fechamento B3).
    """
    from agrobr import b3
    from dados.limpeza.agrobr import normalizar_futuros_b3
    from dados.servicos import persistir_cache_dados_mercado

    hoje = date.today()
    contratos = b3.contratos()

    todos_registros = []
    for contrato in contratos:
        try:
            df = asyncio.run(
                b3.historico(
                    contrato=contrato,
                    inicio=hoje - timedelta(days=5),
                    fim=hoje,
                )
            )
            todos_registros.extend(
                normalizar_futuros_b3(df, contrato=contrato,
                fonte="B3_FUTUROS")
            )
        except Exception as exc:
            logger.warning("Erro ao buscar futuros B3 contrato '%s': %s",
            contrato, exc)
            continue

    persistidos = persistir_cache_dados_mercado(todos_registros)
    logger.info("Futuros B3: %d registros persistidos.", persistidos)
    return {"fonte": "B3_FUTUROS", "registros": persistidos}


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def atualizar_precos_cepea(self):
    """
    Busca precos diarios spot do CEPEA para as commodities configuradas.

    ATENCAO — Licenca: dados CEPEA sao CC BY-NC 4.0.
    Uso comercial requer autorizacao da CEPEA/ESALQ.
    Verificar antes de usar em producao comercial.

    Agendar: diariamente em dia util (ex: 18:00 BRT).
    """
    from agrobr import datasets
    from dados.limpeza.agrobr import normalizar_precos_cepea
    from dados.servicos import persistir_cache_dados_mercado

    # Adicionar ou remover commodities conforme necessidade
    COMMODITIES_CEPEA = ["soja", "milho", "cafe", "acucar"]

    todos_registros = []
    for commodity in COMMODITIES_CEPEA:
        try:
            df = asyncio.run(datasets.preco_diario(commodity))
            todos_registros.extend(
                normalizar_precos_cepea(df, commodity=commodity,
                fonte="CEPEA_SPOT")
            )
        except Exception as exc:
            logger.warning("Erro ao buscar preco CEPEA '%s': %s",
            commodity, exc)
            continue

    persistidos = persistir_cache_dados_mercado(todos_registros)
    logger.info("CEPEA: %d registros persistidos.", persistidos)
    return {"fonte": "CEPEA_SPOT", "registros": persistidos}


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def atualizar_estimativa_safra(self):
    """
    Busca estimativa da safra corrente da CONAB via agrobr.
    Agendar: mensalmente (ex: dia 5 de cada mes, apos publicacao CONAB).
    """
    from agrobr import datasets
    from dados.limpeza.agrobr import normalizar_estimativa_safra
    from dados.servicos import persistir_cache_dados_mercado

    CULTURAS = ["soja", "milho", "cafe", "acucar"]

    todos_registros = []
    for cultura in CULTURAS:
        try:
            df = asyncio.run(datasets.estimativa_safra(cultura))
            todos_registros.extend(
                normalizar_estimativa_safra(df, cultura=cultura,
                fonte="CONAB_SAFRA")
            )
        except Exception as exc:
            logger.warning("Erro ao buscar safra CONAB '%s': %s",
            cultura, exc)
            continue

    persistidos = persistir_cache_dados_mercado(todos_registros)
    logger.info("Safra CONAB: %d registros persistidos:", persistidos)
    return {"fonte": "CONAB_SAFRA", "registros": persistidos}


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def atualizar_exportacao(self):
    """
    Busca dados de exportacao agricola (ComexStat via agrobr).
    Agendar: mensalmente.
    """
    from agrobr import datasets
    from dados.limpeza.agrobr import normalizar_exportacao
    from dados.servicos import persistir_cache_dados_mercado

    ano_atual = date.today().year
    CULTURAS = ["soja", "milho", "cafe", "acucar"]

    todos_registros = []
    for cultura in CULTURAS:
        for ano in [ano_atual - 1, ano_atual]:
            try:
                df = asyncio.run(datasets.exportacao(cultura, ano=ano))
                todos_registros.extend(
                    normalizar_exportacao(df, cultura=cultura,
                    fonte="COMEXSTAT_EXPORT")
                )
            except Exception as exc:
                logger.warning(
                    "Erro ao buscar exportacao '%s' ano %s: %s", cultura,
                    ano, exc
                )
                continue

    persistidos = persistir_cache_dados_mercado(todos_registros)
    logger.info("Exportacao: %d registros persistidos.", persistidos)
    return {"fonte": "COMEXSTAT_EXPORT", "registros": persistidos}


@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def atualizar_precos_prohort(self):
    """
    Busca precos de atacado CONAB PROHORT (hortifruti) via agrobr.
    Agendar: diariamente em dia util (ex: 08:00 BRT).
    """
    from agrobr import datasets
    from dados.limpeza.agrobr import normalizar_prohort
    from dados.servicos import persistir_cache_dados_mercado

    try:
        df = asyncio.run(datasets.preco_atacado())
    except Exception as exc:
        logger.exception("Erro ao buscar PROHORT via agrobr: %s", exc)
        raise self.retry(exc=exc)

    registros = normalizar_prohort(df, fonte="CONAB_PROHORT")
    persistidos = persistir_cache_dados_mercado(registros)
    logger.info("PROHORT: %d registros persistidos.", persistidos)
    return {"fonte": "CONAB_PROHORT", "registros": persistidos}
