import pandas as pd


def normalizar_serie_bcb(df: pd.DataFrame, fonte: str) -> list[dict]:
    """
    Normaliza DataFrame do python-bcb (index=data, colunas=series)
    para persistencia em DadosMacroeconomicos.

    Cada coluna do DataFrame vira um indicador:
      USD_BRL, EUR_BRL, SELIC, IPCA

    Retorna lista de dicts com: indicador, data, valor, fonte.
    Usa valor float direto (sem conversao para centavos — indicadores
    macro nao sao precos de commodity).
    """
    registros = []
    df = df.dropna(how="all")

    for coluna in df.columns:
        for data, valor in df[coluna].dropna().items():
            try:
                registros.append({
                    "indicador": str(coluna),
                    "data":      data.date() if hasattr(data, "date") else data,
                    "valor":     float(valor),
                    "fonte":     fonte,
                })
            except (ValueError, TypeError):
                continue

    return registros
