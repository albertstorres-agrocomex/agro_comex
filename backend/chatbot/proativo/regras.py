from analises.models import CenarioAnalise
import numpy as np


def tem_cenario_escolhido(analise) -> bool:
    return CenarioAnalise.objects.filter(
        resultado__solicitacao=analise, escolhido_pelo_usuario=True
    ).exists()


def estado_cenario(analise) -> str:
    return "resolvido" if tem_cenario_escolhido(analise) else "pendente"


def estado_strike(spot_usd: float, strike_usd: float) -> str:
    return "acima" if spot_usd >= strike_usd else "abaixo"


def valor_intrinseco_usd(tipo_nome: str, spot_usd: float, strike_usd: float) -> float:
    if "call" in tipo_nome.lower():
        return max(0.0, spot_usd - strike_usd)
    return max(0.0, strike_usd - spot_usd)


def proximo_knockout(spot_usd: float, barreira_usd: float, barreira_tipo: str, tolerancia: float = 0.02) -> bool:
    if barreira_tipo != "knock_out" or not barreira_usd:
        return False
    return abs(spot_usd - barreira_usd) / barreira_usd <= tolerancia


def intrinseco_relevante(intrinseco_usd: float, premio_usd: float, fator: float = 1.5) -> bool:
    if premio_usd <= 0:
        return False
    return intrinseco_usd >= fator * premio_usd


def dias_uteis_ate(data_alvo, hoje) -> int:
    return int(np.busday_count(hoje, data_alvo))


def proximo_vencimento(dias_uteis: int, intrinseco_usd: float, limite: int = 5) -> bool:
    return 0 <= dias_uteis <= limite and intrinseco_usd > 0
