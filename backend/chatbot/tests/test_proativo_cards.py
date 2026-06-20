from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from usuario.models import Usuario
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from analises.models import SolicitacaoAnalise

User = get_user_model()


class CardsTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="c@t.com", password="p")
        self.perfil = Usuario.objects.get_or_create(user=self.user)[0]
        self.soja = Comomodity.objects.create(nome="Soja", codigo="ZS", bolsa="CME", unidade="bushel", moeda="USD")
        self.milho = Comomodity.objects.create(nome="Milho", codigo="ZC", bolsa="CME", unidade="bushel", moeda="USD")
        self.call = TipoDerivativo.objects.create(nome="Call", rotulo="CALL")
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def _analise(self, commodity):
        return SolicitacaoAnalise.objects.create(
            usuario=self.perfil, commodity=commodity, tipo_derivativo=self.call,
            preco_mercado_atual=4500, preco_exercicio=4600, status="concluido", posicao="comprador",
        )

    def test_lista_apenas_do_usuario(self):
        self._analise(self.soja)
        outro = User.objects.create_user(username="o@t.com", password="p")
        perfil_outro = Usuario.objects.get_or_create(user=outro)[0]
        SolicitacaoAnalise.objects.create(
            usuario=perfil_outro, commodity=self.soja, tipo_derivativo=self.call,
            preco_mercado_atual=1, preco_exercicio=1, status="concluido",
        )
        resp = self.client.get("/api/v1/chat/proativo/analises/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()["analises"]), 1)

    def test_filtro_por_commodity(self):
        self._analise(self.soja)
        self._analise(self.milho)
        resp = self.client.get("/api/v1/chat/proativo/analises/?commodity=soja")
        self.assertEqual(len(resp.json()["analises"]), 1)
