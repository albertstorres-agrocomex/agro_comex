# backend/chatbot/tests/test_selecao_cards.py
import json

from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from django.test import TestCase, TransactionTestCase
from langchain_core.runnables import RunnableLambda
from rest_framework.test import APIClient

from analises.models import SolicitacaoAnalise
from chatbot import views
from chatbot.classificador_selecao import SelecaoAnalise, classificar_selecao
from chatbot.models import Conversation, ConversationMessage
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from usuario.models import Usuario

User = get_user_model()

STREAM_URL = "/api/v1/chat/stream/"


class ClassificadorSelecaoTest(TestCase):
    def test_retorna_resultado_do_classificador(self):
        fake = RunnableLambda(
            lambda _: SelecaoAnalise(quer_selecionar=True, commodity="soja", tipo="put")
        )
        resultado = async_to_sync(classificar_selecao)(
            "quero debater uma analise de put de soja", False, classificador=fake
        )
        self.assertTrue(resultado.quer_selecionar)
        self.assertEqual(resultado.commodity, "soja")
        self.assertEqual(resultado.tipo, "put")

    def test_falha_do_llm_nao_bloqueia_fluxo(self):
        def _boom(_):
            raise RuntimeError("llm indisponivel")

        fake = RunnableLambda(_boom)
        resultado = async_to_sync(classificar_selecao)(
            "qualquer coisa", False, classificador=fake
        )
        self.assertFalse(resultado.quer_selecionar)


def _consumir_stream(response) -> str:
    async def _collect():
        return b"".join([chunk async for chunk in response.streaming_content])

    return async_to_sync(_collect)().decode()


class StreamCardsOnlyTest(TransactionTestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="sc@t.com", password="p")
        self.perfil = Usuario.objects.get_or_create(user=self.user)[0]
        self.soja = Comomodity.objects.create(
            nome="Soja", codigo="ZS", bolsa="CME", unidade="bushel", moeda="USD"
        )
        self.put = TipoDerivativo.objects.create(nome="Put", rotulo="PUT")
        SolicitacaoAnalise.objects.create(
            usuario=self.perfil, commodity=self.soja, tipo_derivativo=self.put,
            preco_mercado_atual=4500, preco_exercicio=4600, status="concluido", posicao="comprador",
        )
        self.conversation = Conversation.objects.create(user=self.user)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def _patch_classificador(self, selecao):
        async def fake(mensagem, tem_ctx, classificador=None):
            return selecao

        views.classificar_selecao = fake
        self.addCleanup(setattr, views, "classificar_selecao", classificar_selecao)

    def _post(self, mensagem):
        return self.client.post(
            STREAM_URL,
            data=json.dumps(
                {"conversation_id": str(self.conversation.id), "message": mensagem}
            ),
            content_type="application/json",
        )

    def test_intencao_selecao_emite_so_cards_sem_texto(self):
        self._patch_classificador(
            SelecaoAnalise(quer_selecionar=True, commodity="soja", tipo="put")
        )
        body = _consumir_stream(self._post("quero debater uma analise de put"))

        self.assertIn('"tipo": "cards"', body)
        self.assertNotIn('"content":', body)  # nenhum frame de texto
        self.assertIn("[DONE]", body)

        # nenhum turno de IA em texto e salvo no modo cards-only
        self.assertFalse(
            ConversationMessage.objects.filter(
                conversation=self.conversation, role="ai"
            ).exists()
        )
        self.assertTrue(
            ConversationMessage.objects.filter(
                conversation=self.conversation, role="human"
            ).exists()
        )

    def test_selecao_sem_resultado_cai_para_texto(self):
        self._patch_classificador(
            SelecaoAnalise(quer_selecionar=True, commodity="cafe")
        )
        body = _consumir_stream(self._post("quero falar de uma analise de cafe"))

        self.assertNotIn('"tipo": "cards"', body)
        self.assertIn('"content":', body)
        self.assertTrue(
            ConversationMessage.objects.filter(
                conversation=self.conversation, role="ai"
            ).exists()
        )
