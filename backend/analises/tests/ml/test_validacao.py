import numpy as np
import pandas as pd
from django.test import SimpleTestCase
from analises.ml.validacao import split_cronologico, folds_temporais_com_gap


def _ds(n=100):
    datas = pd.bdate_range("2024-01-01", periods=n)
    return pd.DataFrame({"data_t": datas, "y": np.arange(n, dtype=float)})


class ValidacaoTest(SimpleTestCase):
    def test_split_respeita_ordem(self):
        treino, holdout = split_cronologico(_ds(100), frac_treino=0.8)
        self.assertEqual(len(treino), 80)
        self.assertEqual(len(holdout), 20)
        self.assertTrue(treino["data_t"].max() < holdout["data_t"].min())

    def test_folds_com_gap_nao_sobrepoem(self):
        folds = folds_temporais_com_gap(_ds(100), n_splits=3, gap=21)
        self.assertEqual(len(folds), 3)
        for idx_tr, idx_val in folds:
            self.assertTrue(max(idx_tr) + 21 <= min(idx_val))
