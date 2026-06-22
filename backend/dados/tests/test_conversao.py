import pytest
from unittest.mock import patch


class TestConverterB3:
    def test_zs_usd_por_mt_para_usd_por_bu(self):
        from dados.limpeza.conversao import converter_b3, BU_PER_MT_ZS
        resultado = converter_b3("ZS", 465.00)
        assert abs(resultado - 465.00 / BU_PER_MT_ZS) < 0.001

    def test_kc_usd_por_saca_para_usd_por_lb(self):
        from dados.limpeza.conversao import converter_b3, LBS_PER_SACA_KC
        resultado = converter_b3("KC", 398.05)
        assert abs(resultado - 398.05 / LBS_PER_SACA_KC) < 0.001

    def test_zc_brl_por_saca_para_usd_por_bu(self):
        from dados.limpeza.conversao import converter_b3, SACAS_PER_BUSHEL_ZC
        resultado = converter_b3("ZC", 74.90, usd_brl=5.83)
        esperado = 74.90 / SACAS_PER_BUSHEL_ZC / 5.83
        assert abs(resultado - esperado) < 0.001

    def test_zc_sem_usd_brl_levanta_value_error(self):
        from dados.limpeza.conversao import converter_b3
        with pytest.raises(ValueError, match="usd_brl obrigatorio"):
            converter_b3("ZC", 74.90, usd_brl=None)

    def test_codigo_desconhecido_levanta_value_error(self):
        from dados.limpeza.conversao import converter_b3
        with pytest.raises(ValueError, match="nao mapeado"):
            converter_b3("XX", 100.0)


class TestUnidadesPorSaca:
    """Fator que converte um preco USD/unidade-padrao para USD/saca de 60 kg."""

    def test_kc_retorna_lbs_por_saca(self):
        from dados.limpeza.conversao import unidades_por_saca, LBS_PER_SACA_KC
        assert unidades_por_saca("KC") == LBS_PER_SACA_KC

    def test_zc_retorna_bushels_por_saca_milho(self):
        from dados.limpeza.conversao import unidades_por_saca, SACAS_PER_BUSHEL_ZC
        assert unidades_por_saca("ZC") == SACAS_PER_BUSHEL_ZC

    def test_zs_retorna_bushels_por_saca_soja(self):
        from dados.limpeza.conversao import unidades_por_saca, SACAS_PER_BUSHEL_ZS
        assert unidades_por_saca("ZS") == SACAS_PER_BUSHEL_ZS

    def test_case_insensitive(self):
        from dados.limpeza.conversao import unidades_por_saca, LBS_PER_SACA_KC
        assert unidades_por_saca("kc") == LBS_PER_SACA_KC

    def test_codigo_desconhecido_retorna_1(self):
        from dados.limpeza.conversao import unidades_por_saca
        assert unidades_por_saca("XX") == 1.0

    def test_zs_valor_real_proximo_cbot(self):
        """465 USD/MT deve resultar em ~12.66 USD/bu (CBOT ZS ~11.60 em mar/26)."""
        from dados.limpeza.conversao import converter_b3
        resultado = converter_b3("ZS", 465.00)
        assert 10.0 < resultado < 15.0

    def test_kc_valor_real_proximo_ice(self):
        """398.05 USD/saca deve resultar em ~3.01 USD/lb (ICE KC ~2.97 em mar/26)."""
        from dados.limpeza.conversao import converter_b3
        resultado = converter_b3("KC", 398.05)
        assert 2.5 < resultado < 4.0


class TestConverterCepea:
    def test_zc_brl_saca_para_usd_bu(self):
        from dados.limpeza.conversao import converter_cepea, SACAS_PER_BUSHEL_ZC
        resultado = converter_cepea("ZC", 74.90, usd_brl=5.83)
        esperado = 74.90 / SACAS_PER_BUSHEL_ZC / 5.83
        assert abs(resultado - esperado) < 0.001

    def test_zs_brl_saca_para_usd_bu(self):
        from dados.limpeza.conversao import converter_cepea, SACAS_PER_BUSHEL_ZS
        resultado = converter_cepea("ZS", 120.00, usd_brl=5.83)
        esperado = 120.00 / SACAS_PER_BUSHEL_ZS / 5.83
        assert abs(resultado - esperado) < 0.001

    def test_kc_brl_saca_para_usd_lb(self):
        from dados.limpeza.conversao import converter_cepea, LBS_PER_SACA_KC
        resultado = converter_cepea("KC", 2400.00, usd_brl=5.83)
        esperado = 2400.00 / LBS_PER_SACA_KC / 5.83
        assert abs(resultado - esperado) < 0.001

    def test_usd_brl_invalido_levanta_value_error(self):
        from dados.limpeza.conversao import converter_cepea
        with pytest.raises(ValueError, match="usd_brl deve ser positivo"):
            converter_cepea("ZC", 74.90, usd_brl=0)

    def test_unidade_divergente_loga_warning(self):
        from dados.limpeza.conversao import converter_cepea
        with patch("dados.limpeza.conversao.logger") as mock_log:
            converter_cepea("ZC", 74.90, usd_brl=5.83, unidade_cepea="R$/kg")
            mock_log.warning.assert_called_once()


class TestObterTaxaUsdBrl:
    @pytest.mark.django_db
    def test_retorna_taxa_recente(self):
        from datetime import date
        from decimal import Decimal
        from dados.models import DadosMacroeconomicos
        from dados.limpeza.conversao import obter_taxa_usd_brl

        DadosMacroeconomicos.objects.create(
            indicador="USD_BRL",
            data=date.today(),
            valor=Decimal("5.83"),
            fonte="BCB",
        )
        taxa = obter_taxa_usd_brl()
        assert abs(taxa - 5.83) < 0.001

    @pytest.mark.django_db
    def test_sem_dados_levanta_value_error(self):
        from dados.limpeza.conversao import obter_taxa_usd_brl
        with pytest.raises(ValueError, match="nenhum registro USD_BRL"):
            obter_taxa_usd_brl()

    @pytest.mark.django_db
    def test_taxa_desatualizada_levanta_value_error(self):
        from datetime import date, timedelta
        from decimal import Decimal
        from dados.models import DadosMacroeconomicos
        from dados.limpeza.conversao import obter_taxa_usd_brl

        DadosMacroeconomicos.objects.create(
            indicador="USD_BRL",
            data=date.today() - timedelta(days=30),
            valor=Decimal("5.80"),
            fonte="BCB",
        )
        with pytest.raises(ValueError, match="desatualizada"):
            obter_taxa_usd_brl(tolerancia_dias=7)
