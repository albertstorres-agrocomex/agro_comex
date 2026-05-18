import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from chatbot.models import Conversation, ConversationMessage

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
