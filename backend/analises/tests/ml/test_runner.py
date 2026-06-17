import os
import tempfile
from unittest import mock

import numpy as np
import pandas as pd
from django.test import SimpleTestCase

from analises.ml import runner
from analises.ml.dataset import COLUNAS_FEATURES


def _dataset(n=120):
    rng = np.random.default_rng(11)
    datas = pd.bdate_range("2024-01-01", periods=n)
    X = pd.DataFrame({c: rng.random(n) for c in COLUNAS_FEATURES})
    X.insert(0, "data_t", datas)
    X.insert(0, "commodity", rng.choice(["ZS", "ZC", "KC"], n))
    X["y"] = 0.12 + 0.15 * X["vol_21"].to_numpy() + rng.normal(0, 0.005, n)
    return X


def _pooled(n=120):
    rng = np.random.default_rng(12)
    datas = pd.bdate_range("2024-01-01", periods=n)
    return pd.DataFrame({
        "data": datas, "commodity": "ZS",
        "preco_aj": 100.0, "ret": rng.normal(0, 0.01, n),
        "usd_brl": 5.4, "selic": 10.75,
    })


class RunnerTest(SimpleTestCase):
    def test_executar_gera_artefato_relatorio_e_grafico(self):
        with mock.patch.object(runner, "_montar_do_banco", return_value=(_dataset(), _pooled())), \
             mock.patch.object(runner, "prever_garch", return_value=0.12):
            with tempfile.TemporaryDirectory() as d:
                res = runner.executar_treino_completo(d, tipo="linear")
                caminhos = res["caminhos"]
                self.assertTrue(os.path.exists(caminhos["artefato"]))
                self.assertTrue(os.path.exists(caminhos["relatorio"]))
                self.assertTrue(os.path.exists(caminhos["grafico"]))
        self.assertIn("garch_holdout_rmse", res["metricas"])
        self.assertIn("modelo_holdout_rmse", res["metricas"])


from django.core.management import call_command
from io import StringIO


class CommandSmokeTest(SimpleTestCase):
    def test_command_invoca_runner(self):
        fake = {"metricas": {"modelo_holdout_rmse": 0.03, "baseline252_holdout_rmse": 0.05},
                "caminhos": {"artefato": "a", "relatorio": "b", "grafico": "c"}}
        with mock.patch("analises.management.commands.treinar_volatilidade.executar_treino_completo",
                        return_value=fake) as ex:
            out = StringIO()
            call_command("treinar_volatilidade", "--tipo", "linear", stdout=out)
        ex.assert_called_once()
        self.assertIn("Treino concluido", out.getvalue())
