import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np


def tabela_metricas_md(metricas: dict) -> str:
    mh_rmse = metricas["modelo_holdout_rmse"]
    b252_rmse = metricas.get("baseline252_holdout_rmse")
    garch_rmse = metricas.get("garch_holdout_rmse")
    bateu_252 = "sim" if b252_rmse is not None and mh_rmse < b252_rmse else "nao"
    bateu_garch = "sim" if garch_rmse is not None and mh_rmse < garch_rmse else "nao"

    linhas = [
        "## Resultados — Volatilidade futura (H=21, pooled commodity-aware)",
        "",
        f"Amostras: treino={metricas.get('n_treino')} | holdout={metricas.get('n_holdout')}",
        "",
        "| Metodo | RMSE treino | MAE treino | RMSE holdout | MAE holdout | Bateu? |",
        "|--------|-------------|------------|--------------|-------------|--------|",
        f"| Modelo | {metricas.get('modelo_treino_rmse'):.4f} | "
        f"{metricas.get('modelo_treino_mae'):.4f} | {mh_rmse:.4f} | "
        f"{metricas.get('modelo_holdout_mae'):.4f} | - |",
        f"| Baseline 252d | - | - | {b252_rmse:.4f} | "
        f"{metricas.get('baseline252_holdout_mae'):.4f} | {bateu_252} |",
    ]
    if garch_rmse is not None:
        linhas.append(
            f"| GARCH(1,1) | - | - | {garch_rmse:.4f} | "
            f"{metricas.get('garch_holdout_mae'):.4f} | {bateu_garch} |"
        )
    linhas.append("")
    linhas.append(
        "Criterio de sucesso (Fase 2): modelo bate ambos os baselines em RMSE no holdout."
    )
    return "\n".join(linhas)


def grafico_previsto_vs_realizado(y_true, y_pred, commodities, caminho_png: str) -> str:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    commodities = np.asarray(commodities)

    fig, ax = plt.subplots(figsize=(6, 6))
    for c in np.unique(commodities):
        m = commodities == c
        ax.scatter(y_true[m], y_pred[m], label=str(c), alpha=0.7)
    lim_min = float(min(y_true.min(), y_pred.min()))
    lim_max = float(max(y_true.max(), y_pred.max()))
    ax.plot([lim_min, lim_max], [lim_min, lim_max], "k--", linewidth=1)
    ax.set_xlabel("Volatilidade realizada (y)")
    ax.set_ylabel("Volatilidade prevista")
    ax.set_title("Previsto vs Realizado (holdout)")
    ax.legend(title="Commodity")
    fig.tight_layout()
    fig.savefig(caminho_png, dpi=120)
    plt.close(fig)
    return caminho_png


def salvar_relatorio(metricas: dict, caminho_md: str) -> str:
    with open(caminho_md, "w", encoding="utf-8") as f:
        f.write(tabela_metricas_md(metricas))
    return caminho_md
