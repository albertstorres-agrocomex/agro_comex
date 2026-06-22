"""
Reprocessa analises ja concluidas para corrigir a conversao unidade-padrao ->
saca no valor total do contrato, lucro maximo e curva de resultado.

O premio (premio_calculado / premio_centavos) sempre esteve em USD/unidade-padrao
e NAO e alterado. O comando apenas re-deriva os valores monetarios totais a partir
desse premio aplicando unidades_por_saca(codigo), por isso e idempotente: rodar
varias vezes produz o mesmo resultado e nao re-precifica com o mercado de hoje.
"""

from django.core.management.base import BaseCommand
from django.db import transaction

from analises.calculators import calcular_curva_resultado
from dados.limpeza.conversao import unidades_por_saca


@transaction.atomic
def recalcular_resultado(resultado) -> None:
    """Recalcula valor_total_contrato, lucro_maximo e a curva de cada cenario
    de um ResultadoAnalise, aplicando o fator unidade-padrao -> saca."""
    solicitacao = resultado.solicitacao
    premio_centavos = resultado.premio_calculado
    if premio_centavos is None:
        return

    fator = unidades_por_saca(solicitacao.commodity.codigo)
    qtd = solicitacao.quantidade_sacas
    tipo_nome = solicitacao.tipo_derivativo.nome.lower()
    is_put = "put" in tipo_nome
    posicao = solicitacao.posicao or "comprador"

    resultado.valor_total_contrato = round(premio_centavos * fator * qtd) if qtd else None

    if is_put:
        K = solicitacao.preco_exercicio / 100.0
        premio_reais = premio_centavos / 100.0
        lucro_bruto = max(K - premio_reais, 0)
        resultado.lucro_maximo = (
            round(lucro_bruto * 100 * fator * qtd) if qtd
            else round(lucro_bruto * 100 * fator)
        )
    else:
        resultado.lucro_maximo = None

    resultado.save(update_fields=["valor_total_contrato", "lucro_maximo"])

    S = solicitacao.preco_mercado_atual / 100.0
    tipo = "put" if is_put else "call"
    for cenario in resultado.cenarios.all():
        K_cenario = cenario.preco_exercicio_centavos / 100.0
        premio_cenario = cenario.premio_centavos / 100.0
        novos = calcular_curva_resultado(S, K_cenario, premio_cenario, posicao, tipo, fator)
        pontos = list(cenario.pontos_curva.order_by("preco_centavos"))
        for ponto, novo in zip(pontos, novos):
            if ponto.resultado_centavos != novo["resultado_centavos"]:
                ponto.resultado_centavos = novo["resultado_centavos"]
                ponto.save(update_fields=["resultado_centavos"])


class Command(BaseCommand):
    help = (
        "Recalcula valor_total_contrato, lucro_maximo e curva de resultado das "
        "analises ja concluidas, aplicando a conversao unidade-padrao -> saca. "
        "Idempotente."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true",
            help="Apenas relata quantas analises seriam reprocessadas, sem gravar.",
        )

    def handle(self, *args, **options):
        from analises.models import ResultadoAnalise

        dry_run = options["dry_run"]
        qs = ResultadoAnalise.objects.select_related(
            "solicitacao__commodity", "solicitacao__tipo_derivativo"
        )
        total = qs.count()
        self.stdout.write(f"Analises a reprocessar: {total}")

        if dry_run:
            self.stdout.write(self.style.WARNING("dry-run: nada foi gravado."))
            return

        processadas = 0
        for resultado in qs.iterator():
            recalcular_resultado(resultado)
            processadas += 1

        self.stdout.write(self.style.SUCCESS(f"Concluido. {processadas} analises reprocessadas."))
