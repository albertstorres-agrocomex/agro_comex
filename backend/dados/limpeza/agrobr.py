import pandas as pd 
from datetime import date

# B3 Futuros

def normalizar_futuros_b3(df: pd.DataFrame, contrato: str, fonte: str) -> list[dict]:
    """
    Normaliza o DataFrame de ajustes diarios da B3.
    Colunas esperadas: data_referencia, preco_ajuste (ou similar).
    Ajustar COLUNA_DATA e COLUNA_PRECO conforme saida real do agrobr.
    """
    COLUNA_DATA = "data_referencia"
    COLUNA_PRECO = "preco_ajuste"

    registros = []
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.dropna(subset=[COLUNA_PRECO])

    for _, row in df.iterrows():
        try:
            registros.append({
                "codigo_commodity": f"B3_{contrato.upper()}",
                "data_preco": _to_date(row[COLUNA_DATA]),
                "preco_fechamento": int(round(float(row[COLUNA_PRECO]) * 100)),
                "fonte": fonte,
            })
        except (ValueError, TypeError, KeyError):
            continue
    
    return registros


# CEPEA

def normalizar_precos_cepea(df: pd.DataFrame, commodity: str, fonte: str) -> list[dict]:
    """
    Normaliza o DataFrame de precos diarios do CEPEA.
    Colunas esperadas: data, preco (ou similar).
    """
    COLUNA_DATA = "data"
    COLUNA_PRECO = "preco"

    registros = []
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.dropna(subset=[COLUNA_PRECO])

    for _, row in df.iterrows():
        try:
            registros.append({
                "codigo_commodity": f"CEPEA_{commodity.upper()}",
                "data_preco": _to_date(row[COLUNA_DATA]),
                "preco_fechamento": int(round(float(row[COLUNA_PRECO]) * 100)),
                "fonte": fonte,
            })
        except (ValueError, TypeError, KeyError):
            continue
    
    return registros


# CONAB Estimativa de Safra

def normalizar_estimativa_safra(df: pd.DataFrame, cultura: str, fonte: str) -> list[dict]:
    """
    Normaliza o DataFrame de estimativa de safra da CONAB.
    preco_fechamento armazena producao em toneladas x100 como proxy de quantidade.
    Ajustar conforme necessidade do calculo de analise.
    """
    COLUNA_ANO = "ano"
    COLUNA_MES = "mes"
    COLUNA_PRODUCAO = "producao"

    registros = []
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.dropna(subset=[COLUNA_PRODUCAO])

    for _, row in df.iterrows():
        try:
            mes = int(row.get(COLUNA_MES, 1) or 1)
            ano = int(row[COLUNA_ANO])
            registros.append({
                "codigo_commodity": f"CONAB_SAFRA_{cultura.upper()}",
                "data_preco": date(ano, mes, 1),
                "preco_fechamento": int(float(row[COLUNA_PRODUCAO]) * 100),
                "fonte": fonte,
            })
        except (ValueError, TypeError, KeyError):
            continue
    
    return registros


# Exportacao (ComexStat)

def normalizar_exportacao(df: pd.DataFrame, cultura: str, fonte: str) -> list[dict]:
    """
    Normaliza o DataFrame de exportacao agricola (ComexStat via agrobr).
    preco_fechamento armazena valor FOB em centavos de dolar.
    """
    COLUNA_ANO = "ano"
    COLUNA_MES = "mes"
    COLUNA_VALOR = "valor_fob_dolar"

    registros = []
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.dropna(subset=[COLUNA_VALOR])

    for _, row in df.iterrows():
        try:
            registros.append({
                "codigo_commodity": f"EXPORT_{cultura.upper()}",
                "data_preco": date(int(row[COLUNA_ANO]), int(row[COLUNA_MES]), 1),
                "preco_fechamento": int(float(row[COLUNA_VALOR]) * 100),
                "fonte": fonte,
            })
        except (ValueError, TypeError, KeyError):
            continue
    
    return registros


# CONAB PROHORT

def normalizar_prohort(df: pd.DataFrame, fonte: str) -> list[dict]:
    """
    Normaliza o DataFrame de precos de atacado PROHORT.
    Colunas esperadas: produto, data, preco_medio (ou similar).
    Ajustar conforme saida real do agrobr.
    """
    COLUNA_PRODUTO = "produto"
    COLUNA_DATA = "data"
    COLUNA_PRECO = "preco_medio"

    registros = []
    df.columns = [c.strip().lower() for c in df.columns]
    df = df.dropna(subset=[COLUNA_PRECO, COLUNA_PRODUTO])

    for _, row in df.iterrows():
        try:
            registros.append({
                "codigo_commodity": f"PROHORT_{str(row[COLUNA_PRODUTO]).upper().strip()}",
                "data_preco": _to_date(row[COLUNA_DATA]),
                "preco_fechamento": int(round(float(str(row[COLUNA_PRECO]).replace(",", ".")) * 100)),
                "fonte": fonte,
            })
        except (ValueError, TypeError, KeyError):
            continue
    
    return registros


# Utilitario interno

def _to_date(valor) -> date:
    """Converte string ou Timestamp para date."""
    if isinstance(valor, date):
        return valor
    if hasattr(valor, "date"):
        return valor.date()
    from datetime import datetime
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(str(valor).strip(), fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Formato de data nao reconhecido: {valor}")