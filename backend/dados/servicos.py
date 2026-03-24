import logging
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