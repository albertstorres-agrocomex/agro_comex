"""
Utilitarios de conversao de preco entre USD e centavos.

Convencao do projeto: todos os valores de preco sao armazenados no banco
como inteiros em centavos. Essas funcoes centralizam a conversao para
evitar divisoes e multiplicacoes espalhadas pelo codigo.
"""


def usd_para_centavos(valor_usd) -> int:
    """Converte um valor em USD (float) para centavos (int) para persistencia."""
    if valor_usd is None:
        return None
    return round(float(valor_usd) * 100)


def centavos_para_usd(centavos) -> float:
    """Converte centavos (int do banco) para USD (float) para entrega ao frontend."""
    if centavos is None:
        return None
    return round(centavos / 100, 2)
