from datetime import date

import pandas as pd

# ---------------------------------------------------------------------------
# Mapeamento central: nome usado nas fontes externas -> codigo Comomodity no banco
# Fontes: CEPEA usa "soja"/"milho"/"cafe"; B3 usa "soja_fob"/"milho" etc.;
# ComexStat usa os mesmos nomes das tasks ("soja", "milho", "cafe", "acucar").
# Acucar nao e suportado por CEPEA nem B3 via agrobr — apenas ComexStat.
# ---------------------------------------------------------------------------
COMMODITY_NOME_PARA_CODIGO: dict[str, str] = {
    "soja":         "ZS",
    "soja_cross":   "ZS",
    "soja_fob":     "ZS",
    "milho":        "ZC",
    "cafe":         "KC",
    "cafe_arabica": "KC",
    "acucar":       "SB",
}


def _to_date(valor) -> date:
    if isinstance(valor, date):
        return valor
    if hasattr(valor, "date"):
        return valor.date()
    return date.fromisoformat(str(valor))


def normalizar_futuros_b3(df: pd.DataFrame, contrato: str, fonte: str) -> list[dict]:
    """
    Normaliza DataFrame de ajustes diarios da B3 (agrobr.b3.historico).

    Schema real do agrobr (contracts/datasets.py — AJUSTE_DIARIO_V1):
      data, ticker, descricao, vencimento_codigo, vencimento_mes,
      vencimento_ano, ajuste_anterior, ajuste_atual, variacao,
      ajuste_por_contrato, unidade

    Apenas contratos mapeados em COMMODITY_NOME_PARA_CODIGO sao processados.
    Contratos sem mapeamento (boi, cafe_conillon, etanol) sao ignorados.
    """
    COLUNA_DATA  = "data"
    COLUNA_PRECO = "ajuste_atual"

    codigo = COMMODITY_NOME_PARA_CODIGO.get(contrato)
    if codigo is None:
        return []   # contrato nao pertence as 4 commodities do MVP

    registros = []
    df = df.copy()
    df.columns = [c.strip().lower() for c in df.columns]

    if COLUNA_PRECO not in df.columns:
        raise KeyError(
            f"Coluna '{COLUNA_PRECO}' ausente no DataFrame B3 (contrato={contrato}). "
            f"Colunas disponiveis: {df.columns.tolist()}"
        )

    df = df.dropna(subset=[COLUNA_PRECO])

    for _, row in df.iterrows():
        try:
            registros.append({
                "codigo_commodity": codigo,
                "data_preco":       _to_date(row[COLUNA_DATA]),
                "preco_fechamento": int(round(float(row[COLUNA_PRECO]) * 100)),
                "fonte":            fonte,
            })
        except (ValueError, TypeError, KeyError):
            continue

    return registros


def normalizar_precos_cepea(df: pd.DataFrame, commodity: str, fonte: str) -> list[dict]:
    """
    Normaliza DataFrame de precos spot do CEPEA (agrobr.datasets.preco_diario).

    Schema real do agrobr (contracts/cepea.py):
      data, preco  (apos limpeza pela lib)

    Commodities suportadas pelo CEPEA via agrobr: soja, milho, boi, cafe,
    trigo, algodao. Acucar NAO e suportado — a task deve omiti-lo da lista.
    """
    COLUNA_DATA  = "data"
    COLUNA_PRECO = "preco"

    codigo = COMMODITY_NOME_PARA_CODIGO.get(commodity)
    if codigo is None:
        raise ValueError(
            f"Commodity '{commodity}' nao mapeada para codigo de banco. "
            f"Mapeamentos disponiveis: {list(COMMODITY_NOME_PARA_CODIGO.keys())}"
        )

    registros = []
    df = df.copy()
    df.columns = [c.strip().lower() for c in df.columns]

    if COLUNA_PRECO not in df.columns:
        raise KeyError(
            f"Coluna '{COLUNA_PRECO}' ausente no DataFrame CEPEA (commodity={commodity}). "
            f"Colunas disponiveis: {df.columns.tolist()}"
        )

    df = df.dropna(subset=[COLUNA_PRECO])

    for _, row in df.iterrows():
        try:
            registros.append({
                "codigo_commodity": codigo,
                "data_preco":       _to_date(row[COLUNA_DATA]),
                "preco_fechamento": int(round(float(row[COLUNA_PRECO]) * 100)),
                "fonte":            fonte,
            })
        except (ValueError, TypeError, KeyError):
            continue

    return registros


