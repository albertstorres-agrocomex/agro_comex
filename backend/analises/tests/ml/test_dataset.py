import numpy as np
import pandas as pd
from django.test import SimpleTestCase
from analises.ml.features import construir_features
from analises.ml.dataset import rotular, montar_dataset, COLUNAS_FEATURES


def _pooled(n=320, commodity="ZS", seed=1):
    datas = pd.bdate_range("2024-01-01", periods=n)
    rng = np.random.default_rng(seed)
    ret = rng.normal(0, 0.01, n)
    preco = 100 * np.exp(np.cumsum(ret))
    return pd.DataFrame({
        "data": datas, "commodity": commodity, "preco_aj": preco,
        "ret": np.concatenate([[np.nan], np.diff(np.log(preco))]),
        "usd_brl": 5.4, "selic": 10.75,
    })


class DatasetTest(SimpleTestCase):
    def test_rotulo_usa_futuro(self):
        df = construir_features(_pooled())
        rot = rotular(df, H=21)
        # ultimas 21 linhas nao tem futuro suficiente
        self.assertTrue(rot["y"].iloc[-21:].isna().all())
        self.assertTrue(rot["y"].iloc[:-21].notna().any())

    def test_dataset_sem_nan(self):
        df = construir_features(_pooled())
        ds = montar_dataset(df, H=21)
        self.assertFalse(ds[COLUNAS_FEATURES + ["y"]].isna().any().any())
        self.assertTrue((ds["data_t"].is_monotonic_increasing))

    def test_dataset_preserva_commodity(self):
        df = construir_features(_pooled(commodity="KC"))
        ds = montar_dataset(df, H=21)
        self.assertEqual(set(ds["commodity"].unique()), {"KC"})
