# backend/chatbot/tests/test_proativo_nao_lidas_solicitacoes.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from usuario.models import Usuario
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from analises.models import SolicitacaoAnalise
from chatbot.models import Conversation, ConversationMessage

User = get_user_model()


class NaoLidasSolicitacoesTest(TestCase):
    def test_retorna_ids_de_solicitacao(self):
        user = User.objects.create_user(username="nls@t.com", password="p")
        perfil = Usuario.objects.get_or_create(user=user)[0]
        commodity = Comomodity.objects.create(nome="Soja", codigo="ZS", bolsa="CME", unidade="bushel", moeda="USD")
        tipo = TipoDerivativo.objects.create(nome="Call", rotulo="CALL")
        analise = SolicitacaoAnalise.objects.create(
            usuario=perfil, commodity=commodity, tipo_derivativo=tipo,
            preco_mercado_atual=1, preco_exercicio=1, status="concluido",
        )
        conv, _ = Conversation.objects.get_or_create(user=user, is_proativa=True)
        ConversationMessage.objects.create(
            conversation=conv, role="ai", content="x", is_proativa=True,
            solicitacao=analise, tipo_alerta="cotacao_cruzou",
        )
        client = APIClient()
        client.force_authenticate(user)
        body = client.get("/api/v1/chat/proativo/nao-lidas/").json()
        self.assertEqual(body["nao_lidas"], 1)
        self.assertEqual(body["solicitacoes"], [analise.id])
