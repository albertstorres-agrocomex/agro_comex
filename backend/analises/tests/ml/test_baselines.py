import numpy as np
import pandas as pd
from django.test import SimpleTestCase
from analises.ml.baselines import prever_baseline_252, prever_garch


class BaselinesTest(SimpleTestCase):
    def test_baseline_252_retorna_vol_252(self):
        ds = pd.DataFrame({"vol_252": [0.11, 0.12, 0.37], "y": [0.10, 0.13, 0.40]})
        pred = prever_baseline_252(ds)
        np.testing.assert_allclose(pred, [0.11, 0.12, 0.37])

    def test_garch_retorna_vol_anualizada_positiva(self):
        rng = np.random.default_rng(7)
        retornos = rng.normal(0, 0.012, 300)
        v = prever_garch(retornos, H=21)
        self.assertIsInstance(v, float)
        self.assertGreater(v, 0.0)
        self.assertLess(v, 2.0)
