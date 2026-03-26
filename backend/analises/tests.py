from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from analises.models import SolicitacaoAnalise
from usuario.models import Usuario
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo

User = get_user_model()


class StatusCountViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="test@test.com", password="pass")
        self.perfil = Usuario.objects.get_or_create(user=self.user)[0]
        self.commodity = Comomodity.objects.create(
            nome="Soja", codigo="SOJ", bolsa="CME", unidade="bushel", moeda="USD"
        )
        self.tipo = TipoDerivativo.objects.create(nome="Futuro", rotulo="Futuro")

    def _make(self, st):
        return SolicitacaoAnalise.objects.create(
            usuario=self.perfil,
            commodity=self.commodity,
            tipo_derivativo=self.tipo,
            preco_mercado_atual=100,
            status=st,
        )

    def test_status_count_returns_avaliacao_aprovado_rejeitado(self):
        self._make(SolicitacaoAnalise.Status.CONCLUIDO)
        self._make(SolicitacaoAnalise.Status.APROVADO)
        self._make(SolicitacaoAnalise.Status.REJEITADO)
        self._make(SolicitacaoAnalise.Status.AGUARDANDO)
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/solicitacao_analise/status-count/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["avaliacao"], 1)
        self.assertEqual(data["aprovado"], 1)
        self.assertEqual(data["rejeitado"], 1)
        # total reflects only the 3 displayed segments, not all user records
        self.assertEqual(data["total"], 3)
        self.assertNotIn("aguardando", data)
        self.assertNotIn("concluido", data)

    def test_status_count_only_own_analises(self):
        """Outros usuarios nao interferem na contagem."""
        other_user = User.objects.create_user(username="other@test.com", password="pass")
        other_perfil = Usuario.objects.get_or_create(user=other_user)[0]
        SolicitacaoAnalise.objects.create(
            usuario=other_perfil,
            commodity=self.commodity,
            tipo_derivativo=self.tipo,
            preco_mercado_atual=100,
            status=SolicitacaoAnalise.Status.APROVADO,
        )
        self._make(SolicitacaoAnalise.Status.APROVADO)
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/v1/solicitacao_analise/status-count/")
        self.assertEqual(response.json()["aprovado"], 1)
        self.assertEqual(response.json()["avaliacao"], 0)
        self.assertEqual(response.json()["rejeitado"], 0)
        self.assertEqual(response.json()["total"], 1)
