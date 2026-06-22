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

from dados.limpeza.conversao import unidades_por_saca

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


def calcular_curva_resultado(
    S: float,
    K: float,
    premio: float,
    posicao: str,
    tipo: str,
    unidades_por_saca: float = 1.0,
) -> list[dict]:
    """
    Gera 25 pontos de resultado financeiro para um cenario,
    cobrindo precos de 50% a 150% de S.

    posicao            : "comprador" | "vendedor"
    tipo               : "call" | "put"
    unidades_por_saca  : fator que converte resultado USD/unidade-padrao ->
                         USD/saca (ex: ~132.277 lb/saca para cafe). Default 1.0
                         mantem a curva na unidade-padrao.
    """
    min_preco = S * 0.5
    max_preco = S * 1.5
    step = (max_preco - min_preco) / 24

    pontos = []
    for i in range(25):
        preco = min_preco + step * i
        if tipo == "put":
            intrinseco = max(0.0, K - preco)
        else:
            intrinseco = max(0.0, preco - K)

        if posicao == "vendedor":
            resultado = premio - intrinseco
        else:
            resultado = intrinseco - premio

        pontos.append({
            "preco_centavos":     round(preco * 100),
            "resultado_centavos": round(resultado * unidades_por_saca * 100),
        })
    return pontos


def executar_calculo_bs(solicitacao) -> dict:
    """
    Orquestra o calculo Black-Scholes para uma SolicitacaoAnalise.
    Levanta ValueError para tipos nao suportados ou dados insuficientes.
    """
    tipo_nome = solicitacao.tipo_derivativo.nome.lower()

    _TIPOS_BARREIRA = ("call com barreira", "put com barreira")
    _TIPOS_FUTUROS = ("forward", "swap")

    if tipo_nome in _TIPOS_BARREIRA:
        raise ValueError(
            f"Tipo de derivativo '{solicitacao.tipo_derivativo.nome}' ainda nao suportado. "
            "Opcoes com barreira (knock-in/knock-out) serao implementadas em versao futura "
            "usando o modelo de Reiner-Rubinstein."
        )

    if tipo_nome in _TIPOS_FUTUROS:
        raise ValueError(
            f"Tipo de derivativo '{solicitacao.tipo_derivativo.nome}' ainda nao suportado. "
            "Forward e Swap serao implementados em versao futura com modelos proprios "
            "(cost-of-carry e VPL de fluxos descontados, respectivamente)."
        )

    if tipo_nome not in ("call", "put"):
        raise ValueError(
            f"Tipo de derivativo '{solicitacao.tipo_derivativo.nome}' nao reconhecido."
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

    # premio sai em USD/unidade-padrao (USD/lb para cafe, USD/bu para graos).
    # Converte para USD/saca antes de escalar pelo numero de sacas contratadas.
    fator_saca = unidades_por_saca(solicitacao.commodity.codigo)
    qtd = solicitacao.quantidade_sacas
    valor_total = round(premio_centavos * fator_saca * qtd) if qtd else None

    if tipo_nome == "put":
        lucro_bruto = max(K - premio_reais, 0)
        lucro_maximo = round(lucro_bruto * 100 * fator_saca * qtd) if qtd else round(lucro_bruto * 100 * fator_saca)
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
        "d1":                     Decimal(str(round(d1, 6))) if d1 is not None else None,
        "d2":                     Decimal(str(round(d2, 6))) if d2 is not None else None,
    }


def executar_calculo_barreira(solicitacao) -> dict:
    """Precifica opcao COM barreira, devolvendo o mesmo formato de dict de
    executar_calculo_bs, com d1/d2 nulos (nao se aplicam a barreira)."""
    # Import lazy para evitar circular import (calculators_barreira importa _normal_cdf daqui).
    from analises.calculators_barreira import black_scholes_barreira, inferir_direcao

    tipo_nome = solicitacao.tipo_derivativo.nome.lower()
    if "call" in tipo_nome:
        tipo = "call"
    elif "put" in tipo_nome:
        tipo = "put"
    else:
        raise ValueError(f"Tipo com barreira nao suportado: {tipo_nome}")

    if solicitacao.preco_exercicio is None:
        raise ValueError("preco_exercicio e obrigatorio para calculo com barreira.")
    if solicitacao.nivel_barreira is None:
        raise ValueError("nivel_barreira e obrigatorio para opcao com barreira.")
    if solicitacao.mes_contrato is None or solicitacao.mes_contrato.data_vencimento is None:
        raise ValueError("mes_contrato com data_vencimento e obrigatorio.")

    S = solicitacao.preco_mercado_atual / 100.0
    K = solicitacao.preco_exercicio / 100.0
    H = solicitacao.nivel_barreira / 100.0
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

    direcao = inferir_direcao(H, S)
    knock = "in" if solicitacao.barreira_tipo == "knock_in" else "out"
    premio_reais = black_scholes_barreira(S, K, H, T, r, sigma, tipo, knock, direcao)
    premio_centavos = round(premio_reais * 100)

    percentual = round((premio_reais / S) * 100, 4) if S > 0 else None

    fator_saca = unidades_por_saca(solicitacao.commodity.codigo)
    qtd = solicitacao.quantidade_sacas
    valor_total = round(premio_centavos * fator_saca * qtd) if qtd else None

    if tipo == "put":
        lucro_bruto = max(K - premio_reais, 0)
        lucro_maximo = round(lucro_bruto * 100 * fator_saca * qtd) if qtd else round(lucro_bruto * 100 * fator_saca)
    else:
        lucro_maximo = None

    return {
        "premio_calculado":       premio_centavos,
        "percentual_premio":      Decimal(str(percentual)) if percentual is not None else None,
        "valor_total_contrato":   valor_total,
        "lucro_maximo":           lucro_maximo,
        "volatilidade_utilizada": Decimal(str(round(sigma, 6))),
        "taxa_juros_utilizada":   Decimal(str(round(r, 6))),
        "d1":                     None,
        "d2":                     None,
    }


