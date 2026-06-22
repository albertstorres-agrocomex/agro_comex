# backend/chatbot/tool_listagem.py
import json

from langchain.tools import tool

from usuario.models import Usuario
from analises.models import SolicitacaoAnalise


def listar_analises_payload(
    django_user, commodity: str = "", tipo: str = "", status: str = ""
) -> dict:
    """Monta o payload de cards das analises do usuario logado, escopado por usuario.

    Reutilizado tanto pela tool do agente quanto pelo caminho deterministico de
    selecao (classificador). Filtros opcionais sao aplicados via icontains."""
    try:
        perfil = Usuario.objects.get(user=django_user)
    except Usuario.DoesNotExist:
        return {"tipo": "cards", "payload": []}
    qs = SolicitacaoAnalise.objects.filter(usuario=perfil).select_related(
        "commodity", "tipo_derivativo"
    ).order_by("-criado_em")
    if commodity:
        qs = qs.filter(commodity__nome__icontains=commodity)
    if tipo:
        qs = qs.filter(tipo_derivativo__nome__icontains=tipo)
    if status:
        qs = qs.filter(status__icontains=status)
    payload = [
        {
            "id": a.id,
            "commodity": a.commodity.nome,
            "tipo": a.tipo_derivativo.nome,
            "status": a.status,
        }
        for a in qs[:12]
    ]
    return {"tipo": "cards", "payload": payload}


def make_listagem_tool(django_user):
    @tool
    def listar_analises(commodity: str = "", tipo: str = "", status: str = "") -> str:
        """Lista as analises do usuario logado para ele escolher uma para conversar.
        Use quando o usuario pedir para falar de uma analise ('aquela de soja', 'minha call').
        Filtros opcionais: commodity (ex 'soja'), tipo (ex 'call'/'put'), status."""
        return json.dumps(
            listar_analises_payload(django_user, commodity, tipo, status)
        )

    return listar_analises
