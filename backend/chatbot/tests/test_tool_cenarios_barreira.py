# backend/chatbot/tests/test_tool_cenarios_barreira.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from usuario.models import Usuario
from analises.models import SolicitacaoAnalise, ResultadoAnalise, CenarioAnalise
from chatbot.tool_cenarios import make_cenarios_tool

User = get_user_model()


class CenariosToolBarreiraTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="barr_chat@test.com", password="x")
        self.perfil = Usuario.objects.get_or_create(user=self.user)[0]
        self.soja = Comomodity.objects.create(
            nome="Soja", codigo="ZS", bolsa="B3", unidade="saca", moeda="USD"
        )
        self.tipo = TipoDerivativo.objects.create(
            nome="put com barreira", rotulo="Put com barreira", requer_barreira=True
        )
        self.sol = SolicitacaoAnalise.objects.create(
            usuario=self.perfil, commodity=self.soja, tipo_derivativo=self.tipo,
            preco_mercado_atual=1300, preco_exercicio=1200,
            quantidade_sacas=1000, posicao="comprador",
            nivel_barreira=1100, barreira_tipo="knock_in",  # 11.00 < spot 13.00 -> down
            status=SolicitacaoAnalise.Status.CONCLUIDO,
        )
        self.res = ResultadoAnalise.objects.create(solicitacao=self.sol)
        CenarioAnalise.objects.create(
            resultado=self.res, nome="conservador",
            preco_exercicio_centavos=1080, premio_centavos=50,
            e_recomendado=True, escolhido_pelo_usuario=False,
        )

    def test_saida_inclui_rotulo_de_barreira(self):
        out = make_cenarios_tool(self.user).invoke({"analise_id": self.sol.id})
        self.assertIn("down-and-in", out.lower())
        self.assertIn("11.00", out)  # nivel da barreira

    def test_analise_de_outro_usuario_nao_vaza(self):
        outro = User.objects.create_user(username="mallory@test.com", password="x")
        Usuario.objects.get_or_create(user=outro)
        out = make_cenarios_tool(outro).invoke({"analise_id": self.sol.id})
        self.assertIn("nao encontrei", out.lower().replace("ã", "a"))
        self.assertNotIn("down-and-in", out.lower())
