import math
from decimal import Decimal
from datetime import date, timedelta
from unittest.mock import patch, MagicMock
import pytest

from analises.calculators import (
    black_scholes,
    calcular_volatilidade,
    obter_taxa_selic,
    calcular_tempo_vencimento,
    executar_calculo_bs,
    PESO_SACA_KG,
)


class TestBlackScholes:
    def test_call_atm_retorna_valor_positivo(self):
        preco = black_scholes(S=100, K=100, T=1.0, r=0.10, sigma=0.20, tipo="call")
        assert preco > 0

    def test_put_atm_retorna_valor_positivo(self):
        preco = black_scholes(S=100, K=100, T=1.0, r=0.10, sigma=0.20, tipo="put")
        assert preco > 0

    def test_call_deep_in_the_money(self):
        preco = black_scholes(S=200, K=100, T=1.0, r=0.10, sigma=0.20, tipo="call")
        valor_intrinseco = 200 - 100 * math.exp(-0.10 * 1.0)
        assert abs(preco - valor_intrinseco) < 1.0

    def test_put_deep_in_the_money(self):
        preco = black_scholes(S=50, K=100, T=1.0, r=0.10, sigma=0.20, tipo="put")
        valor_intrinseco = 100 * math.exp(-0.10 * 1.0) - 50
        assert abs(preco - valor_intrinseco) < 1.0

    def test_paridade_put_call(self):
        S, K, T, r, sigma = 130.0, 130.0, 0.5, 0.1075, 0.25
        call = black_scholes(S=S, K=K, T=T, r=r, sigma=sigma, tipo="call")
        put  = black_scholes(S=S, K=K, T=T, r=r, sigma=sigma, tipo="put")
        paridade_esperada = S - K * math.exp(-r * T)
        assert abs((call - put) - paridade_esperada) < 0.0001

    def test_opcao_expirada_call(self):
        preco = black_scholes(S=150, K=130, T=0.0, r=0.10, sigma=0.20, tipo="call")
        assert abs(preco - 20.0) < 0.01

    def test_opcao_expirada_put_sem_valor(self):
        preco = black_scholes(S=150, K=130, T=0.0, r=0.10, sigma=0.20, tipo="put")
        assert preco == 0.0

    def test_valores_conhecidos_call(self):
        preco = black_scholes(S=100, K=100, T=1.0, r=0.05, sigma=0.20, tipo="call")
        assert abs(preco - 10.45) < 0.05


class TestCalcularTempoVencimento:
    def test_vencimento_em_1_ano(self):
        vencimento = date.today() + timedelta(days=365)
        T = calcular_tempo_vencimento(vencimento)
        assert abs(T - 1.0) < 0.01

    def test_vencimento_passado_retorna_zero(self):
        vencimento = date.today() - timedelta(days=10)
        T = calcular_tempo_vencimento(vencimento)
        assert T == 0.0

    def test_vencimento_em_6_meses(self):
        vencimento = date.today() + timedelta(days=182)
        T = calcular_tempo_vencimento(vencimento)
        assert abs(T - 0.5) < 0.01


class TestCalcularVolatilidade:
    @patch("analises.calculators.CacheDadosMercado")
    def test_retorna_none_sem_dados(self, MockCache):
        MockCache.objects.filter.return_value.order_by.return_value \
            .values_list.return_value.__getitem__.return_value = []
        commodity = MagicMock()
        resultado = calcular_volatilidade(commodity, dias=252)
        assert resultado is None

    @patch("analises.calculators.CacheDadosMercado")
    def test_retorna_none_com_apenas_1_preco(self, MockCache):
        MockCache.objects.filter.return_value.order_by.return_value \
            .values_list.return_value.__getitem__.return_value = [10000]
        commodity = MagicMock()
        resultado = calcular_volatilidade(commodity, dias=252)
        assert resultado is None

    @patch("analises.calculators.CacheDadosMercado")
    def test_volatilidade_serie_constante_e_zero(self, MockCache):
        precos_centavos = [13000] * 30
        MockCache.objects.filter.return_value.order_by.return_value \
            .values_list.return_value.__getitem__.return_value = precos_centavos
        commodity = MagicMock()
        resultado = calcular_volatilidade(commodity, dias=252)
        assert resultado == 0.0

    @patch("analises.calculators.CacheDadosMercado")
    def test_volatilidade_e_positiva_com_variacao(self, MockCache):
        import random
        random.seed(42)
        base = 13000
        precos = [base + random.randint(-500, 500) for _ in range(100)]
        MockCache.objects.filter.return_value.order_by.return_value \
            .values_list.return_value.__getitem__.return_value = precos
        commodity = MagicMock()
        resultado = calcular_volatilidade(commodity, dias=252)
        assert resultado is not None
        assert resultado > 0


