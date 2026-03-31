import pytest
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
