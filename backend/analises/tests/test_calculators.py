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
        assert resultado["valor_total_contrato"] == resultado["premio_calculado"] * 1000
