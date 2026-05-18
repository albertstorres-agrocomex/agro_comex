from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from usuario.models import Usuario
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from analises.models import SolicitacaoAnalise
from chatbot.models import AnaliseEmbedding
from chatbot.tool_rag import make_rag_tool

User = get_user_model()


class RagToolTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="rag@test.com", password="pass")
        self.perfil = Usuario.objects.get_or_create(user=self.user)[0]
        commodity = Comomodity.objects.create(
            nome="Soja", codigo="ZS_rag", bolsa="CME", unidade="bushel", moeda="USD"
        )
        tipo = TipoDerivativo.objects.create(
            nome="Call_rag", rotulo="CALL_rag", requer_posicao=True, requer_barreira=False
        )
        analise = SolicitacaoAnalise.objects.create(
            usuario=self.perfil, commodity=commodity, tipo_derivativo=tipo,
            preco_mercado_atual=4500, preco_exercicio=4600, status="concluido",
        )
        AnaliseEmbedding.objects.create(
            analise=analise, content="Call de Soja concluido",
            content_hash="abc", embedding=[0.1] * 1536,
        )

    @patch("chatbot.tool_rag.openai_client")
    def test_retorna_apenas_analises_do_usuario(self, mock_client):
        mock_client.embeddings.create.return_value = MagicMock(
            data=[MagicMock(embedding=[0.1] * 1536)]
        )
        outro_user = User.objects.create_user(username="outro_rag@test.com", password="pass")
        Usuario.objects.get_or_create(user=outro_user)
        tool = make_rag_tool(outro_user)
        resultado = tool.invoke({"query": "Call de Soja"})
        self.assertIn("Nenhuma", resultado)

    @patch("chatbot.tool_rag.openai_client")
    def test_retorna_resultados_para_usuario_correto(self, mock_client):
        mock_client.embeddings.create.return_value = MagicMock(
            data=[MagicMock(embedding=[0.1] * 1536)]
        )
        tool = make_rag_tool(self.user)
        resultado = tool.invoke({"query": "Call de Soja"})
        self.assertIn("Soja", resultado)
