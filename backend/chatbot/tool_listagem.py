# backend/chatbot/tool_listagem.py
import json

from langchain.tools import tool

from usuario.models import Usuario
from analises.models import SolicitacaoAnalise


def make_listagem_tool(django_user):
    @tool
    def listar_analises(commodity: str = "", tipo: str = "", status: str = "") -> str:
        """Lista as analises do usuario logado para ele escolher uma para conversar.
        Use quando o usuario pedir para falar de uma analise ('aquela de soja', 'minha call').
        Filtros opcionais: commodity (ex 'soja'), tipo (ex 'call'/'put'), status."""
        try:
            perfil = Usuario.objects.get(user=django_user)
        except Usuario.DoesNotExist:
            return json.dumps({"tipo": "cards", "payload": []})
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
        return json.dumps({"tipo": "cards", "payload": payload})

    return listar_analises
