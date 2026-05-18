import json
import uuid
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from chatbot.models import Conversation

User = get_user_model()


class ConversationCreateViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="conv@test.com", password="pass")
        self.url = "/api/v1/chat/conversations/"

    def test_cria_conversa_autenticado(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.json())
        self.assertEqual(Conversation.objects.filter(user=self.user).count(), 1)

    def test_retorna_uuid_valido(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url)
        uuid.UUID(response.json()["id"])

    def test_nao_autenticado_retorna_401(self):
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_outro_usuario_nao_ve_conversa(self):
        outro = User.objects.create_user(username="outro@test.com", password="pass")
        conv = Conversation.objects.create(user=self.user)
        self.client.force_authenticate(user=outro)
        response = self.client.get(f"{self.url}{conv.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ChatStreamAuthTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(username="stream_a@test.com", password="pass")
        self.user_b = User.objects.create_user(username="stream_b@test.com", password="pass")
        self.conv = Conversation.objects.create(user=self.user_a)
        self.url = "/api/v1/chat/stream/"

    def test_nao_autenticado_retorna_401(self):
        response = self.client.post(
            self.url,
            data=json.dumps({"conversation_id": str(self.conv.id), "message": "oi"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_usuario_b_nao_acessa_conversa_do_usuario_a(self):
        self.client.force_authenticate(user=self.user_b)
        response = self.client.post(
            self.url,
            data=json.dumps({"conversation_id": str(self.conv.id), "message": "oi"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 403)

    def test_conversa_inexistente_retorna_404(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(
            self.url,
            data=json.dumps({"conversation_id": str(uuid.uuid4()), "message": "oi"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)

    def test_mensagem_vazia_retorna_400(self):
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post(
            self.url,
            data=json.dumps({"conversation_id": str(self.conv.id), "message": ""}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 400)
