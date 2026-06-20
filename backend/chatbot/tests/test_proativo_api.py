# backend/chatbot/tests/test_proativo_api.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from usuario.models import Usuario
from chatbot.models import Conversation, ConversationMessage

User = get_user_model()


class ProativoApiTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="api@t.com", password="p")
        Usuario.objects.get_or_create(user=self.user)
        self.outro = User.objects.create_user(username="outro@t.com", password="p")
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def _msg_proativa(self, user, lida=False):
        conv, _ = Conversation.objects.get_or_create(user=user, is_proativa=True)
        return ConversationMessage.objects.create(
            conversation=conv, role="ai", content="alerta", is_proativa=True,
            lida_em=None if not lida else __import__("django.utils.timezone", fromlist=["now"]).now(),
        )

    def test_nao_lidas_conta_apenas_do_usuario(self):
        self._msg_proativa(self.user)
        self._msg_proativa(self.outro)  # nao deve contar
        resp = self.client.get("/api/v1/chat/proativo/nao-lidas/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["nao_lidas"], 1)

    def test_conversa_retorna_mensagens_do_usuario(self):
        self._msg_proativa(self.user)
        resp = self.client.get("/api/v1/chat/proativo/")
        self.assertEqual(resp.status_code, 200)
        body = resp.json()
        self.assertIn("conversation_id", body)
        self.assertEqual(len(body["messages"]), 1)

    def test_marcar_lidas_zera_contador(self):
        self._msg_proativa(self.user)
        self.client.post("/api/v1/chat/proativo/marcar-lidas/")
        resp = self.client.get("/api/v1/chat/proativo/nao-lidas/")
        self.assertEqual(resp.json()["nao_lidas"], 0)
