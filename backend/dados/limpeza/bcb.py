import pandas as pd 

def normalizar_serie_bcb(df: pd.DataFrame, fonte: str) -> list[dict]:
    """
    Recebe DataFrame do python-bcb (index=data, colunas=series)
    e retorna lista de dicts para persistencia em CacheDadosMercado.

    preco_fechamento armazena o valor em centavos (x100) para evitar float.
    """
    registros = []
    df = df.dropna(how="all")

    for coluna in df.columns:
        for data, valor in df[coluna].dropna().items():
            try:
                registros.append({
                    "codigo_commodity": coluna,
                    "data_preco": data.date() if hasattr(data, "date")
                    else data,
                    "preco_fechamento": int(round(float(valor) *100)),
                    "fonte": fonte,
                })
            except (ValueError, TypeError):
                continue
    
    return registros