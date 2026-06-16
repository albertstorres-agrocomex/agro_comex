from datetime import date
from unittest.mock import patch
from django.test import TestCase
from commodities.models import Comomodity
from dados.models import CacheDadosMercado
from dados.servicos import obter_cotacao_cache, obter_cotacao_ao_vivo


class ObterCotacaoCacheTest(TestCase):
    def setUp(self):
        self.commodity = Comomodity.objects.create(
            nome="Soja", codigo="ZS", bolsa="B3", unidade="saca", moeda="USD"
        )

    def test_retorna_ultimo_preco_em_usd(self):
        CacheDadosMercado.objects.create(
            commodity=self.commodity, data_preco=date(2026, 6, 10),
            preco_fechamento=13000, fonte="CEPEA_SPOT",
        )
        CacheDadosMercado.objects.create(
            commodity=self.commodity, data_preco=date(2026, 6, 15),
            preco_fechamento=13500, fonte="CEPEA_SPOT",
        )
        res = obter_cotacao_cache(self.commodity)
        self.assertEqual(res["preco_usd"], 135.0)
        self.assertEqual(res["data_preco"], date(2026, 6, 15))
        self.assertEqual(res["fonte"], "CEPEA_SPOT")

    def test_considera_fonte_b3_futuros(self):
        CacheDadosMercado.objects.create(
            commodity=self.commodity, data_preco=date(2026, 6, 12),
            preco_fechamento=14000, fonte="B3_FUTUROS",
        )
        res = obter_cotacao_cache(self.commodity)
        self.assertEqual(res["preco_usd"], 140.0)
        self.assertEqual(res["fonte"], "B3_FUTUROS")

    def test_retorna_none_sem_dados(self):
        self.assertIsNone(obter_cotacao_cache(self.commodity))


class ObterCotacaoAoVivoTest(TestCase):
    def setUp(self):
        self.soja = Comomodity.objects.create(
            nome="Soja", codigo="ZS", bolsa="B3", unidade="saca", moeda="USD"
        )
        self.boi = Comomodity.objects.create(
            nome="Boi Gordo", codigo="BGI", bolsa="B3", unidade="arroba", moeda="USD"
        )

    @patch("dados.servicos._cepea_centavos_usd")
    def test_soja_retorna_preco_ao_vivo(self, mock_cepea):
        mock_cepea.return_value = (13600, date(2026, 6, 16))
        res = obter_cotacao_ao_vivo(self.soja)
        self.assertEqual(res["preco_usd"], 136.0)
        self.assertEqual(res["fonte"], "CEPEA_SPOT")

    def test_commodity_sem_fonte_ao_vivo_retorna_none(self):
        self.assertIsNone(obter_cotacao_ao_vivo(self.boi))
