import pandas as pd

from dados.models import CacheDadosMercado, DadosMacroeconomicos


def carregar_precos(commodities=("ZS", "ZC", "KC"), fonte="B3_FUTUROS") -> pd.DataFrame:
    qs = (
        CacheDadosMercado.objects
        .filter(commodity__codigo__in=list(commodities), fonte=fonte)
        .order_by("data_preco")
        .values_list("data_preco", "commodity__codigo", "preco_fechamento")
    )
    df = pd.DataFrame(list(qs), columns=["data", "commodity", "preco_centavos"])
    if df.empty:
        return pd.DataFrame(columns=["data", "commodity", "preco"])
    df["data"] = pd.to_datetime(df["data"])
    df["preco"] = df["preco_centavos"].astype(float) / 100.0
    return df[["data", "commodity", "preco"]]


def carregar_macro() -> pd.DataFrame:
    qs = (
        DadosMacroeconomicos.objects
        .filter(indicador__in=["SELIC", "USD_BRL"])
        .order_by("data")
        .values_list("data", "indicador", "valor")
    )
    df = pd.DataFrame(list(qs), columns=["data", "indicador", "valor"])
    if df.empty:
        return pd.DataFrame(columns=["data", "usd_brl", "selic"])
    df["valor"] = df["valor"].astype(float)
    pivot = df.pivot_table(index="data", columns="indicador", values="valor").reset_index()
    pivot.columns.name = None
    pivot = pivot.rename(columns={"SELIC": "selic", "USD_BRL": "usd_brl"})
    pivot["data"] = pd.to_datetime(pivot["data"])
    for col in ("usd_brl", "selic"):
        if col not in pivot.columns:
            pivot[col] = pd.NA
    return pivot[["data", "usd_brl", "selic"]]
