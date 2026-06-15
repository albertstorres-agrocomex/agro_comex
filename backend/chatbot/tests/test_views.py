import json
import uuid
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from chatbot.models import Conversation, ConversationMessage
from analises.models import SolicitacaoAnalise
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from usuario.models import Usuario
from chatbot.views import _get_saudacao, _build_analise_context

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


class GetSaudacaoTest(TestCase):
    def test_hora_5_bom_dia(self):
        self.assertEqual(_get_saudacao(5), "Bom-dia")
    def test_hora_11_bom_dia(self):
        self.assertEqual(_get_saudacao(11), "Bom-dia")
    def test_hora_12_boa_tarde(self):
        self.assertEqual(_get_saudacao(12), "Boa tarde")
    def test_hora_17_boa_tarde(self):
        self.assertEqual(_get_saudacao(17), "Boa tarde")
    def test_hora_18_boa_noite(self):
        self.assertEqual(_get_saudacao(18), "Boa noite")
    def test_hora_0_boa_noite(self):
        self.assertEqual(_get_saudacao(0), "Boa noite")
    def test_hora_4_boa_noite(self):
        self.assertEqual(_get_saudacao(4), "Boa noite")
    def test_hora_23_boa_noite(self):
        self.assertEqual(_get_saudacao(23), "Boa noite")


class BuildAnaliseContextTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ctx@test.com", password="pass")
        perfil = Usuario.objects.get_or_create(user=self.user)[0]
        commodity = Comomodity.objects.create(
            nome="SojaCtx", codigo="ZSCTX", bolsa="CME", unidade="bushel", moeda="USD"
        )
        tipo = TipoDerivativo.objects.create(
            nome="CallCtx", rotulo="CALLCTX", requer_posicao=False, requer_barreira=False
        )
        self.analise = SolicitacaoAnalise.objects.create(
            usuario=perfil, commodity=commodity, tipo_derivativo=tipo,
            preco_mercado_atual=4500, preco_exercicio=4600,
            status="concluido", quantidade_sacas=1000,
        )

    def test_retorna_campos_corretos(self):
        ctx = _build_analise_context(self.analise)
        self.assertEqual(ctx["analise_id"], self.analise.id)
        self.assertEqual(ctx["commodity"], "SojaCtx")
        self.assertEqual(ctx["tipo_derivativo"], "CallCtx")
        self.assertEqual(ctx["status"], "concluido")
        self.assertAlmostEqual(ctx["preco_exercicio_reais"], 46.0)
        self.assertEqual(ctx["quantidade_sacas"], 1000)

    def test_quantidade_sacas_none_vira_zero(self):
        self.analise.quantidade_sacas = None
        self.analise.save()
        ctx = _build_analise_context(self.analise)
        self.assertEqual(ctx["quantidade_sacas"], 0)

    def test_sem_mes_contrato_data_vencimento_nao_informado(self):
        ctx = _build_analise_context(self.analise)
        self.assertEqual(ctx["data_vencimento"], "nao informado")


class ConversationCreateGreetingTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="conv2@test.com", password="pass", first_name="Joao"
        )
        self.client.force_authenticate(self.user)
        self.url = "/api/v1/chat/conversations/"
        perfil = Usuario.objects.get_or_create(user=self.user)[0]
        commodity = Comomodity.objects.create(
            nome="SojaView", codigo="ZSVIEW", bolsa="CME", unidade="bushel", moeda="USD"
        )
        tipo = TipoDerivativo.objects.create(
            nome="CallView", rotulo="CALLVIEW", requer_posicao=False, requer_barreira=False
        )
        self.analise = SolicitacaoAnalise.objects.create(
            usuario=perfil, commodity=commodity, tipo_derivativo=tipo,
            preco_mercado_atual=4500, preco_exercicio=4600,
            status="concluido", quantidade_sacas=500,
        )

    def test_criar_sem_analise_retorna_201_greeting_none(self):
        res = self.client.post(self.url, {}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertIn("id", res.data)
        self.assertIsNone(res.data["greeting"])

    def test_criar_com_analise_sem_client_hour_greeting_none(self):
        res = self.client.post(self.url, {"analise_id": self.analise.id}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertIsNone(res.data["greeting"])

    @patch("chatbot.views.create_agent_executor")
    def test_criar_com_analise_e_client_hour_retorna_greeting(self, mock_create):
        mock_executor = MagicMock()
        mock_executor.invoke.return_value = {"output": "Bom-dia, Joao! Analise de SojaView pronta."}
        mock_create.return_value = mock_executor
        res = self.client.post(self.url, {"analise_id": self.analise.id, "client_hour": 9}, format="json")
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data["greeting"], "Bom-dia, Joao! Analise de SojaView pronta.")

    @patch("chatbot.views.create_agent_executor")
    def test_greeting_persistido_como_conversation_message(self, mock_create):
        mock_executor = MagicMock()
        mock_executor.invoke.return_value = {"output": "Boa tarde!"}
        mock_create.return_value = mock_executor
        res = self.client.post(self.url, {"analise_id": self.analise.id, "client_hour": 14}, format="json")
        conv_id = res.data["id"]
        conv = Conversation.objects.get(id=conv_id)
        self.assertTrue(
            ConversationMessage.objects.filter(conversation=conv, role="ai", content="Boa tarde!").exists()
        )

    def test_criar_com_analise_outro_usuario_retorna_404(self):
        outro = User.objects.create_user(username="outro2@test.com", password="pass")
        self.client.force_authenticate(outro)
        res = self.client.post(self.url, {"analise_id": self.analise.id, "client_hour": 9}, format="json")
        self.assertEqual(res.status_code, 404)

    def test_criar_com_analise_inexistente_retorna_404(self):
        res = self.client.post(self.url, {"analise_id": 99999, "client_hour": 9}, format="json")
        self.assertEqual(res.status_code, 404)

    def test_criar_com_client_hour_invalido_retorna_400(self):
        res = self.client.post(self.url, {"analise_id": self.analise.id, "client_hour": 25}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_nao_autenticado_retorna_401(self):
        self.client.force_authenticate(user=None)
        res = self.client.post(self.url, {}, format="json")
        self.assertEqual(res.status_code, 401)
