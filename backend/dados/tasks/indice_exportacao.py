import hashlib
import logging
from datetime import date

from celery import shared_task
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_TIMEOUT = 6 * 60 * 60  # 6 horas
N_TRIMESTRES = 6
LOOKBACK_YEARS = 3

# Mapeamento semantico: codigo da Comomodity -> token de cor do styleguide
CODIGO_TO_COLOR_KEY: dict[str, str] = {
    "ZS": "chart-1",  # Soja   — verde
    "ZC": "chart-2",  # Milho  — lima
    "KC": "chart-3",  # Cafe   — ambar
    "SB": "chart-4",  # Acucar — violeta
}
DEFAULT_COLOR_KEY = "chart-5"  # Outros — teal


def _cache_key(commodity_ids: list[int]) -> str:
    ids_str = ",".join(str(i) for i in sorted(commodity_ids))
    digest = hashlib.md5(ids_str.encode()).hexdigest()[:8]
    return f"indice_exp:{digest}"


@shared_task(bind=True, max_retries=2, default_retry_delay=30)
def calcular_indice_exportacao(self, commodity_ids: list[int]) -> dict:
    """
    Calcula indice de exportacao base 100 por trimestre para as commodities
    indicadas. Utiliza dados de ExportacaoMensal (fonte: COMEXSTAT_EXPORT).

    Fluxo: API -> Redis (verifica cache) -> Celery (computa) -> Redis (armazena)

    A janela de trimestres e construida dinamicamente a partir dos trimestres
    que possuem dados no banco, tomando os N_TRIMESTRES mais recentes.
    Resultado armazenado em cache Redis por 6 horas.
    """
    from commodities.models import Comomodity
    from dados.models import ExportacaoMensal

    key = _cache_key(commodity_ids)
    cached = cache.get(key)
    if cached:
        return cached

    commodities = list(
        Comomodity.objects.filter(id__in=commodity_ids, ativo=True)
        .values("id", "nome", "codigo", "imagem_url")
    )

    if not commodities:
        result: dict = {"chart_data": [], "series": [], "stats": []}
        cache.set(key, result, CACHE_TIMEOUT)
        return result

    cutoff_year = date.today().year - LOOKBACK_YEARS

    qs = ExportacaoMensal.objects.filter(
        commodity_id__in=[c["id"] for c in commodities],
        data_referencia__year__gte=cutoff_year,
    ).values("commodity_id", "data_referencia", "valor_fob_usd")

    # totais[cid][(ano, trimestre)] = soma FOB mensal (centavos de USD)
    totais: dict[int, dict[tuple, int]] = {c["id"]: {} for c in commodities}

    for row in qs:
        cid = row["commodity_id"]
        dp = row["data_referencia"]
        q_num = (dp.month - 1) // 3 + 1
        key_q = (dp.year, q_num)
        totais[cid][key_q] = totais[cid].get(key_q, 0) + row["valor_fob_usd"]

    # Janela dinamica: union de todos os trimestres com dado, excluindo o
    # trimestre atual (incompleto), tomando os N_TRIMESTRES mais recentes
    today = date.today()
    current_q = (today.year, (today.month - 1) // 3 + 1)

    all_quarters = sorted(
        {q for q_dict in totais.values() for q in q_dict} - {current_q}
    )
    quarters = all_quarters[-N_TRIMESTRES:]

    if not quarters:
        result = {"chart_data": [], "series": [], "stats": []}
        cache.set(key, result, CACHE_TIMEOUT)
        return result

    # Normalizar base 100: primeiro trimestre da janela com dado = 100
    series_index: dict[int, dict[tuple, float]] = {}
    for cid, q_totals in totais.items():
        data_in_window = {q: v for q, v in q_totals.items() if q in quarters}
        if not data_in_window:
            continue
        first_q = next((q for q in quarters if q in data_in_window), None)
        if first_q is None:
            continue
        base = data_in_window[first_q]
        if base == 0:
            continue
        series_index[cid] = {
            q: round((v / base) * 100, 1) for q, v in data_in_window.items()
        }

    quarter_labels = [f"T{q} {str(y)[2:]}" for y, q in quarters]

    chart_data = []
    for i, (y, q) in enumerate(quarters):
        row_data: dict = {"quarter": quarter_labels[i]}
        for c in commodities:
            cid = c["id"]
            if cid in series_index:
                row_data[c["codigo"]] = series_index[cid].get((y, q))
        chart_data.append(row_data)

    series = []
    for c in commodities:
        if c["id"] in series_index:
            series.append({
                "commodity_id": c["id"],
                "nome": c["nome"],
                "codigo": c["codigo"],
                "data_key": c["codigo"],
                "color_key": CODIGO_TO_COLOR_KEY.get(c["codigo"], DEFAULT_COLOR_KEY),
                "imagem_url": c["imagem_url"],
            })

    stats = []
    for s in series:
        cid = s["commodity_id"]
        idx = series_index[cid]
        vals = [idx[q] for q in quarters if q in idx]
        if len(vals) >= 2:
            pct = round(vals[-1] - vals[0], 1)
            sign = "+" if pct >= 0 else ""
            variant = "success" if pct >= 0 else "destructive"
            if pct >= 20:
                label_prefix = "Maior alta"
            elif pct <= -20:
                label_prefix = "Maior queda"
            else:
                label_prefix = "Variacao"
            stats.append({
                "label": f"{label_prefix} \u2014 {s['nome']}",
                "value": f"{sign}{pct}% em {len(vals)} trimestres",
                "variant": variant,
            })

    result = {"chart_data": chart_data, "series": series, "stats": stats}
    cache.set(key, result, CACHE_TIMEOUT)
    logger.info(
        "Indice de exportacao calculado: %d commodities, %d trimestres.",
        len(series), len(quarters),
    )
    return result
