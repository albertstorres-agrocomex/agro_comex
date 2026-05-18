import re
from langchain.tools import tool
from analises.models import SolicitacaoAnalise
from usuario.models import Usuario


def make_db_tool(django_user):
    """Retorna um LangChain tool vinculado ao usuario autenticado."""

    @tool
    def consultar_analises(query: str) -> str:
        """
        Consulta as analises de derivativos do usuario no banco de dados.

        Use esta ferramenta para responder perguntas sobre as analises do usuario,
        como quantas ele tem, quais estao concluidas, quais sao de soja, qual foi
        a mais recente, qual tem maior preco de exercicio, etc.

        O parametro query descreve o que voce quer buscar, por exemplo:
        - "todas as analises"
        - "analises com status concluido"
        - "analises de soja"
        - "as 5 analises mais recentes"
        """
        try:
            perfil = Usuario.objects.get(user=django_user)
        except Usuario.DoesNotExist:
            return "Usuario sem perfil cadastrado no sistema."

        qs = (
            SolicitacaoAnalise.objects
            .filter(usuario=perfil)
            .select_related("commodity", "tipo_derivativo", "mes_contrato")
            .order_by("-criado_em")
        )

        query_lower = query.lower()

        status_map = {
            "concluido": "concluido", "aprovado": "aprovado",
            "rejeitado": "rejeitado", "aguardando": "aguardando",
            "processando": "processando", "erro": "erro",
        }
        for kw, status_val in status_map.items():
            if kw in query_lower:
                qs = qs.filter(status=status_val)
                break

        for kw in ["soja", "cafe", "milho", "acucar", "boi", "algodao"]:
            if kw in query_lower:
                qs = qs.filter(commodity__nome__icontains=kw)
                break

        for kw in ["call", "put", "swap", "futuro"]:
            if kw in query_lower:
                qs = qs.filter(tipo_derivativo__nome__icontains=kw)
                break

        match = re.search(r"\b(\d+)\b", query)
        limit = min(int(match.group(1)), 20) if match else 10

        analises = list(qs[:limit])

        if not analises:
            return "Nenhuma analise encontrada com os criterios informados."

        linhas = [f"Encontradas {len(analises)} analise(s):\n"]
        for a in analises:
            mes_info = f" | Vencimento: {a.mes_contrato.data_vencimento}" if a.mes_contrato else ""
            linhas.append(
                f"- [ID {a.id}] {a.tipo_derivativo.nome} de {a.commodity.nome}"
                f" | Status: {a.status}"
                f" | Posicao: {a.posicao or '-'}"
                f" | Preco exercicio: {a.preco_exercicio}"
                f"{mes_info}"
                f" | Criado: {a.criado_em.strftime('%d/%m/%Y')}"
            )

        return "\n".join(linhas)

    return consultar_analises
