from __future__ import annotations

import logging
from datetime import date, timedelta

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constantes fisicas (fontes: USDA, CBOT, ICE)
# ---------------------------------------------------------------------------
SACA_KG: float = 60.0
KG_PER_BUSHEL_CORN: float = 25.401    # milho — USDA
KG_PER_BUSHEL_SOY: float  = 27.216    # soja  — USDA
KG_PER_LB: float           = 0.45359237

# Fatores derivados
SACAS_PER_BUSHEL_ZC: float = SACA_KG / KG_PER_BUSHEL_CORN   # ~2.362
SACAS_PER_BUSHEL_ZS: float = SACA_KG / KG_PER_BUSHEL_SOY    # ~2.205
LBS_PER_SACA_KC: float     = SACA_KG / KG_PER_LB             # ~132.277
BU_PER_MT_ZS: float        = 1000.0  / KG_PER_BUSHEL_SOY     # ~36.744

# ---------------------------------------------------------------------------
# Documentacao das unidades B3 por contrato (para referencia e auditoria)
# ---------------------------------------------------------------------------
# ZC (CCM - Milho Campinas): ajuste_atual em BRL/saca (60 kg)
# ZS (SFI - Soja FOB Santos): ajuste_atual em USD/tonelada metrica
# KC (ICF - Cafe Arabica):    ajuste_atual em USD/saca (60 kg)
#
# Documentacao das unidades CEPEA por commodity:
# ZC (milho), ZS (soja), KC (cafe): valor em BRL/saca (60 kg)

_CEPEA_UNIDADE_ESPERADA: dict[str, str] = {
    "ZC": "r$/sc 60 kg",
    "ZS": "r$/sc 60 kg",
    "KC": "r$/sc 60 kg",
}


_UNIDADES_POR_SACA: dict[str, float] = {
    "KC": LBS_PER_SACA_KC,      # USD/lb -> USD/saca 60 kg (~132.277 lb/saca)
    "ZC": SACAS_PER_BUSHEL_ZC,  # USD/bu -> USD/saca 60 kg (~2.362 bu/saca, milho)
    "ZS": SACAS_PER_BUSHEL_ZS,  # USD/bu -> USD/saca 60 kg (~2.205 bu/saca, soja)
}


def unidades_por_saca(codigo: str) -> float:
    """
    Fator que converte um preco em USD/unidade-padrao da commodity para
    USD por saca de 60 kg (libras para cafe, bushels para milho/soja).

    Usado para escalar premio/lucro de Black-Scholes (calculado em USD/unidade)
    para o valor monetario total do contrato, que e expresso em sacas.

    Codigo nao mapeado retorna 1.0 (sem conversao) com warning, evitando
    quebrar o calculo para commodities ainda nao cadastradas.
    """
    fator = _UNIDADES_POR_SACA.get((codigo or "").upper())
    if fator is None:
        logger.warning(
            "unidades_por_saca: codigo '%s' nao mapeado; usando fator 1.0 "
            "(valor total nao convertido para saca). Mapeados: %s.",
            codigo, ", ".join(sorted(_UNIDADES_POR_SACA)),
        )
        return 1.0
    return fator


def converter_b3(codigo: str, preco: float, usd_brl: float | None = None) -> float:
    """
    Converte preco retornado pelo B3 para USD na unidade padrao da commodity.

    Unidades B3 por contrato:
      ZC (CCM): BRL/saca (60 kg) -> USD/bu   (exige usd_brl)
      ZS (SFI): USD/tonelada metrica -> USD/bu
      KC (ICF): USD/saca (60 kg) -> USD/lb

    Retorna: float em USD/unidade-padrao (USD/bu para ZC e ZS, USD/lb para KC).
    Lanca ValueError se codigo nao mapeado ou usd_brl ausente para ZC.
    """
    if codigo == "ZC":
        if not usd_brl or usd_brl <= 0:
            raise ValueError(
                "converter_b3: usd_brl obrigatorio e positivo para ZC "
                "(preco B3 CCM e cotado em BRL/saca)."
            )
        return preco / SACAS_PER_BUSHEL_ZC / usd_brl
    if codigo == "ZS":
        return preco / BU_PER_MT_ZS
    if codigo == "KC":
        return preco / LBS_PER_SACA_KC
    raise ValueError(
        f"converter_b3: codigo '{codigo}' nao mapeado. "
        f"Codigos suportados: ZC, ZS, KC."
    )


def converter_cepea(
    codigo: str,
    preco_brl: float,
    usd_brl: float,
    unidade_cepea: str | None = None,
) -> float:
    """
    Converte preco CEPEA (BRL/saca 60 kg) para USD na unidade padrao da commodity.

    Se unidade_cepea for fornecida e nao corresponder ao esperado, loga warning
    e prossegue usando o fator de saca 60 kg.

    Retorna: float em USD/unidade-padrao.
    Lanca ValueError se codigo nao mapeado ou usd_brl invalido.
    """
    if not usd_brl or usd_brl <= 0:
        raise ValueError("converter_cepea: usd_brl deve ser positivo.")

    esperada = _CEPEA_UNIDADE_ESPERADA.get(codigo)
    if esperada is None:
        raise ValueError(
            f"converter_cepea: codigo '{codigo}' nao mapeado. "
            f"Codigos suportados: ZC, ZS, KC."
        )

    if unidade_cepea is not None and unidade_cepea.strip().lower() != esperada:
        logger.warning(
            "converter_cepea: unidade recebida '%s' difere da esperada '%s' "
            "para %s. Usando fator de saca 60 kg.",
            unidade_cepea, esperada, codigo,
        )

    if codigo == "ZC":
        return preco_brl / SACAS_PER_BUSHEL_ZC / usd_brl
    if codigo == "ZS":
        return preco_brl / SACAS_PER_BUSHEL_ZS / usd_brl
    if codigo == "KC":
        return preco_brl / LBS_PER_SACA_KC / usd_brl
    raise ValueError(f"converter_cepea: codigo '{codigo}' nao mapeado.")


def obter_taxa_usd_brl(tolerancia_dias: int = 7) -> float:
    """
    Le a taxa USD/BRL mais recente de DadosMacroeconomicos.

    Lanca ValueError se:
    - Nenhum registro USD_BRL existe no banco.
    - O registro mais recente e anterior a tolerancia_dias dias.
    """
    from dados.models import DadosMacroeconomicos

    ultimo = (
        DadosMacroeconomicos.objects
        .filter(indicador="USD_BRL")
        .order_by("-data")
        .values_list("data", "valor")
        .first()
    )

    if ultimo is None:
        raise ValueError(
            "obter_taxa_usd_brl: nenhum registro USD_BRL em DadosMacroeconomicos. "
            "Execute a task de atualizacao de dados macro antes de B3/CEPEA."
        )

    data_taxa, valor = ultimo
    limite = date.today() - timedelta(days=tolerancia_dias)
    if data_taxa < limite:
        raise ValueError(
            f"obter_taxa_usd_brl: taxa USD_BRL desatualizada "
            f"(ultima: {data_taxa}, tolerancia: {tolerancia_dias} dias). "
            "Atualize dados macro antes de re-executar."
        )

    return float(valor)
