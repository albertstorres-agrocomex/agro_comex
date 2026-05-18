from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from usuario.models import Usuario
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from analises.models import SolicitacaoAnalise
from chatbot.models import AnaliseEmbedding
from chatbot.embedding import build_embedding_content, compute_content_hash
from chatbot.tasks import reembedar_analise

User = get_user_model()


def _criar_analise(suffix=""):
    user = User.objects.create_user(username=f"emb_task{suffix}@test.com", password="pass")
    perfil = Usuario.objects.get_or_create(user=user)[0]
    commodity = Comomodity.objects.create(
        nome=f"Cafe{suffix}", codigo=f"KC{suffix}", bolsa="ICE", unidade="sacas", moeda="USD"
    )
    tipo = TipoDerivativo.objects.create(
        nome=f"Put{suffix}", rotulo=f"PUT{suffix}", requer_posicao=True, requer_barreira=False
    )
    return SolicitacaoAnalise.objects.create(
        usuario=perfil, commodity=commodity, tipo_derivativo=tipo,
        preco_mercado_atual=3000, preco_exercicio=2900, status="concluido",
    )


class BuildEmbeddingContentTest(TestCase):
    def test_contem_nome_commodity(self):
        analise = _criar_analise("1")
        self.assertIn("Cafe1", build_embedding_content(analise))

    def test_contem_tipo_derivativo(self):
        analise = _criar_analise("2")
        self.assertIn("Put2", build_embedding_content(analise))

    def test_contem_status(self):
        analise = _criar_analise("3")
        self.assertIn("concluido", build_embedding_content(analise))


class ReembedarAnaliseTaskTest(TestCase):
    @patch("chatbot.tasks.openai_client")
    def test_cria_embedding_quando_nao_existe(self, mock_client):
        mock_client.embeddings.create.return_value = MagicMock(
            data=[MagicMock(embedding=[0.1] * 1536)]
        )
        analise = _criar_analise("4")
        reembedar_analise(analise.id)
        self.assertTrue(AnaliseEmbedding.objects.filter(analise=analise).exists())
        mock_client.embeddings.create.assert_called_once()

    @patch("chatbot.tasks.openai_client")
    def test_skip_quando_conteudo_nao_mudou(self, mock_client):
        mock_client.embeddings.create.return_value = MagicMock(
            data=[MagicMock(embedding=[0.1] * 1536)]
        )
        analise = _criar_analise("5")
        reembedar_analise(analise.id)
        mock_client.embeddings.create.reset_mock()
        reembedar_analise(analise.id)
        mock_client.embeddings.create.assert_not_called()
