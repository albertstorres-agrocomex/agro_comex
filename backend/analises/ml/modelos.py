import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import TransformedTargetRegressor

from analises.ml.dataset import COLUNAS_FEATURES

COLUNAS_MODELO = COLUNAS_FEATURES + ["commodity"]


def _preprocessamento() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), COLUNAS_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), ["commodity"]),
        ]
    )


def construir_pipeline(tipo: str = "arvores") -> TransformedTargetRegressor:
    if tipo == "linear":
        estimador = Ridge(alpha=1.0)
    elif tipo == "arvores":
        estimador = RandomForestRegressor(
            n_estimators=200, max_depth=4, min_samples_leaf=5, random_state=42
        )
    else:
        raise ValueError(f"tipo de modelo desconhecido: {tipo}")

    nucleo = Pipeline([("prep", _preprocessamento()), ("modelo", estimador)])
    return TransformedTargetRegressor(regressor=nucleo, func=np.log1p, inverse_func=np.expm1)
