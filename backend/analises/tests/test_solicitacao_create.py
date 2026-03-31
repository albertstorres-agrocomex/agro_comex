from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from usuario.models import Usuario
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from meses_contrato_futuro.models import MesContratoFurturo
from datetime import date

User = get_user_model()


class SolicitacaoCreateValidationTest(TestCase):
    """Testa que os campos obrigatorios sao rejeitados quando ausentes."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="val@test.com", password="pass")
        self.perfil = Usuario.objects.get_or_create(user=self.user)[0]
        self.commodity = Comomodity.objects.create(
            nome="Soja", codigo="ZS", bolsa="CME", unidade="bushel", moeda="USD"
        )
        self.tipo = TipoDerivativo.objects.create(
            nome="Call",
            rotulo="CALL",
            requer_posicao=True,
            requer_barreira=False,
        )
        self.mes = MesContratoFurturo.objects.create(
            commodity=self.commodity,
            codigo_mes="H",
            ano=2027,
            data_vencimento=date(2027, 3, 31),
            ticket_completo="ZSH27",
            ativo=True,
        )
        self.client.force_authenticate(user=self.user)
        self.url = "/api/v1/solicitacao_analise/"
        self.payload_completo = {
            "commodity": self.commodity.id,
            "tipo_derivativo": self.tipo.id,
            "mes_contrato": self.mes.id,
            "preco_exercicio": 45000,
            "quantidade": 100,
            "unidade_quantidade": "sacas",
            "posicao": "comprador",
        }

    def test_sem_mes_contrato_retorna_400(self):
        payload = {**self.payload_completo}
        del payload["mes_contrato"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("mes_contrato", response.json())

    def test_mes_contrato_null_retorna_400(self):
        payload = {**self.payload_completo, "mes_contrato": None}
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("mes_contrato", response.json())

    def test_sem_preco_exercicio_retorna_400(self):
        payload = {**self.payload_completo}
        del payload["preco_exercicio"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("preco_exercicio", response.json())

    def test_sem_quantidade_retorna_400(self):
        payload = {**self.payload_completo}
        del payload["quantidade"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("quantidade", response.json())

    def test_sem_unidade_quantidade_retorna_400(self):
        payload = {**self.payload_completo}
        del payload["unidade_quantidade"]
        response = self.client.post(self.url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("unidade_quantidade", response.json())
