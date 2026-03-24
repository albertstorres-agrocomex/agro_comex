import logging
from decimal import Decimal
from typing import Any

logger = logging.getLogger(__name__)

def persistir_cache_dados_mercado(registros: list[dict[str, Any]]) -> int:
    """
    Recebe lista de dicts normalizados e faz upsert em CacheDadosMercado.

    Cada dict deve ter:
      codigo_commodity: str  — campo `codigo` da Comomodity
      data_preco:       date
      preco_fechamento: int
      fonte:            str

    Retorna numero de registros persistidos.
    """
    from commodities.models import Comomodity
    from dados.models import CacheDadosMercado

    persistidos = 0

    for registro in registros:
        codigo = registro.get("codigo_commodity")
        if not codigo:
            continue
        
        try:
            commodity = Comomodity.objects.get(codigo=codigo, ativo=True)
        except Comomodity.DoesNotExist:
            logger.debug("Commodity '%s' nao encontrada ou inativa. Ignorando.", codigo)
            continue
        except Comomodity.MultipleObjectsReturned:
            logger.warning("Multiplas commodities com codigo '%s'. Ignorando.", codigo)
            continue

        CacheDadosMercado.objects.update_or_create(
            commodity=commodity,
            data_preco=registro["data_preco"],
            fonte=registro["fonte"],
            defaults={"preco_fechamento": registro["preco_fechamento"]},
        )
        persistidos += 1

    return persistidos


def persistir_dados_macroeconomicos(registros: list[dict]) -> int:
    """
    Recebe lista de dicts normalizados e faz upsert em DadosMacroeconomicos.

    Cada dict deve ter:
      indicador: str  — um dos valores de DadosMacroeconomicos.INDICADORES
      data:      date
      valor:     float
      fonte:     str

    Retorna numero de registros persistidos.
    """
    from dados.models import DadosMacroeconomicos

    persistidos = 0
    indicadores_validos = {k for k, _ in DadosMacroeconomicos.INDICADORES}

    for registro in registros:
        indicador = registro.get("indicador")
        if indicador not in indicadores_validos:
            logger.warning(
                "Indicador macro '%s' nao reconhecido. Ignorando. "
                "Validos: %s", indicador, sorted(indicadores_validos)
            )
            continue

        data = registro.get("data")
        fonte = registro.get("fonte")
        valor = registro.get("valor")
        if data is None or fonte is None or valor is None:
            logger.warning(
                "Registro macro incompleto. Ignorando. registro=%s", registro
            )
            continue

        try:
            DadosMacroeconomicos.objects.update_or_create(
                indicador=indicador,
                data=data,
                defaults={
                    "valor": Decimal(str(valor)),
                    "fonte": fonte,
                },
            )
            persistidos += 1
        except Exception:
            logger.exception(
                "Erro ao persistir indicador macro '%s' data=%s",
                indicador, registro.get("data")
            )

    return persistidos