# backend/chatbot/tests/test_tool_cenarios.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from usuario.models import Usuario
from analises.models import SolicitacaoAnalise, ResultadoAnalise, CenarioAnalise
from chatbot.tool_cenarios import make_cenarios_tool

User = get_user_model()


class CenariosToolTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ana@test.com", password="x")
        self.perfil = Usuario.objects.get_or_create(user=self.user)[0]
        self.soja = Comomodity.objects.create(
            nome="Soja", codigo="ZS", bolsa="B3", unidade="saca", moeda="USD"
        )
        self.tipo = TipoDerivativo.objects.create(
            nome="call", rotulo="Call", requer_barreira=False
        )
        self.sol = SolicitacaoAnalise.objects.create(
            usuario=self.perfil, commodity=self.soja, tipo_derivativo=self.tipo,
            preco_mercado_atual=1300, preco_exercicio=1200,
            quantidade_sacas=1000, posicao="comprador",
            status=SolicitacaoAnalise.Status.CONCLUIDO,
        )
        self.res = ResultadoAnalise.objects.create(solicitacao=self.sol)
        CenarioAnalise.objects.create(
            resultado=self.res, nome="conservador",
            preco_exercicio_centavos=1080, premio_centavos=50,
            e_recomendado=True, escolhido_pelo_usuario=False,
        )
        CenarioAnalise.objects.create(
            resultado=self.res, nome="proposto",
            preco_exercicio_centavos=1200, premio_centavos=30,
            e_recomendado=False, escolhido_pelo_usuario=False,
        )

    def _tool(self):
        return make_cenarios_tool(self.user)

    def test_nao_escolhido_lista_e_marca_recomendado(self):
        out = self._tool().invoke({"analise_id": self.sol.id})
        self.assertIn("conservador", out)
        self.assertIn("proposto", out)
        self.assertIn("recomendado pelo sistema", out)
        self.assertIn("Nenhum cenario escolhido", out)
        self.assertIn("comprador", out)
        self.assertIn("sem barreira", out)
        self.assertIn("USD 10.80", out)  # 1080 centavos

    def test_escolhido_e_marcado(self):
        c = CenarioAnalise.objects.get(resultado=self.res, nome="proposto")
        c.escolhido_pelo_usuario = True
        c.save()
        out = self._tool().invoke({"analise_id": self.sol.id})
        self.assertIn("escolhido pelo usuario", out)
        self.assertNotIn("Nenhum cenario escolhido", out)

    def test_analise_de_outro_usuario_recusa(self):
        outro = User.objects.create_user(username="bob@test.com", password="x")
        Usuario.objects.get_or_create(user=outro)
        out = make_cenarios_tool(outro).invoke({"analise_id": self.sol.id})
        self.assertIn("nao encontrei", out.lower().replace("ã", "a"))

    def test_analise_sem_cenarios(self):
        sol2 = SolicitacaoAnalise.objects.create(
            usuario=self.perfil, commodity=self.soja, tipo_derivativo=self.tipo,
            preco_mercado_atual=1300, preco_exercicio=1200,
            status=SolicitacaoAnalise.Status.PROCESSANDO,
        )
        out = self._tool().invoke({"analise_id": sol2.id})
        self.assertIn("ainda nao tem cenarios", out.lower().replace("ã", "a"))
