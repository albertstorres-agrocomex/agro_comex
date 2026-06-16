import numpy as np
import pandas as pd
from django.test import SimpleTestCase
from analises.ml.modelos import construir_pipeline, COLUNAS_MODELO
from analises.ml.dataset import COLUNAS_FEATURES


def _Xy(n=60):
    rng = np.random.default_rng(3)
    X = pd.DataFrame({c: rng.random(n) for c in COLUNAS_FEATURES})
    X["commodity"] = rng.choice(["ZS", "ZC", "KC"], n)
    y = 0.1 + 0.2 * X["vol_21"].to_numpy()
    return X[COLUNAS_MODELO], y


class ModelosTest(SimpleTestCase):
    def test_pipeline_linear_treina_e_preve(self):
        X, y = _Xy()
        pipe = construir_pipeline("linear")
        pipe.fit(X, y)
        pred = pipe.predict(X)
        self.assertEqual(len(pred), len(y))
        self.assertTrue((pred > 0).all())

    def test_pipeline_arvores_treina_e_preve(self):
        X, y = _Xy()
        pipe = construir_pipeline("arvores")
        pipe.fit(X, y)
        self.assertEqual(len(pipe.predict(X)), len(y))
