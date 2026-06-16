import numpy as np
import pandas as pd

_SAFRA_PADRAO = {
    "ZS": {1, 2, 3, 4},     # soja: colheita verao
    "ZC": {2, 3, 6, 7},     # milho: duas safras
    "KC": {5, 6, 7, 8, 9},  # cafe: colheita inverno
}


def _vol_anualizada(ret: pd.Series, janela: int) -> pd.Series:
    return ret.rolling(janela).std(ddof=1) * np.sqrt(252)


def construir_features(df_pooled: pd.DataFrame, datas_safra=None) -> pd.DataFrame:
    safra = datas_safra or _SAFRA_PADRAO
    out = df_pooled.sort_values(["commodity", "data"]).copy()
    g = out.groupby("commodity")

    out["vol_21"] = g["ret"].transform(lambda s: _vol_anualizada(s, 21))
    out["vol_63"] = g["ret"].transform(lambda s: _vol_anualizada(s, 63))
    out["vol_252"] = g["ret"].transform(lambda s: _vol_anualizada(s, 252))
    out["vol_ratio_21_252"] = out["vol_21"] / out["vol_252"]

    out["ret_21"] = g["ret"].transform(lambda s: s.rolling(21).sum())
    out["ret_63"] = g["ret"].transform(lambda s: s.rolling(63).sum())

    # leverage: correlacao rolling entre retorno e |retorno| futuro proxy -> sinal do ret_21
    out["sinal_leverage"] = -np.sign(out["ret_21"]).fillna(0.0) * out["vol_21"].fillna(0.0)

    mm60 = g["preco_aj"].transform(lambda s: s.rolling(60).mean())
    out["preco_vs_mm60"] = out["preco_aj"] / mm60 - 1.0

    mes = out["data"].dt.month
    out["flag_safra"] = out.apply(
        lambda r: 1 if r["data"].month in safra.get(r["commodity"], set()) else 0, axis=1
    )
    out["flag_entressafra"] = 1 - out["flag_safra"]

    out["delta_usd_brl_21"] = g["usd_brl"].transform(lambda s: s.pct_change(21))
    return out
