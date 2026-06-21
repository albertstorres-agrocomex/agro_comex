from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from usuario.models import Usuario
from chatbot.models import Conversation, ConversationMessage

User = get_user_model()


def _fake_executor(texto):
    ex = MagicMock()
    ex.invoke.return_value = {"output": texto}
    return ex


class ProativoAberturaTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ab@t.com", password="p", first_name="Joao")
        Usuario.objects.get_or_create(user=self.user)
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_exige_autenticacao(self):
        anon = APIClient()
        resp = anon.post("/api/v1/chat/proativo/abertura/", {"client_hour": 9}, format="json")
        self.assertIn(resp.status_code, (401, 403))

    def test_rejeita_client_hour_invalido(self):
        resp = self.client.post("/api/v1/chat/proativo/abertura/", {"client_hour": 99}, format="json")
        self.assertEqual(resp.status_code, 400)

    @patch("chatbot.views.create_agent_executor")
    def test_gera_e_persiste_abertura(self, mock_create):
        mock_create.return_value = _fake_executor("Bom-dia, Joao! Tudo certo com suas analises.")
        resp = self.client.post("/api/v1/chat/proativo/abertura/", {"client_hour": 9}, format="json")
        self.assertEqual(resp.status_code, 201)
        body = resp.json()
        self.assertTrue(body["created"])
        self.assertIn("Joao", body["message"]["content"])
        qs = ConversationMessage.objects.filter(
            conversation__user=self.user, tipo_alerta="abertura"
        )
        self.assertEqual(qs.count(), 1)

    @patch("chatbot.views.create_agent_executor")
    def test_nao_duplica_no_mesmo_periodo(self, mock_create):
        mock_create.return_value = _fake_executor("Bom-dia, Joao!")
        self.client.post("/api/v1/chat/proativo/abertura/", {"client_hour": 9}, format="json")
        resp = self.client.post("/api/v1/chat/proativo/abertura/", {"client_hour": 10}, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertFalse(resp.json()["created"])
        qs = ConversationMessage.objects.filter(
            conversation__user=self.user, tipo_alerta="abertura"
        )
        self.assertEqual(qs.count(), 1)