def selecionar_calculo(solicitacao) -> dict:
    """Ponto de extensao unico de roteamento de calculo.
    Vanilla -> executar_calculo_bs; barreira -> executar_calculo_barreira.
    Forward/swap permanecem nao suportados (ValueError em executar_calculo_bs)."""
    if solicitacao.tipo_derivativo.requer_barreira:
        return executar_calculo_barreira(solicitacao)
    return executar_calculo_bs(solicitacao)


FATORES_CENARIO: dict[str, float] = {
    "conservador": 0.90,
    "moderado":    0.99,
    "agressivo":   1.07,
}


def recomendar_cenario(cenarios: list[dict], S: float) -> str:
    """
    Retorna o nome do cenario recomendado.
    Criterio primario  : maior premio_centavos (equivalente a maior valor total, pois quantidade e constante).
    Criterio secundario: ponto de equilibrio (preco_exercicio - premio) mais proximo de S.
    """
    max_premio = max(c["premio_centavos"] for c in cenarios)
    candidatos = [c for c in cenarios if c["premio_centavos"] == max_premio]

    if len(candidatos) == 1:
        return candidatos[0]["nome"]

    S_centavos = round(S * 100)
    melhor = min(
        candidatos,
        key=lambda c: abs((c["preco_exercicio_centavos"] - c["premio_centavos"]) - S_centavos),
    )
    return melhor["nome"]


def executar_analise_cenarios(solicitacao) -> list[dict]:
    """
    Executa Black-Scholes para 3 cenarios fixos (conservador/moderado/agressivo)
    e 1 cenario proposto usando o preco_exercicio do usuario diretamente.
    Nao muta o objeto solicitacao original.
    """
    from copy import deepcopy

    S_centavos = solicitacao.preco_mercado_atual
    S = S_centavos / 100.0
    tipo_nome = solicitacao.tipo_derivativo.nome.lower()
    posicao = solicitacao.posicao or "comprador"
    fator_saca = unidades_por_saca(solicitacao.commodity.codigo)

    cenarios: list[dict] = []

    for nome, fator in FATORES_CENARIO.items():
        K_centavos = int(S_centavos * fator)

        clone = deepcopy(solicitacao)
        clone.preco_exercicio = K_centavos

        # selecionar_calculo roteia vanilla vs barreira; para barreira a barreira
        # permanece fixa (nivel_barreira do clone), variando apenas o strike.
        resultado_bs = selecionar_calculo(clone)

        K = K_centavos / 100.0
        premio = resultado_bs["premio_calculado"] / 100.0
        pontos_curva = calcular_curva_resultado(S, K, premio, posicao, tipo_nome, fator_saca)

        cenarios.append({
            "nome":                     nome,
            "preco_exercicio_centavos": K_centavos,
            "premio_centavos":          resultado_bs["premio_calculado"],
            "e_recomendado":            False,
            "pontos_curva":             pontos_curva,
        })

    # Cenario proposto: usa o preco_exercicio do usuario diretamente como K
    K_proposto_centavos = solicitacao.preco_exercicio
    clone_proposto = deepcopy(solicitacao)
    resultado_proposto = selecionar_calculo(clone_proposto)

    K_proposto = K_proposto_centavos / 100.0
    premio_proposto = resultado_proposto["premio_calculado"] / 100.0
    pontos_proposto = calcular_curva_resultado(S, K_proposto, premio_proposto, posicao, tipo_nome, fator_saca)

    cenarios.append({
        "nome":                     "proposto",
        "preco_exercicio_centavos": K_proposto_centavos,
        "premio_centavos":          resultado_proposto["premio_calculado"],
        "e_recomendado":            False,
        "pontos_curva":             pontos_proposto,
    })

    nome_recomendado = recomendar_cenario(
        [c for c in cenarios if c["nome"] != "proposto"], S
    )
    for c in cenarios:
        c["e_recomendado"] = (c["nome"] == nome_recomendado)

    return cenarios