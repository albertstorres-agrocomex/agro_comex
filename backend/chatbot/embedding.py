import hashlib


def build_embedding_content(analise) -> str:
    mes_info = ""
    if analise.mes_contrato:
        mes_info = f" | Vencimento: {analise.mes_contrato.data_vencimento}"

    return (
        f"Solicitacao de analise: {analise.tipo_derivativo.nome} de {analise.commodity.nome}\n"
        f"Status: {analise.status} | Posicao: {analise.posicao or 'nao informado'}{mes_info}\n"
        f"Commodity: {analise.commodity.nome} ({analise.commodity.bolsa}) | "
        f"Tipo: {analise.tipo_derivativo.nome}\n"
        f"Criado em: {analise.criado_em.strftime('%d/%m/%Y')}"
    )


def compute_content_hash(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()
