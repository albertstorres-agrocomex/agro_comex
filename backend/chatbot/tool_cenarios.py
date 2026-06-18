# backend/chatbot/tool_cenarios.py
from langchain.tools import tool
from usuario.models import Usuario
from analises.models import SolicitacaoAnalise, CenarioAnalise
from analises.price_utils import centavos_para_usd


def make_cenarios_tool(django_user):
    """Retorna a tool de cenarios vinculada ao usuario autenticado."""

    @tool
    def consultar_cenarios(analise_id: int) -> str:
        """
        Consulta os cenarios de uma analise do usuario (propostos, recomendado
        pelo sistema e escolhido). Use para comparar cenarios, ajudar o usuario
        a escolher, ou avaliar o cenario ja escolhido. O parametro analise_id e
        o ID da analise; quando a conversa estiver vinculada a uma analise, use
        o ID informado no contexto.
        """
        try:
            perfil = Usuario.objects.get(user=django_user)
        except Usuario.DoesNotExist:
            return "Usuario sem perfil cadastrado no sistema."

        try:
            sol = (
                SolicitacaoAnalise.objects
                .select_related("commodity", "tipo_derivativo")
                .get(id=analise_id, usuario=perfil)
            )
        except (SolicitacaoAnalise.DoesNotExist, ValueError, TypeError):
            return "Nao encontrei essa analise na sua conta."

        cenarios = list(
            CenarioAnalise.objects
            .filter(resultado__solicitacao=sol)
            .order_by("preco_exercicio_centavos")
        )
        if not cenarios:
            return (
                f"A analise {analise_id} ainda nao tem cenarios gerados "
                f"(status atual: {sol.status})."
            )

        unidade = sol.commodity.unidade
        posicao = sol.posicao or "nao informada"
        tipo = sol.tipo_derivativo.nome
        if sol.tipo_derivativo.requer_barreira and sol.nivel_barreira:
            barreira = (
                f"com barreira em USD {centavos_para_usd(sol.nivel_barreira):.2f}"
            )
        else:
            barreira = "sem barreira"

        algum_escolhido = any(c.escolhido_pelo_usuario for c in cenarios)
        linhas = [
            f"Analise {analise_id} — {sol.commodity.nome}, {tipo}, "
            f"posicao {posicao}, {barreira}."
        ]
        if not algum_escolhido:
            linhas.append("Nenhum cenario escolhido ainda — o usuario ainda vai decidir.")
        for c in cenarios:
            marcas = []
            if c.e_recomendado:
                marcas.append("recomendado pelo sistema")
            if c.escolhido_pelo_usuario:
                marcas.append("escolhido pelo usuario")
            sufixo = f" [{', '.join(marcas)}]" if marcas else ""
            linhas.append(
                f"- Cenario {c.nome}: strike USD "
                f"{centavos_para_usd(c.preco_exercicio_centavos):.2f} por {unidade}, "
                f"premio USD {centavos_para_usd(c.premio_centavos):.2f}{sufixo}"
            )
        return "\n".join(linhas)

    return consultar_cenarios
