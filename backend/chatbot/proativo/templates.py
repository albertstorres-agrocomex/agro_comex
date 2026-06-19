def cenario_nao_escolhido(analise) -> str:
    nome = analise.commodity.nome
    return (
        f"Vi que sua analise de {nome} ja esta pronta, mas voce ainda nao escolheu "
        f"um cenario. Quando quiser, a gente revisa as opcoes juntos."
    )


def cotacao_cruzou(analise, spot_usd: float, strike_usd: float) -> str:
    nome = analise.commodity.nome
    return (
        f"A cotacao de {nome} cruzou o seu preco de exercicio. O spot esta em "
        f"US$ {spot_usd:.2f} e seu strike e US$ {strike_usd:.2f}. Vale dar uma olhada na sua analise."
    )
