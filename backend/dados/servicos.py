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
      preco_fechamento: int  — em centavos de USD
      fonte:            str

    Etapa 1 (estrutural): registros com preco invalido (<=0, NaN) sao descartados.
    Etapa 2 (outlier): registros com variacao/z-score anomalos sao persistidos com flag.
    Retorna numero de registros persistidos.
    """
    from commodities.models import Comomodity
    from dados.models import CacheDadosMercado
    from dados.validacao.qualidade import validar_preco

    persistidos = 0

    for registro in registros:
        codigo = registro.get("codigo_commodity")
        if not codigo:
            continue

        preco = registro.get("preco_fechamento")
        data_preco = registro.get("data_preco")
        fonte = registro.get("fonte")

        try:
            qualidade, motivo = validar_preco(codigo, preco, data_preco, fonte)
        except ValueError as exc:
            logger.warning(
                "Preco descartado (falha estrutural) — commodity=%s data=%s: %s",
                codigo, data_preco, exc,
            )
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
            data_preco=data_preco,
            fonte=fonte,
            defaults={
                "preco_fechamento": preco,
                "qualidade": qualidade.value,
                "motivo_qualidade": motivo,
            },
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

    from dados.validacao.qualidade import validar_macro

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
            qualidade, motivo = validar_macro(indicador, float(valor), data)
        except ValueError as exc:
            logger.warning(
                "Dado macro descartado (falha estrutural) — indicador=%s data=%s: %s",
                indicador, data, exc,
            )
            continue

        try:
            DadosMacroeconomicos.objects.update_or_create(
                indicador=indicador,
                data=data,
                defaults={
                    "valor": Decimal(str(valor)),
                    "fonte": fonte,
                    "qualidade": qualidade.value,
                    "motivo_qualidade": motivo,
                },
            )
            persistidos += 1
        except Exception:
            logger.exception(
                "Erro ao persistir indicador macro '%s' data=%s",
                indicador, registro.get("data")
            )

    return persistidos


def persistir_exportacao_mensal(registros: list[dict[str, Any]]) -> int:
    """
    Recebe lista de dicts normalizados e faz upsert em ExportacaoMensal.

    Formato esperado de cada dict:
      codigo_commodity: str
      data_referencia: date
      valor_fob_usd: int   (centavos de USD, valor_fob * 100)
      fonte: str
    """
    from dados.models import ExportacaoMensal
    from commodities.models import Comomodity

    codigos = {r.get("codigo_commodity") for r in registros} - {None}
    commodities_map = {
        c.codigo: c
        for c in Comomodity.objects.filter(codigo__in=codigos, ativo=True)
    }

    from dados.validacao.qualidade import validar_exportacao

    count = 0
    for registro in registros:
        codigo = registro.get("codigo_commodity")
        if not codigo:
            continue
        commodity = commodities_map.get(codigo)
        if not commodity:
            logger.debug(
                "persistir_exportacao_mensal: commodity '%s' nao encontrada ou inativa, registro ignorado.",
                codigo,
            )
            continue

        valor_fob = registro.get("valor_fob_usd")
        data_ref = registro.get("data_referencia")

        try:
            qualidade, motivo = validar_exportacao(codigo, float(valor_fob), data_ref)
        except ValueError as exc:
            logger.warning(
                "Exportacao descartada (falha estrutural) — commodity=%s data=%s: %s",
                codigo, data_ref, exc,
            )
            continue

        ExportacaoMensal.objects.update_or_create(
            commodity=commodity,
            data_referencia=data_ref,
            fonte=registro["fonte"],
            defaults={
                "valor_fob_usd": valor_fob,
                "qualidade": qualidade.value,
                "motivo_qualidade": motivo,
            },
        )
        count += 1
    return count


def obter_cotacao_cache(commodity):
    """Retorna a cotacao mais recente do cache local para a commodity.

    Returns dict {"preco_usd", "data_preco", "fonte"} ou None se nao houver dado.
    """
    from dados.models import CacheDadosMercado
    from analises.price_utils import centavos_para_usd

    registro = (
        CacheDadosMercado.objects
        .filter(commodity=commodity, fonte__in=["CEPEA_SPOT", "B3_FUTUROS"])
        .order_by("-data_preco")
        .first()
    )
    if registro is None:
        return None
    return {
        "preco_usd": centavos_para_usd(registro.preco_fechamento),
        "data_preco": registro.data_preco,
        "fonte": registro.fonte,
    }