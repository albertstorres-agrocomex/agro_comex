import numpy as np
import pandas as pd


def calcular_retornos_log(df: pd.DataFrame) -> pd.DataFrame:
    out = df.sort_values(["commodity", "data"]).copy()
    col_preco = "preco_aj" if "preco_aj" in out.columns else "preco"
    out["ret"] = out.groupby("commodity")[col_preco].transform(
        lambda s: np.log(s / s.shift(1))
    )
    return out


def ajustar_rolagem(df: pd.DataFrame, limiar: float = 0.12, datas_rolagem=None) -> pd.DataFrame:
    out = df.sort_values(["commodity", "data"]).copy()
    out["preco_aj"] = out["preco"].astype(float)
    datas_rolagem = set(datas_rolagem or [])
    for commodity, grupo in out.groupby("commodity"):
        idx = grupo.index.tolist()
        precos = grupo["preco"].astype(float).tolist()
        for i in range(1, len(precos)):
            ret = np.log(precos[i] / precos[i - 1]) if precos[i - 1] > 0 else 0.0
            chave = (commodity, grupo.iloc[i]["data"])
            eh_rolagem = chave in datas_rolagem or abs(ret) > limiar
            if eh_rolagem:
                # emenda: copia o preco anterior para zerar o retorno artificial do dia
                out.loc[idx[i], "preco_aj"] = out.loc[idx[i - 1], "preco_aj"]
    return out


def preparar_serie(df: pd.DataFrame, limiar: float = 0.12, datas_rolagem=None) -> pd.DataFrame:
    ajustado = ajustar_rolagem(df, limiar=limiar, datas_rolagem=datas_rolagem)
    return calcular_retornos_log(ajustado)
