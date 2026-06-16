import numpy as np
import pandas as pd


def split_cronologico(df_dataset: pd.DataFrame, frac_treino: float = 0.8):
    ordenado = df_dataset.sort_values("data_t").reset_index(drop=True)
    corte = int(len(ordenado) * frac_treino)
    return ordenado.iloc[:corte].copy(), ordenado.iloc[corte:].copy()


def folds_temporais_com_gap(df_dataset: pd.DataFrame, n_splits: int = 3, gap: int = 21):
    n = len(df_dataset)
    folds = []
    tamanho_val = max(1, (n - gap) // (n_splits + 1))
    for k in range(1, n_splits + 1):
        fim_treino = tamanho_val * k
        inicio_val = fim_treino + gap
        fim_val = inicio_val + tamanho_val
        if inicio_val >= n:
            break
        idx_treino = list(range(0, fim_treino))
        idx_val = list(range(inicio_val, min(fim_val, n)))
        if idx_treino and idx_val:
            folds.append((idx_treino, idx_val))
    return folds
