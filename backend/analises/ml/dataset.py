import numpy as np
import pandas as pd

COLUNAS_FEATURES = [
    "vol_21", "vol_63", "vol_252", "vol_ratio_21_252",
    "ret_21", "ret_63", "sinal_leverage", "preco_vs_mm60",
    "flag_safra", "flag_entressafra",
    "usd_brl", "delta_usd_brl_21", "selic",
]


def _vol_futura(ret: pd.Series, H: int) -> pd.Series:
    # desvio-padrao dos H retornos futuros (t+1..t+H), anualizado por sqrt(252/H)
    futuro_std = ret.shift(-1).rolling(H).std(ddof=1).shift(-(H - 1))
    return futuro_std * np.sqrt(252.0 / H)


def rotular(df_features: pd.DataFrame, H: int = 21) -> pd.DataFrame:
    out = df_features.sort_values(["commodity", "data"]).copy()
    out["y"] = out.groupby("commodity")["ret"].transform(lambda s: _vol_futura(s, H))
    return out


def montar_dataset(df_features: pd.DataFrame, H: int = 21, colunas_features=None) -> pd.DataFrame:
    cols = colunas_features or COLUNAS_FEATURES
    rot = rotular(df_features, H=H)
    rot = rot.rename(columns={"data": "data_t"})
    base = rot[["commodity", "data_t"] + cols + ["y"]].copy()
    base = base.dropna(subset=cols + ["y"])
    return base.sort_values("data_t").reset_index(drop=True)
