import os
import tempfile
import numpy as np
from django.test import SimpleTestCase
from analises.ml.relatorio import (
    tabela_metricas_md, grafico_previsto_vs_realizado, salvar_relatorio,
)


_METRICAS = {
    "modelo_treino_rmse": 0.02, "modelo_treino_mae": 0.015,
    "modelo_holdout_rmse": 0.03, "modelo_holdout_mae": 0.025,
    "baseline252_holdout_rmse": 0.05, "baseline252_holdout_mae": 0.04,
    "garch_holdout_rmse": 0.045, "garch_holdout_mae": 0.038,
    "n_treino": 24, "n_holdout": 6,
}


class RelatorioTest(SimpleTestCase):
    def test_tabela_contem_modelo_e_baselines(self):
        md = tabela_metricas_md(_METRICAS)
        self.assertIn("Modelo", md)
        self.assertIn("Baseline 252d", md)
        self.assertIn("GARCH", md)
        self.assertIn("0.03", md)  # rmse holdout do modelo

    def test_tabela_marca_quando_bate_baseline(self):
        md = tabela_metricas_md(_METRICAS)
        # modelo (0.03) < baseline252 (0.05) e < garch (0.045) -> bateu ambos
        self.assertIn("sim", md.lower())

    def test_grafico_salva_png(self):
        y_true = np.array([0.10, 0.12, 0.37, 0.11])
        y_pred = np.array([0.11, 0.13, 0.35, 0.12])
        commodities = ["ZS", "ZC", "KC", "ZS"]
        with tempfile.TemporaryDirectory() as d:
            caminho = os.path.join(d, "scatter.png")
            saida = grafico_previsto_vs_realizado(y_true, y_pred, commodities, caminho)
            self.assertTrue(os.path.exists(saida))
            self.assertGreater(os.path.getsize(saida), 0)

    def test_salvar_relatorio_grava_arquivo(self):
        with tempfile.TemporaryDirectory() as d:
            caminho = os.path.join(d, "relatorio.md")
            salvar_relatorio(_METRICAS, caminho)
            with open(caminho, encoding="utf-8") as f:
                self.assertIn("Modelo", f.read())
