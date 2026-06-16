import numpy as np
import pandas as pd
from django.test import SimpleTestCase
from analises.ml.features import construir_features


def _pooled(n=300, commodity="ZS"):
    datas = pd.bdate_range("2024-01-01", periods=n)
    rng = np.random.default_rng(42)
    ret = rng.normal(0, 0.01, n)
    preco = 100 * np.exp(np.cumsum(ret))
    return pd.DataFrame({
        "data": datas, "commodity": commodity, "preco_aj": preco,
        "ret": np.concatenate([[np.nan], np.diff(np.log(preco))]),
        "usd_brl": 5.4, "selic": 10.75,
    })


class FeaturesTest(SimpleTestCase):
    def test_colunas_esperadas_existem(self):
        out = construir_features(_pooled())
        for col in ["vol_21", "vol_63", "vol_252", "vol_ratio_21_252",
                    "ret_21", "ret_63", "sinal_leverage", "preco_vs_mm60",
                    "flag_safra", "flag_entressafra", "delta_usd_brl_21"]:
            self.assertIn(col, out.columns)

    def test_vol_usa_apenas_passado(self):
        out = construir_features(_pooled())
        # primeiras linhas sem 252 pregoes passados nao tem vol_252
        self.assertTrue(out["vol_252"].iloc[:251].isna().all())
        self.assertTrue(out["vol_252"].iloc[252:].notna().any())

    def test_vol_anualizada_positiva(self):
        out = construir_features(_pooled())
        v = out["vol_21"].dropna()
        self.assertTrue((v >= 0).all())
