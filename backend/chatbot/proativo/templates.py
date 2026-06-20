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


_ROTULO_SINAL = {
    "knockout": "esta perto do knock-out (risco de perder a protecao)",
    "intrinseco": "ja acumulou um ganho/protecao relevante sobre o premio",
    "vencimento": "esta perto do vencimento com valor a realizar",
}


def melhor_momento(analise, sinais: list[str], spot_usd: float) -> str:
    nome = analise.commodity.nome
    motivos = "; ".join(_ROTULO_SINAL[s] for s in sinais if s in _ROTULO_SINAL)
    return (
        f"Um sinal pra voce avaliar: sua posicao em {nome} {motivos}. "
        f"O spot esta em US$ {spot_usd:.2f}. Vale dar uma olhada e decidir se faz sentido sair."
    )
