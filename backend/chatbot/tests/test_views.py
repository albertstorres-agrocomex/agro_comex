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
