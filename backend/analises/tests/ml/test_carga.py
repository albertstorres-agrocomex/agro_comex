from datetime import date
from decimal import Decimal
from django.test import TestCase
from commodities.models import Comomodity
from dados.models import CacheDadosMercado, DadosMacroeconomicos
from analises.ml.carga import carregar_precos, carregar_macro


class CargaTest(TestCase):
    def setUp(self):
        self.zs = Comomodity.objects.create(
            nome="Soja", codigo="ZS", bolsa="B3", unidade="saca", moeda="BRL"
        )
        CacheDadosMercado.objects.create(
            commodity=self.zs, data_preco=date(2025, 6, 16),
            preco_fechamento=40480, fonte="B3_FUTUROS"
        )
        CacheDadosMercado.objects.create(
            commodity=self.zs, data_preco=date(2025, 6, 17),
            preco_fechamento=40500, fonte="B3_FUTUROS"
        )
        DadosMacroeconomicos.objects.create(
            indicador="SELIC", valor=Decimal("10.75"), data=date(2025, 6, 16), fonte="BCB"
        )
        DadosMacroeconomicos.objects.create(
            indicador="USD_BRL", valor=Decimal("5.40"), data=date(2025, 6, 16), fonte="BCB"
        )

    def test_carregar_precos(self):
        df = carregar_precos(commodities=("ZS",))
        self.assertEqual(len(df), 2)
        self.assertAlmostEqual(df.iloc[0]["preco"], 404.80, places=2)
        self.assertEqual(df.iloc[0]["commodity"], "ZS")

    def test_carregar_macro_pivot(self):
        df = carregar_macro()
        self.assertIn("usd_brl", df.columns)
        self.assertIn("selic", df.columns)
        self.assertAlmostEqual(df.iloc[0]["selic"], 10.75, places=2)