class TestObterTaxaSelic:
    @patch("analises.calculators.DadosMacroeconomicos")
    def test_retorna_none_sem_dados(self, MockMacro):
        MockMacro.objects.filter.return_value.order_by.return_value \
            .values_list.return_value.first.return_value = None
        assert obter_taxa_selic() is None

    @patch("analises.calculators.DadosMacroeconomicos")
    def test_converte_percentual_para_decimal(self, MockMacro):
        MockMacro.objects.filter.return_value.order_by.return_value \
            .values_list.return_value.first.return_value = Decimal("10.75")
        resultado = obter_taxa_selic()
        assert abs(resultado - 0.1075) < 0.0001


class TestPesoSacaKg:
    def test_soja_60kg(self):
        assert PESO_SACA_KG["SOJA"] == 60

    def test_milho_60kg(self):
        assert PESO_SACA_KG["MILHO"] == 60

    def test_cafe_60kg(self):
        assert PESO_SACA_KG["CAFE"] == 60

    def test_acucar_50kg(self):
        assert PESO_SACA_KG["ACUCAR"] == 50


class TestToneladasParaSacas:
    def test_soja_60_toneladas_igual_1000_sacas(self):
        from analises.calculators import toneladas_para_sacas
        assert toneladas_para_sacas(60.0, "SOJA") == 1000

    def test_acucar_50_toneladas_igual_1000_sacas(self):
        from analises.calculators import toneladas_para_sacas
        assert toneladas_para_sacas(50.0, "ACUCAR") == 1000

    def test_milho_6_toneladas_igual_100_sacas(self):
        from analises.calculators import toneladas_para_sacas
        assert toneladas_para_sacas(6.0, "MILHO") == 100

    def test_commodity_desconhecida_usa_padrao_60kg(self):
        from analises.calculators import toneladas_para_sacas
        assert toneladas_para_sacas(6.0, "TRIGO") == 100  # 6000kg / 60kg

    def test_codigo_case_insensitive(self):
        from analises.calculators import toneladas_para_sacas
        assert toneladas_para_sacas(60.0, "soja") == 1000


class TestExecutarCalculoBs:
    def _make_solicitacao(self, tipo_nome="call", preco_exercicio=13000, qtd=None):
        from unittest.mock import MagicMock
        from datetime import date, timedelta
        sol = MagicMock()
        sol.tipo_derivativo.nome = tipo_nome
        sol.preco_exercicio = preco_exercicio
        sol.preco_mercado_atual = 13000  # R$130,00
        sol.quantidade_sacas = qtd
        sol.mes_contrato.data_vencimento = date.today() + timedelta(days=180)
        sol.commodity.nome = "Soja"
        return sol

    @patch("analises.calculators.calcular_volatilidade")
    @patch("analises.calculators.obter_taxa_selic")
    def test_retorna_dict_com_chaves_corretas(self, mock_selic, mock_vol):
        from analises.calculators import executar_calculo_bs
        mock_selic.return_value = 0.1075
        mock_vol.return_value = 0.25
        sol = self._make_solicitacao(tipo_nome="call")
        resultado = executar_calculo_bs(sol)
        chaves_esperadas = {
            "premio_calculado", "percentual_premio", "valor_total_contrato",
            "lucro_maximo", "volatilidade_utilizada", "taxa_juros_utilizada", "dados_brutos"
        }
        assert set(resultado.keys()) == chaves_esperadas

    @patch("analises.calculators.calcular_volatilidade")
    @patch("analises.calculators.obter_taxa_selic")
    def test_call_lucro_maximo_e_none(self, mock_selic, mock_vol):
        from analises.calculators import executar_calculo_bs
        mock_selic.return_value = 0.1075
        mock_vol.return_value = 0.25
        sol = self._make_solicitacao(tipo_nome="call")
        resultado = executar_calculo_bs(sol)
        assert resultado["lucro_maximo"] is None

    @patch("analises.calculators.calcular_volatilidade")
    @patch("analises.calculators.obter_taxa_selic")
    def test_put_lucro_maximo_e_positivo(self, mock_selic, mock_vol):
        from analises.calculators import executar_calculo_bs
        mock_selic.return_value = 0.1075
        mock_vol.return_value = 0.25
        sol = self._make_solicitacao(tipo_nome="put", preco_exercicio=14000)  # strike R$140 > preco R$130
        resultado = executar_calculo_bs(sol)
        assert resultado["lucro_maximo"] is not None
        assert resultado["lucro_maximo"] > 0

    def test_tipo_invalido_levanta_value_error(self):
        from analises.calculators import executar_calculo_bs
        sol = self._make_solicitacao(tipo_nome="knock_out")
        with pytest.raises(ValueError, match="nao suportado"):
            executar_calculo_bs(sol)

    def test_sem_preco_exercicio_levanta_value_error(self):
        from analises.calculators import executar_calculo_bs
        sol = self._make_solicitacao(preco_exercicio=None)
        with pytest.raises(ValueError, match="preco_exercicio"):
            executar_calculo_bs(sol)

    @patch("analises.calculators.calcular_volatilidade")
    @patch("analises.calculators.obter_taxa_selic")
    def test_valor_total_calculado_quando_ha_quantidade(self, mock_selic, mock_vol):
        from analises.calculators import executar_calculo_bs
        mock_selic.return_value = 0.1075
        mock_vol.return_value = 0.25
        sol = self._make_solicitacao(tipo_nome="call", qtd=1000)
        resultado = executar_calculo_bs(sol)
        assert resultado["valor_total_contrato"] is not None


