from datetime import datetime, timezone

import joblib

from analises.ml.baselines import prever_baseline_252
from analises.ml.dataset import COLUNAS_FEATURES
from analises.ml.metricas import mae, rmse
from analises.ml.modelos import COLUNAS_MODELO, construir_pipeline
from analises.ml.validacao import split_cronologico


def treinar_e_avaliar(df_dataset, tipo: str = "arvores", frac_treino: float = 0.8) -> dict:
    treino, holdout = split_cronologico(df_dataset, frac_treino=frac_treino)
    pipe = construir_pipeline(tipo)
    pipe.fit(treino[COLUNAS_MODELO], treino["y"])

    pred_treino = pipe.predict(treino[COLUNAS_MODELO])
    pred_holdout = pipe.predict(holdout[COLUNAS_MODELO])
    base_treino = prever_baseline_252(treino)
    base_holdout = prever_baseline_252(holdout)

    metricas = {
        "modelo_treino_rmse": rmse(treino["y"], pred_treino),
        "modelo_treino_mae": mae(treino["y"], pred_treino),
        "modelo_holdout_rmse": rmse(holdout["y"], pred_holdout),
        "modelo_holdout_mae": mae(holdout["y"], pred_holdout),
        "baseline252_holdout_rmse": rmse(holdout["y"], base_holdout),
        "baseline252_holdout_mae": mae(holdout["y"], base_holdout),
        "n_treino": int(len(treino)),
        "n_holdout": int(len(holdout)),
    }
    versao = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return {"metricas": metricas, "modelo": pipe, "versao": versao,
            "tipo": tipo, "colunas": COLUNAS_MODELO}


def salvar_artefato(resultado: dict, caminho: str) -> str:
    joblib.dump(resultado, caminho)
    return caminho


def carregar_artefato(caminho: str) -> dict:
    return joblib.load(caminho)
