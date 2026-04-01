import pytest
from django.test import TestCase
from analises.calculators import toneladas_para_sacas


class TestConversaoUnidade:
    def test_soja_60_toneladas_igual_1000_sacas(self):
        assert toneladas_para_sacas(60.0, "SOJA") == 1000

    def test_acucar_50_toneladas_igual_1000_sacas(self):
        assert toneladas_para_sacas(50.0, "ACUCAR") == 1000

    def test_milho_6_toneladas_igual_100_sacas(self):
        assert toneladas_para_sacas(6.0, "MILHO") == 100

    def test_commodity_desconhecida_usa_padrao_60kg(self):
        assert toneladas_para_sacas(6.0, "TRIGO") == 100

    def test_codigo_maiusculo_e_minusculo(self):
        assert toneladas_para_sacas(60.0, "soja") == toneladas_para_sacas(60.0, "SOJA")


class TestCenarioAnaliseSerializer(TestCase):
    def _make_cenario(self):
        import datetime
        from analises.models import (
            SolicitacaoAnalise, ResultadoAnalise,
            CenarioAnalise, PontoCurvaResultado,
        )
        from commodities.models import Comomodity
        from tipos_derivativo.models import TipoDerivativo
        from meses_contrato_futuro.models import MesContratoFurturo
        from usuario.models import Usuario
        from django.contrib.auth.models import User

        auth_user = User.objects.create_user(username="teste_serial2", password="x")
        usuario = Usuario.objects.create(first_name="Teste", user=auth_user)

        commodity = Comomodity.objects.create(nome="Milho", codigo="MILHO2", moeda="BRL", unidade="sc")
        tipo = TipoDerivativo.objects.create(nome="put", rotulo="Put2", requer_posicao=True, requer_barreira=False)
        mes = MesContratoFurturo.objects.create(
            commodity=commodity,
            codigo_mes="Z", ano=2027, ativo=True,
            data_vencimento=datetime.date(2027, 12, 14),
            ticket_completo="ZCZ27",
        )
        sol = SolicitacaoAnalise.objects.create(
            usuario=usuario, commodity=commodity,
            tipo_derivativo=tipo, mes_contrato=mes,
            preco_mercado_atual=13000, preco_exercicio=13000,
            quantidade_sacas=1000, posicao="vendedor",
        )
        resultado = ResultadoAnalise.objects.create(
            solicitacao=sol, premio_calculado=350, valor_total_contrato=350000,
        )
        cenario = CenarioAnalise.objects.create(
            resultado=resultado, nome="moderado",
            preco_exercicio_centavos=12870, premio_centavos=310,
            e_recomendado=True,
        )
        PontoCurvaResultado.objects.create(
            cenario=cenario, preco_centavos=12000, resultado_centavos=560,
        )
        return cenario

    def test_campos_monetarios_convertidos_para_reais(self):
        from analises.serializers import CenarioAnaliseSerializer
        cenario = self._make_cenario()
        data = CenarioAnaliseSerializer(cenario).data
        assert data["preco_exercicio"] == 128.70
        assert data["premio"] == 3.10
        assert data["valor_total"] == 3100.00
        assert data["ponto_equilibrio"] == 125.60

    def test_pontos_curva_aninhados(self):
        from analises.serializers import CenarioAnaliseSerializer
        cenario = self._make_cenario()
        data = CenarioAnaliseSerializer(cenario).data
        assert len(data["pontos_curva"]) == 1
        assert data["pontos_curva"][0]["preco"] == 120.00
        assert data["pontos_curva"][0]["resultado"] == 5.60

    def test_resultado_analise_serializer_inclui_cenarios(self):
        from analises.serializers import ResultadoAnaliseSerializer
        cenario = self._make_cenario()
        data = ResultadoAnaliseSerializer(cenario.resultado).data
        assert "cenarios" in data
        assert len(data["cenarios"]) == 1
        assert data["cenarios"][0]["nome"] == "moderado"