from django.test import TestCase


class TestCenarioAnaliseModel(TestCase):
    def _make_resultado(self):
        from analises.models import SolicitacaoAnalise, ResultadoAnalise
        from commodities.models import Comomodity
        from tipos_derivativo.models import TipoDerivativo
        from usuario.models import Usuario
        from meses_contrato_futuro.models import MesContratoFurturo
        from django.contrib.auth.models import User
        import datetime

        auth_user = User.objects.create_user(username="teste_model", password="x")
        usuario = Usuario.objects.create(first_name="Teste", user=auth_user)
        commodity = Comomodity.objects.create(nome="Soja", codigo="SOJA", moeda="USD", unidade="sc")
        tipo = TipoDerivativo.objects.create(nome="put", rotulo="Put", requer_posicao=True, requer_barreira=False)
        mes = MesContratoFurturo.objects.create(
            commodity=commodity,
            codigo_mes="K", ano=2026, ativo=True,
            data_vencimento=datetime.date(2026, 5, 14),
            ticket_completo="ZCK26"
        )
        sol = SolicitacaoAnalise.objects.create(
            usuario=usuario, commodity=commodity,
            tipo_derivativo=tipo, mes_contrato=mes,
            preco_mercado_atual=13000, preco_exercicio=13000,
            quantidade_sacas=1000, posicao="vendedor",
        )
        return ResultadoAnalise.objects.create(
            solicitacao=sol,
            premio_calculado=350,
            valor_total_contrato=350000,
        )

    def test_cenario_analise_criado_com_campos_obrigatorios(self):
        from analises.models import CenarioAnalise
        resultado = self._make_resultado()
        cenario = CenarioAnalise.objects.create(
            resultado=resultado,
            nome="conservador",
            fator="0.90",
            preco_exercicio_centavos=11700,
            premio_centavos=280,
            valor_total_centavos=280000,
            ponto_equilibrio_centavos=11420,
            nivel_risco="baixo",
            e_recomendado=False,
        )
        assert cenario.pk is not None
        assert cenario.escolhido_pelo_usuario is False
        assert cenario.escolhido_em is None

    def test_ponto_curva_resultado_criado_vinculado_ao_cenario(self):
        from analises.models import CenarioAnalise, PontoCurvaResultado
        resultado = self._make_resultado()
        cenario = CenarioAnalise.objects.create(
            resultado=resultado, nome="moderado", fator="0.99",
            preco_exercicio_centavos=12870, premio_centavos=310,
            valor_total_centavos=310000, ponto_equilibrio_centavos=12560,
            nivel_risco="medio", e_recomendado=True,
        )
        ponto = PontoCurvaResultado.objects.create(
            cenario=cenario, preco_centavos=12000, resultado_centavos=560,
        )
        assert ponto.pk is not None
        assert ponto.cenario_id == cenario.pk

    def test_unique_together_resultado_nome(self):
        from django.db import IntegrityError
        from analises.models import CenarioAnalise
        resultado = self._make_resultado()
        CenarioAnalise.objects.create(
            resultado=resultado, nome="conservador", fator="0.90",
            preco_exercicio_centavos=11700, premio_centavos=280,
            valor_total_centavos=280000, ponto_equilibrio_centavos=11420,
            nivel_risco="baixo", e_recomendado=False,
        )
        with self.assertRaises(IntegrityError):
            CenarioAnalise.objects.create(
                resultado=resultado, nome="conservador", fator="0.90",
                preco_exercicio_centavos=11700, premio_centavos=280,
                valor_total_centavos=280000, ponto_equilibrio_centavos=11420,
                nivel_risco="baixo", e_recomendado=False,
            )


