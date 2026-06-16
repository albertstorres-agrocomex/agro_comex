import numpy as np
import pandas as pd
from django.test import SimpleTestCase
from analises.ml.preparacao import calcular_retornos_log, ajustar_rolagem, preparar_serie


def _serie(commodity, precos, inicio="2025-06-16"):
    datas = pd.bdate_range(inicio, periods=len(precos))
    return pd.DataFrame({"data": datas, "commodity": commodity, "preco": precos})


class PreparacaoTest(SimpleTestCase):
    def test_retorno_log_primeiro_e_nan(self):
        df = _serie("ZS", [100.0, 110.0])
        out = calcular_retornos_log(df)
        self.assertTrue(np.isnan(out.iloc[0]["ret"]))
        self.assertAlmostEqual(out.iloc[1]["ret"], np.log(110.0 / 100.0), places=6)

    def test_rolagem_neutraliza_salto_artificial(self):
        # salto de 100 -> 130 (ret ~0.26) marcado como rolagem; retorno do dia vira ~0
        df = _serie("ZC", [100.0, 101.0, 130.0, 131.0])
        out = preparar_serie(df, limiar=0.12)
        ret_salto = out.iloc[2]["ret"]
        self.assertTrue(np.isnan(ret_salto) or abs(ret_salto) < 1e-9)

    def test_rolagem_preserva_retornos_normais(self):
        df = _serie("ZS", [100.0, 101.0, 102.0, 103.0])
        out = preparar_serie(df, limiar=0.12)
        self.assertEqual(out["ret"].notna().sum(), 3)
