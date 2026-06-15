import hashlib
import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from chatbot.models import Conversation, ConversationMessage, AnaliseEmbedding
from analises.models import SolicitacaoAnalise
from usuario.models import Usuario
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo

User = get_user_model()


class ConversationModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="chat@test.com", password="pass")

    def test_conversation_criada_com_uuid(self):
        conv = Conversation.objects.create(user=self.user)
        self.assertIsInstance(conv.id, uuid.UUID)

    def test_conversation_pertence_ao_usuario(self):
        conv = Conversation.objects.create(user=self.user)
        self.assertEqual(conv.user, self.user)

    def test_mensagem_vinculada_a_conversa(self):
        conv = Conversation.objects.create(user=self.user)
        msg = ConversationMessage.objects.create(
            conversation=conv, role="human", content="ola"
        )
        self.assertEqual(msg.conversation, conv)
        self.assertEqual(msg.role, "human")

    def test_mensagens_ordenadas_por_created_at(self):
        conv = Conversation.objects.create(user=self.user)
        ConversationMessage.objects.create(conversation=conv, role="human", content="1")
        ConversationMessage.objects.create(conversation=conv, role="ai", content="2")
        msgs = list(conv.messages.values_list("content", flat=True))
        self.assertEqual(msgs, ["1", "2"])

    def test_deleta_conversa_deleta_mensagens(self):
        conv = Conversation.objects.create(user=self.user)
        ConversationMessage.objects.create(conversation=conv, role="human", content="x")
        conv_id = conv.id
        conv.delete()
        self.assertFalse(ConversationMessage.objects.filter(conversation_id=conv_id).exists())


class AnaliseEmbeddingModelTest(TestCase):
    def setUp(self):
        self.user_emb = User.objects.create_user(username="emb@test.com", password="pass")
        self.perfil_emb = Usuario.objects.get_or_create(user=self.user_emb)[0]
        commodity = Comomodity.objects.create(
            nome="Soja", codigo="ZS2", bolsa="CME", unidade="bushel", moeda="USD"
        )
        tipo = TipoDerivativo.objects.create(
            nome="Call2", rotulo="CALL2", requer_posicao=True, requer_barreira=False
        )
        self.analise = SolicitacaoAnalise.objects.create(
            usuario=self.perfil_emb, commodity=commodity, tipo_derivativo=tipo,
            preco_mercado_atual=4500, preco_exercicio=4600, status="concluido",
        )

    def test_embedding_vinculado_a_analise(self):
        emb = AnaliseEmbedding.objects.create(
            analise=self.analise,
            content="texto de teste",
            content_hash=hashlib.sha256(b"texto de teste").hexdigest(),
            embedding=[0.1] * 1536,
        )
        self.assertEqual(emb.analise, self.analise)

    def test_deleta_analise_deleta_embedding(self):
        AnaliseEmbedding.objects.create(
            analise=self.analise, content="texto",
            content_hash="abc", embedding=[0.0] * 1536,
        )
        self.analise.delete()
        self.assertFalse(AnaliseEmbedding.objects.exists())


class ConversationAnaliseFKTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="fk@test.com", password="pass")
        self.perfil = Usuario.objects.get_or_create(user=self.user)[0]
        commodity = Comomodity.objects.create(
            nome="SojaFK", codigo="ZSFK", bolsa="CME", unidade="bushel", moeda="USD"
        )
        tipo = TipoDerivativo.objects.create(
            nome="CallFK", rotulo="CALLFK", requer_posicao=False, requer_barreira=False
        )
        self.analise = SolicitacaoAnalise.objects.create(
            usuario=self.perfil, commodity=commodity, tipo_derivativo=tipo,
            preco_mercado_atual=4500, preco_exercicio=4600, status="concluido",
        )

    def test_conversation_analise_nullable(self):
        conv = Conversation.objects.create(user=self.user)
        self.assertIsNone(conv.analise)

    def test_conversation_com_analise_persiste_fk(self):
        conv = Conversation.objects.create(user=self.user, analise=self.analise)
        conv.refresh_from_db()
        self.assertEqual(conv.analise_id, self.analise.id)

    def test_conversation_analise_set_null_ao_deletar_analise(self):
        conv = Conversation.objects.create(user=self.user, analise=self.analise)
        self.analise.delete()
        conv.refresh_from_db()
        self.assertIsNone(conv.analise_id)
