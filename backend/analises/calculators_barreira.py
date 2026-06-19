"""Precificacao de opcoes europeias COM barreira (Reiner-Rubinstein).

Separado da formula base (analises.calculators.black_scholes), que precifica
apenas opcoes vanilla. A direcao up/down e inferida do nivel da barreira vs spot.
"""
import math

from analises.calculators import _normal_cdf


def inferir_direcao(H: float, spot: float) -> str:
    if H < spot:
        return "down"
    if H > spot:
        return "up"
    raise ValueError("Barreira igual ao spot: configuracao degenerada")


def black_scholes_barreira(
    S: float, K: float, H: float, T: float, r: float, sigma: float,
    tipo: str, knock: str, direcao: str,
) -> float:
    tipo, knock, direcao = tipo.lower(), knock.lower(), direcao.lower()
    if H <= 0:
        raise ValueError("Barreira deve ser positiva")
    if tipo not in ("call", "put"):
        raise ValueError(f"Tipo invalido para barreira: {tipo}")
    if knock not in ("in", "out"):
        raise ValueError(f"Knock invalido: {knock}")
    if direcao not in ("up", "down"):
        raise ValueError(f"Direcao invalida: {direcao}")

    # Vencimento: out nao tocada vale o intrinseco; in nao tocada vale 0.
    if T <= 0 or sigma <= 0:
        if knock == "out":
            return max(S - K, 0.0) if tipo == "call" else max(K - S, 0.0)
        return 0.0

    phi = 1.0 if tipo == "call" else -1.0
    eta = 1.0 if direcao == "down" else -1.0
    b = r  # sem dividend yield: cost-of-carry = taxa livre de risco
    sst = sigma * math.sqrt(T)
    mu = (b - 0.5 * sigma ** 2) / sigma ** 2
    N = _normal_cdf
    ert = math.exp(-r * T)
    hs_a = (H / S) ** (2.0 * (mu + 1.0))
    hs_b = (H / S) ** (2.0 * mu)

    x1 = math.log(S / K) / sst + (1.0 + mu) * sst
    x2 = math.log(S / H) / sst + (1.0 + mu) * sst
    y1 = math.log(H ** 2 / (S * K)) / sst + (1.0 + mu) * sst
    y2 = math.log(H / S) / sst + (1.0 + mu) * sst

    A = phi * S * N(phi * x1) - phi * K * ert * N(phi * x1 - phi * sst)
    B = phi * S * N(phi * x2) - phi * K * ert * N(phi * x2 - phi * sst)
    C = phi * S * hs_a * N(eta * y1) - phi * K * ert * hs_b * N(eta * y1 - eta * sst)
    D = phi * S * hs_a * N(eta * y2) - phi * K * ert * hs_b * N(eta * y2 - eta * sst)

    acima = K > H  # strike acima da barreira

    if knock == "in":
        if tipo == "call" and direcao == "down":
            price = C if acima else (A - B + D)
        elif tipo == "call" and direcao == "up":
            price = A if acima else (B - C + D)
        elif tipo == "put" and direcao == "down":
            price = (B - C + D) if acima else A
        else:  # put up
            price = (A - B + D) if acima else C
    else:  # out
        if tipo == "call" and direcao == "down":
            price = (A - C) if acima else (B - D)
        elif tipo == "call" and direcao == "up":
            price = 0.0 if acima else (A - B + C - D)
        elif tipo == "put" and direcao == "down":
            price = (A - B + C - D) if acima else 0.0
        else:  # put up
            price = (B - D) if acima else (A - C)

    return max(price, 0.0)
