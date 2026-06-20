# backend/chatbot/tests/test_proativo_regras.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from usuario.models import Usuario
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from analises.models import SolicitacaoAnalise, ResultadoAnalise, CenarioAnalise
from chatbot.proativo import regras

User = get_user_model()


def _analise(status="concluido"):
    user = User.objects.create_user(username=f"u{SolicitacaoAnalise.objects.count()}@t.com", password="p")
    perfil = Usuario.objects.get_or_create(user=user)[0]
    commodity = Comomodity.objects.create(nome="Soja", codigo="ZS", bolsa="CME", unidade="bushel", moeda="USD")
    tipo = TipoDerivativo.objects.create(nome="Call", rotulo="CALL")
    return SolicitacaoAnalise.objects.create(
        usuario=perfil, commodity=commodity, tipo_derivativo=tipo,
        preco_mercado_atual=4500, preco_exercicio=4600, status=status, posicao="comprador",
    )


def _resultado_com_cenario(analise, escolhido):
    res = ResultadoAnalise.objects.create(
        solicitacao=analise, premio_calculado=100, percentual_premio=Decimal("2.0"),
        valor_total_contrato=1000, lucro_maximo=500, volatilidade_utilizada=Decimal("0.2"),
        taxa_juros_utilizada=Decimal("0.1"), d1=Decimal("0.5"), d2=Decimal("0.4"),
    )
    CenarioAnalise.objects.create(
        resultado=res, nome="moderado", preco_exercicio_centavos=4600, premio_centavos=100,
        escolhido_pelo_usuario=escolhido,
    )


class RegrasTest(TestCase):
    def test_estado_cenario_pendente_sem_cenario(self):
        analise = _analise()
        self.assertEqual(regras.estado_cenario(analise), "pendente")

    def test_estado_cenario_resolvido_com_escolha(self):
        analise = _analise()
        _resultado_com_cenario(analise, escolhido=True)
        self.assertEqual(regras.estado_cenario(analise), "resolvido")

    def test_estado_strike_acima_e_abaixo(self):
        self.assertEqual(regras.estado_strike(47.0, 46.0), "acima")
        self.assertEqual(regras.estado_strike(45.0, 46.0), "abaixo")
        self.assertEqual(regras.estado_strike(46.0, 46.0), "acima")
