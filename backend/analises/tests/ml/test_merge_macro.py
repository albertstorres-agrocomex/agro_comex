import pandas as pd
from django.test import SimpleTestCase
from analises.ml.preparacao import merge_macro


class MergeMacroTest(SimpleTestCase):
    def test_forward_fill_macro(self):
        datas = pd.bdate_range("2025-06-16", periods=3)
        precos = pd.DataFrame({
            "data": list(datas) * 1,
            "commodity": "ZS",
            "preco_aj": [100.0, 101.0, 102.0],
            "ret": [None, 0.01, 0.0099],
        })
        macro = pd.DataFrame({
            "data": [datas[0]],  # so o primeiro dia tem cotacao
            "usd_brl": [5.40],
            "selic": [10.75],
        })
        out = merge_macro(precos, macro)
        self.assertEqual(len(out), 3)
        self.assertTrue((out["usd_brl"] == 5.40).all())  # forward-filled
        self.assertTrue((out["selic"] == 10.75).all())
