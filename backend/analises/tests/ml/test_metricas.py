import math
from django.test import SimpleTestCase
from analises.ml.metricas import rmse, mae


class MetricasTest(SimpleTestCase):
    def test_rmse_zero_quando_igual(self):
        self.assertEqual(rmse([0.1, 0.2, 0.3], [0.1, 0.2, 0.3]), 0.0)

    def test_rmse_valor_conhecido(self):
        # erros: 0.0, 0.0, 0.3 -> mse = 0.09/3 = 0.03 -> rmse = 0.17320508
        self.assertAlmostEqual(rmse([0.1, 0.2, 0.3], [0.1, 0.2, 0.6]), math.sqrt(0.03), places=6)

    def test_mae_valor_conhecido(self):
        self.assertAlmostEqual(mae([0.1, 0.2, 0.3], [0.1, 0.2, 0.6]), 0.1, places=6)
