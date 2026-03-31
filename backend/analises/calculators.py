import math
import logging
from decimal import Decimal
from datetime import date

logger = logging.getLogger(__name__)

# Importacoes lazy para evitar circular imports em tempo de modulo;
# expostas no escopo do modulo para permitir patching em testes.
try:
    from dados.models import CacheDadosMercado, DadosMacroeconomicos
except ImportError:  # pragma: no cover
    CacheDadosMercado = None  # type: ignore[assignment,misc]
    DadosMacroeconomicos = None  # type: ignore[assignment,misc]

PESO_SACA_KG: dict[str, int] = {
    "SOJA":   60,
    "MILHO":  60,
    "CAFE":   60,
    "ACUCAR": 50,
}
_PESO_SACA_PADRAO = 60


def _normal_cdf(x: float) -> float:
    return (1.0 + math.erf(x / math.sqrt(2.0))) / 2.0


def black_scholes(S: float, K: float, T: float, r: float, sigma: float, tipo: str) -> float:
    """
    Precifica uma opcao europeia pelo modelo Black-Scholes.

    S     : preco atual do ativo subjacente (reais)
    K     : preco de exercicio / strike (reais)
    T     : tempo ate vencimento em anos (>= 0)
    r     : taxa de juros livre de risco (decimal, ex: 0.1075)
    sigma : volatilidade anualizada (decimal, ex: 0.25)
    tipo  : "call" | "put"
    """
    if T <= 0:
        if tipo == "call":
            return max(0.0, S - K)
        return max(0.0, K - S)

    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)

    if tipo == "call":
        return S * _normal_cdf(d1) - K * math.exp(-r * T) * _normal_cdf(d2)
    return K * math.exp(-r * T) * _normal_cdf(-d2) - S * _normal_cdf(-d1)


def calcular_tempo_vencimento(data_vencimento: date) -> float:
    delta = (data_vencimento - date.today()).days
    return max(delta / 365.0, 0.0)


def calcular_volatilidade(commodity, dias: int = 252) -> float | None:
    """
    Calcula volatilidade historica anualizada da commodity.
    Busca os ultimos dias+1 precos de CacheDadosMercado.
    Retorna None se dados insuficientes (minimo 2 precos).
    """
    precos_centavos = list(
        CacheDadosMercado.objects
        .filter(commodity=commodity, fonte__in=["CEPEA_SPOT", "B3_FUTUROS"])
        .order_by("-data_preco")
        .values_list("preco_fechamento", flat=True)[: dias + 1]
    )

    if len(precos_centavos) < 2:
        return None

    precos = list(reversed(precos_centavos))
    retornos = [
        math.log(precos[i] / precos[i - 1])
        for i in range(1, len(precos))
        if precos[i - 1] > 0 and precos[i] > 0
    ]

    if len(retornos) < 1:
        return None

    n = len(retornos)
    media = sum(retornos) / n
    if n == 1:
        return 0.0
    variancia = sum((r - media) ** 2 for r in retornos) / (n - 1)
    return math.sqrt(variancia) * math.sqrt(252)


def obter_taxa_selic() -> float | None:
    """Retorna a SELIC anual mais recente como decimal (ex: 0.1075 para 10.75% a.a.)."""
    valor = (
        DadosMacroeconomicos.objects
        .filter(indicador="SELIC")
        .order_by("-data")
        .values_list("valor", flat=True)
        .first()
    )
    if valor is None:
        return None
    return float(valor) / 100.0


def toneladas_para_sacas(toneladas: float, codigo_commodity: str) -> int:
    peso_saca = PESO_SACA_KG.get(codigo_commodity.upper(), _PESO_SACA_PADRAO)
    kg_total = toneladas * 1000
    return int(kg_total / peso_saca)


def executar_calculo_bs(solicitacao) -> dict:
    """
    Orquestra o calculo Black-Scholes para uma SolicitacaoAnalise.
    Levanta ValueError para tipos nao suportados ou dados insuficientes.
    """
    tipo_nome = solicitacao.tipo_derivativo.nome.lower()

    if tipo_nome not in ("call", "put"):
        raise ValueError(
            f"Tipo de derivativo '{tipo_nome}' nao suportado. "
            "Apenas 'call' e 'put' (opcoes europeias) sao calculados nesta versao."
        )

    if solicitacao.preco_exercicio is None:
        raise ValueError("preco_exercicio e obrigatorio para calculo Black-Scholes.")

    if solicitacao.mes_contrato is None or solicitacao.mes_contrato.data_vencimento is None:
        raise ValueError("mes_contrato com data_vencimento e obrigatorio.")

    S = solicitacao.preco_mercado_atual / 100.0
    K = solicitacao.preco_exercicio / 100.0
    T = calcular_tempo_vencimento(solicitacao.mes_contrato.data_vencimento)

    sigma = calcular_volatilidade(solicitacao.commodity)
    if sigma is None:
        raise ValueError(
            f"Dados historicos insuficientes para calcular volatilidade da commodity "
            f"'{solicitacao.commodity.nome}'."
        )

    r = obter_taxa_selic()
    if r is None:
        raise ValueError("Taxa SELIC nao disponivel em DadosMacroeconomicos.")

    premio_reais = black_scholes(S=S, K=K, T=T, r=r, sigma=sigma, tipo=tipo_nome)
    premio_centavos = round(premio_reais * 100)

    percentual = round((premio_reais / S) * 100, 4) if S > 0 else None

    qtd = solicitacao.quantidade_sacas
    valor_total = round(premio_centavos * qtd) if qtd else None

    if tipo_nome == "put":
        lucro_bruto = K - premio_reais
        lucro_maximo = round(max(lucro_bruto, 0) * 100 * qtd) if qtd else round(max(lucro_bruto, 0) * 100)
    else:
        lucro_maximo = None

    d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T)) if T > 0 else None
    d2 = (d1 - sigma * math.sqrt(T)) if d1 is not None else None

    return {
        "premio_calculado":       premio_centavos,
        "percentual_premio":      Decimal(str(percentual)) if percentual is not None else None,
        "valor_total_contrato":   valor_total,
        "lucro_maximo":           lucro_maximo,
        "volatilidade_utilizada": Decimal(str(round(sigma, 6))),
        "taxa_juros_utilizada":   Decimal(str(round(r, 6))),
        "dados_brutos": {
            "tipo":         tipo_nome,
            "S":            S,
            "K":            K,
            "T":            round(T, 6),
            "r":            round(r, 6),
            "sigma":        round(sigma, 6),
            "d1":           round(d1, 6) if d1 is not None else None,
            "d2":           round(d2, 6) if d2 is not None else None,
            "premio_reais": round(premio_reais, 4),
        },
    }
