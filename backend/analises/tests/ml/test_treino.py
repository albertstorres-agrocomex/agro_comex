import os
import tempfile
import numpy as np
import pandas as pd
from django.test import SimpleTestCase
from analises.ml.dataset import COLUNAS_FEATURES
from analises.ml.treino import treinar_e_avaliar, salvar_artefato, carregar_artefato


def _dataset(n=120):
    rng = np.random.default_rng(9)
    datas = pd.bdate_range("2024-01-01", periods=n)
    X = pd.DataFrame({c: rng.random(n) for c in COLUNAS_FEATURES})
    X.insert(0, "data_t", datas)
    X.insert(0, "commodity", rng.choice(["ZS", "ZC", "KC"], n))
    X["y"] = 0.12 + 0.15 * X["vol_21"].to_numpy() + rng.normal(0, 0.005, n)
    return X


class TreinoTest(SimpleTestCase):
    def test_treino_retorna_metricas(self):
        res = treinar_e_avaliar(_dataset(), tipo="linear")
        m = res["metricas"]
        self.assertIn("modelo_holdout_rmse", m)
        self.assertIn("baseline252_holdout_rmse", m)
        self.assertIn("modelo_holdout_mae", m)
        self.assertGreaterEqual(m["modelo_holdout_rmse"], 0.0)

    def test_artefato_roundtrip(self):
        res = treinar_e_avaliar(_dataset(), tipo="linear")
        with tempfile.TemporaryDirectory() as d:
            caminho = os.path.join(d, "modelo.joblib")
            salvar_artefato(res, caminho)
            recarregado = carregar_artefato(caminho)
            self.assertIn("modelo", recarregado)
            self.assertEqual(recarregado["versao"], res["versao"])
