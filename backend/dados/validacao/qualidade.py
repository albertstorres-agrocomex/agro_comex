import logging
import math
from datetime import date, timedelta
from enum import Enum

logger = logging.getLogger(__name__)


class QualidadeDado(str, Enum):
    OK       = "OK"
    SUSPEITO = "SUSPEITO"
    INVALIDO = "INVALIDO"


RANGE_MACRO: dict[str, tuple[float, float]] = {
    "USD_BRL": (1.0, 20.0),
    "SELIC":   (0.0, 100.0),
    "IPCA":    (-5.0, 50.0),
}

_VAR_SUSPEITO = 0.15   # 15%
_VAR_INVALIDO = 0.50   # 50%
_Z_SUSPEITO   = 3.0
_Z_INVALIDO   = 5.0
_JANELA_DIAS  = 90
_MIN_HISTORICO = 10    # minimo de registros para calcular z-score


def _pior(a: "QualidadeDado", b: "QualidadeDado") -> "QualidadeDado":
    ordem = [QualidadeDado.OK, QualidadeDado.SUSPEITO, QualidadeDado.INVALIDO]
    return ordem[max(ordem.index(a), ordem.index(b))]


def validar_preco(
    codigo: str,
    preco: float,
    data: date,
    fonte: str,
) -> tuple["QualidadeDado", str | None]:
    """
    Valida preco (em centavos) para codigo_commodity na data informada.

    Etapa 1 — estrutural: raise ValueError se preco <= 0 ou NaN.
    Etapa 2 — outlier: compara com historico, retorna qualidade e motivo.
    Todos os registros retornados sao persistidos e participam dos calculos.
    """
    if preco is None or (isinstance(preco, float) and math.isnan(preco)):
        raise ValueError(f"Preco nulo/NaN para {codigo} em {data}")
    if preco <= 0:
        raise ValueError(f"Preco nao-positivo ({preco}) para {codigo} em {data}")

    from dados.models import CacheDadosMercado

    qualidade = QualidadeDado.OK
    motivos: list[str] = []

    # --- Variacao diaria ---
    dia_anterior = data - timedelta(days=1)
    preco_anterior = (
        CacheDadosMercado.objects
        .filter(commodity__codigo=codigo, data_preco=dia_anterior, fonte=fonte)
        .order_by("-id")
        .values_list("preco_fechamento", flat=True)
        .first()
    )
    if preco_anterior is not None and preco_anterior > 0:
        variacao = (preco - preco_anterior) / preco_anterior
        variacao_abs = abs(variacao)
        sinal = "+" if variacao >= 0 else ""
        if variacao_abs > _VAR_INVALIDO:
            qualidade = _pior(qualidade, QualidadeDado.INVALIDO)
            motivos.append(f"VARIACAO_DIARIA:{sinal}{variacao * 100:.1f}%")
        elif variacao_abs > _VAR_SUSPEITO:
            qualidade = _pior(qualidade, QualidadeDado.SUSPEITO)
            motivos.append(f"VARIACAO_DIARIA:{sinal}{variacao * 100:.1f}%")

    # --- Z-score historico (90 dias) ---
    janela_inicio = data - timedelta(days=_JANELA_DIAS)
    precos_historicos = list(
        CacheDadosMercado.objects
        .filter(
            commodity__codigo=codigo,
            fonte=fonte,
            data_preco__gte=janela_inicio,
            data_preco__lt=data,
        )
        .values_list("preco_fechamento", flat=True)
    )
    if len(precos_historicos) >= _MIN_HISTORICO:
        n = len(precos_historicos)
        media = sum(precos_historicos) / n
        variancia = sum((x - media) ** 2 for x in precos_historicos) / n
        desvio = math.sqrt(variancia)
        if desvio > 0:
            z = abs(preco - media) / desvio
            if z > _Z_INVALIDO:
                qualidade = _pior(qualidade, QualidadeDado.INVALIDO)
                motivos.append(f"DESVIO_HISTORICO:z={z:.1f}")
            elif z > _Z_SUSPEITO:
                qualidade = _pior(qualidade, QualidadeDado.SUSPEITO)
                motivos.append(f"DESVIO_HISTORICO:z={z:.1f}")

    motivo_str = "|".join(motivos) if motivos else None
    return qualidade, motivo_str


def validar_macro(
    indicador: str,
    valor: float,
    data: date,
) -> tuple["QualidadeDado", str | None]:
    """
    Valida dado macroeconomico.

    Etapa 1 — estrutural: raise ValueError se valor invalido ou fora do range.
    Sem deteccao de outlier no MVP.
    """
    if valor is None or (isinstance(valor, float) and math.isnan(valor)):
        raise ValueError(f"Valor nulo/NaN para {indicador} em {data}")

    # IPCA pode ser negativo (deflacao) — apenas range check
    if indicador not in ("IPCA",) and valor <= 0:
        raise ValueError(f"Valor nao-positivo ({valor}) para {indicador} em {data}")

    if indicador in RANGE_MACRO:
        lo, hi = RANGE_MACRO[indicador]
        if not (lo <= valor <= hi):
            raise ValueError(
                f"Valor {valor} fora do range esperado [{lo}, {hi}] para {indicador} em {data}"
            )

    return QualidadeDado.OK, None


def validar_exportacao(
    codigo: str,
    valor_fob: float,
    data: date,
) -> tuple["QualidadeDado", str | None]:
    """
    Valida dado de exportacao.

    Etapa 1 — estrutural: raise ValueError se valor_fob <= 0 ou NaN.
    Sem deteccao de outlier no MVP.
    """
    if valor_fob is None or (isinstance(valor_fob, float) and math.isnan(valor_fob)):
        raise ValueError(f"Valor FOB nulo/NaN para {codigo} em {data}")
    if valor_fob <= 0:
        raise ValueError(f"Valor FOB nao-positivo ({valor_fob}) para {codigo} em {data}")

    return QualidadeDado.OK, None
