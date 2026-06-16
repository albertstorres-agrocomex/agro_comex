import numpy as np


def prever_baseline_252(df_dataset) -> np.ndarray:
    return df_dataset["vol_252"].to_numpy(dtype=float)


def prever_garch(retornos, H: int = 21) -> float:
    from arch import arch_model

    r = np.asarray(retornos, dtype=float)
    r = r[~np.isnan(r)]
    # arch espera serie em escala percentual para estabilidade numerica
    modelo = arch_model(r * 100.0, vol="GARCH", p=1, q=1, mean="Zero")
    ajuste = modelo.fit(disp="off")
    previsao = ajuste.forecast(horizon=H, reindex=False)
    var_diaria = previsao.variance.values[-1]  # variancia (em %^2) por dia ate H
    var_media = float(np.mean(var_diaria)) / (100.0 ** 2)
    return float(np.sqrt(var_media) * np.sqrt(252.0))
