from analises.models import CenarioAnalise


def tem_cenario_escolhido(analise) -> bool:
    return CenarioAnalise.objects.filter(
        resultado__solicitacao=analise, escolhido_pelo_usuario=True
    ).exists()


def estado_cenario(analise) -> str:
    return "resolvido" if tem_cenario_escolhido(analise) else "pendente"


def estado_strike(spot_usd: float, strike_usd: float) -> str:
    return "acima" if spot_usd >= strike_usd else "abaixo"
