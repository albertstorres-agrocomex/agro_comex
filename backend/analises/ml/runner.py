import os

import numpy as np

from analises.ml.baselines import prever_garch
from analises.ml.carga import carregar_macro, carregar_precos
from analises.ml.dataset import montar_dataset
from analises.ml.features import construir_features
from analises.ml.modelos import COLUNAS_MODELO
from analises.ml.preparacao import merge_macro, preparar_serie
from analises.ml.relatorio import grafico_previsto_vs_realizado, salvar_relatorio
from analises.ml.treino import salvar_artefato, treinar_e_avaliar
from analises.ml.metricas import mae, rmse
from analises.ml.validacao import split_cronologico


def _montar_do_banco(H: int = 21):
    precos = carregar_precos()
    ajustado = preparar_serie(precos)
    pooled = merge_macro(ajustado, carregar_macro())
    feats = construir_features(pooled)
    dataset = montar_dataset(feats, H=H)
    return dataset, pooled


def _garch_no_holdout(df_pooled, holdout, H: int) -> np.ndarray:
    preds = []
    for _, linha in holdout.iterrows():
        serie = df_pooled[
            (df_pooled["commodity"] == linha["commodity"])
            & (df_pooled["data"] <= linha["data_t"])
        ]["ret"].dropna().to_numpy()
        try:
            preds.append(prever_garch(serie, H=H))
        except Exception:
            preds.append(np.nan)
    return np.asarray(preds, dtype=float)


def executar_treino_completo(dir_saida: str, tipo: str = "arvores", H: int = 21) -> dict:
    os.makedirs(dir_saida, exist_ok=True)
    dataset, pooled = _montar_do_banco(H=H)

    resultado = treinar_e_avaliar(dataset, tipo=tipo)
    metricas = resultado["metricas"]

    # GARCH sobre o mesmo holdout cronologico para comparacao
    _, holdout = split_cronologico(dataset)
    garch_pred = _garch_no_holdout(pooled, holdout, H)
    mascara = ~np.isnan(garch_pred)
    if mascara.any():
        metricas["garch_holdout_rmse"] = rmse(holdout["y"].to_numpy()[mascara], garch_pred[mascara])
        metricas["garch_holdout_mae"] = mae(holdout["y"].to_numpy()[mascara], garch_pred[mascara])

    # Previsoes do modelo no holdout para o grafico
    modelo_pred = resultado["modelo"].predict(holdout[COLUNAS_MODELO])

    caminho_artefato = os.path.join(dir_saida, "modelo_volatilidade.joblib")
    caminho_relatorio = os.path.join(dir_saida, "relatorio.md")
    caminho_grafico = os.path.join(dir_saida, "previsto_vs_realizado.png")

    salvar_artefato(resultado, caminho_artefato)
    salvar_relatorio(metricas, caminho_relatorio)
    grafico_previsto_vs_realizado(
        holdout["y"].to_numpy(), modelo_pred, holdout["commodity"].to_numpy(), caminho_grafico
    )

    return {
        "metricas": metricas,
        "caminhos": {
            "artefato": caminho_artefato,
            "relatorio": caminho_relatorio,
            "grafico": caminho_grafico,
        },
    }