def normalizar_estimativa_safra(df: pd.DataFrame, cultura: str, fonte: str) -> list[dict]:
    """
    Normaliza DataFrame de estimativa de safra (agrobr.datasets.estimativa_safra).

    Nota: CONAB requer Playwright (pode nao estar instalado). O fallback IBGE
    retorna dados com schema diferente do contrato CONAB, o que faz a lib
    lancar ContractViolation antes de chegar aqui.
    Culturas suportadas pelo agrobr: soja, milho, arroz, feijao, trigo, algodao.
    Cafe e acucar NAO sao suportados — a task deve omiti-los da lista.

    Esta funcao e reservada para uso futuro quando o contrato IBGE for compativel.
    """
    return []


def normalizar_exportacao(df: pd.DataFrame, cultura: str, fonte: str) -> list[dict]:
    """
    Normaliza DataFrame de exportacao agricola (agrobr.datasets.exportacao / ComexStat).

    Schema real do agrobr (contracts/datasets.py — EXPORTACAO_V1):
      ano, mes, produto, uf, kg_liquido, valor_fob_usd

    valor_fob_usd armazena valor FOB em centavos de dolar (valor_fob * 100).
    Retorna dicts compatíveis com persistir_exportacao_mensal().
    """
    COLUNA_ANO   = "ano"
    COLUNA_MES   = "mes"
    COLUNA_VALOR = "valor_fob_usd"

    codigo = COMMODITY_NOME_PARA_CODIGO.get(cultura)
    if codigo is None:
        raise ValueError(
            f"Cultura '{cultura}' nao mapeada para codigo de banco. "
            f"Mapeamentos disponiveis: {list(COMMODITY_NOME_PARA_CODIGO.keys())}"
        )

    registros = []
    df = df.copy()
    df.columns = [c.strip().lower() for c in df.columns]

    if COLUNA_VALOR not in df.columns:
        raise KeyError(
            f"Coluna '{COLUNA_VALOR}' ausente no DataFrame ComexStat (cultura={cultura}). "
            f"Colunas disponiveis: {df.columns.tolist()}"
        )

    df = df.dropna(subset=[COLUNA_VALOR])

    for _, row in df.iterrows():
        try:
            registros.append({
                "codigo_commodity": codigo,
                "data_referencia":  date(int(row[COLUNA_ANO]), int(row[COLUNA_MES]), 1),
                "valor_fob_usd":    int(float(row[COLUNA_VALOR]) * 100),
                "fonte":            fonte,
            })
        except (ValueError, TypeError, KeyError):
            continue

    return registros


def normalizar_prohort(df: pd.DataFrame, fonte: str) -> list[dict]:
    """
    Normaliza DataFrame de precos de atacado PROHORT (agrobr.datasets.preco_atacado).

    Schema real do agrobr (contracts/datasets.py — PRECO_ATACADO_V1):
      data, produto, categoria, unidade, ceasa, ceasa_uf, preco

    ATENCAO: PROHORT cobre hortifruti (frutas e hortalicas como TOMATE, BATATA,
    LARANJA etc.). As 4 commodities do MVP (acucar, milho, cafe, soja) NAO constam
    na lista do PROHORT. Esta funcao processa os dados corretamente, mas
    persistir_cache_dados_mercado ignorara todos os registros por nao encontrar
    Comomodity correspondente — resultado esperado para o MVP.
    """
    COLUNA_PRODUTO = "produto"
    COLUNA_DATA    = "data"
    COLUNA_PRECO   = "preco"   # era "preco_medio" — nome real da lib

    registros = []
    df = df.copy()
    df.columns = [c.strip().lower() for c in df.columns]

    if COLUNA_PRECO not in df.columns:
        raise KeyError(
            f"Coluna '{COLUNA_PRECO}' ausente no DataFrame PROHORT. "
            f"Colunas disponiveis: {df.columns.tolist()}"
        )

    df = df.dropna(subset=[COLUNA_PRECO, COLUNA_PRODUTO])

    for _, row in df.iterrows():
        try:
            registros.append({
                "codigo_commodity": f"PROHORT_{str(row[COLUNA_PRODUTO]).upper().strip()}",
                "data_preco":       _to_date(row[COLUNA_DATA]),
                "preco_fechamento": int(round(
                    float(str(row[COLUNA_PRECO]).replace(",", ".")) * 100
                )),
                "fonte": fonte,
            })
        except (ValueError, TypeError, KeyError):
            continue

    return registros