class TestCalcularCurvaResultado:
    def test_retorna_25_pontos(self):
        from analises.calculators import calcular_curva_resultado
        pontos = calcular_curva_resultado(S=130.0, K=117.0, premio=2.80, posicao="vendedor", tipo="put")
        assert len(pontos) == 25

    def test_todos_pontos_tem_chaves_corretas(self):
        from analises.calculators import calcular_curva_resultado
        pontos = calcular_curva_resultado(S=130.0, K=117.0, premio=2.80, posicao="vendedor", tipo="put")
        for p in pontos:
            assert "preco_centavos" in p
            assert "resultado_centavos" in p

    def test_put_vendedor_lucro_maximo_quando_preco_alto(self):
        # Quando preco final >> K, put nao e exercida: resultado = +premio
        from analises.calculators import calcular_curva_resultado
        pontos = calcular_curva_resultado(S=130.0, K=117.0, premio=2.80, posicao="vendedor", tipo="put")
        ponto_alto = max(pontos, key=lambda p: p["preco_centavos"])
        assert ponto_alto["resultado_centavos"] == round(2.80 * 100)  # +premio

    def test_put_comprador_lucro_quando_preco_muito_baixo(self):
        # Quando preco final << K, put comprador lucra: resultado = K - preco - premio
        from analises.calculators import calcular_curva_resultado
        K, premio = 117.0, 2.80
        pontos = calcular_curva_resultado(S=130.0, K=K, premio=premio, posicao="comprador", tipo="put")
        ponto_baixo = min(pontos, key=lambda p: p["preco_centavos"])
        preco_baixo = ponto_baixo["preco_centavos"] / 100.0
        esperado = round((max(0.0, K - preco_baixo) - premio) * 100)
        assert ponto_baixo["resultado_centavos"] == esperado

    def test_call_vendedor_lucro_maximo_quando_preco_baixo(self):
        # Call vendedor: premio - max(0, preco - K). Preco baixo = max lucro = +premio
        from analises.calculators import calcular_curva_resultado
        pontos = calcular_curva_resultado(S=130.0, K=139.1, premio=1.50, posicao="vendedor", tipo="call")
        ponto_baixo = min(pontos, key=lambda p: p["preco_centavos"])
        assert ponto_baixo["resultado_centavos"] == round(1.50 * 100)

    def test_precos_ordenados_crescentemente(self):
        from analises.calculators import calcular_curva_resultado
        pontos = calcular_curva_resultado(S=130.0, K=117.0, premio=2.80, posicao="vendedor", tipo="put")
        precos = [p["preco_centavos"] for p in pontos]
        assert precos == sorted(precos)

    def test_preco_minimo_e_50_pct_de_S(self):
        from analises.calculators import calcular_curva_resultado
        pontos = calcular_curva_resultado(S=130.0, K=117.0, premio=2.80, posicao="vendedor", tipo="put")
        assert pontos[0]["preco_centavos"] == round(130.0 * 0.5 * 100)

    def test_preco_maximo_e_150_pct_de_S(self):
        from analises.calculators import calcular_curva_resultado
        pontos = calcular_curva_resultado(S=130.0, K=117.0, premio=2.80, posicao="vendedor", tipo="put")
        assert pontos[-1]["preco_centavos"] == round(130.0 * 1.5 * 100)
