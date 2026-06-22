import datetime

from django.test import TestCase

from analises.calculators import calcular_curva_resultado
from dados.limpeza.conversao import LBS_PER_SACA_KC


def _criar_analise_cafe_com_valores_antigos():
    """Monta uma analise de cafe (KC) PUT com valor_total/lucro_maximo/curva
    gravados com o bug antigo (premio * qtd, sem conversao unidade->saca)."""
    from django.contrib.auth.models import User
    from analises.models import (
        SolicitacaoAnalise, ResultadoAnalise, CenarioAnalise, PontoCurvaResultado,
    )
    from commodities.models import Comomodity
    from tipos_derivativo.models import TipoDerivativo
    from usuario.models import Usuario
    from meses_contrato_futuro.models import MesContratoFurturo

    auth = User.objects.create_user(username="recalc_user", password="x")
    usuario = Usuario.objects.create(first_name="Recalc", user=auth)
    commodity = Comomodity.objects.create(nome="Cafe Arabica", codigo="KC", moeda="USD", unidade="lb")
    tipo = TipoDerivativo.objects.create(nome="put", rotulo="Put", requer_posicao=True, requer_barreira=False)
    mes = MesContratoFurturo.objects.create(
        commodity=commodity, codigo_mes="Z", ano=2026, ativo=True,
        data_vencimento=datetime.date(2026, 12, 30), ticket_completo="KCZ26",
    )
    sol = SolicitacaoAnalise.objects.create(
        usuario=usuario, commodity=commodity, tipo_derivativo=tipo, mes_contrato=mes,
        preco_mercado_atual=248, preco_exercicio=200, quantidade_sacas=100, posicao="comprador",
    )
    premio_centavos = 68  # USD/lb
    resultado = ResultadoAnalise.objects.create(
        solicitacao=sol,
        premio_calculado=premio_centavos,
        valor_total_contrato=premio_centavos * 100,             # BUG: sem fator
        lucro_maximo=round(max(2.00 - 0.68, 0) * 100 * 100),    # BUG: sem fator
    )
    cenario = CenarioAnalise.objects.create(
        resultado=resultado, nome="proposto",
        preco_exercicio_centavos=200, premio_centavos=premio_centavos,
    )
    pontos_antigos = calcular_curva_resultado(
        S=2.48, K=2.00, premio=0.68, posicao="comprador", tipo="put",
    )  # fator 1.0 (curva antiga, por libra)
    for p in pontos_antigos:
        PontoCurvaResultado.objects.create(
            cenario=cenario, preco_centavos=p["preco_centavos"],
            resultado_centavos=p["resultado_centavos"],
        )
    return resultado


class TestRecalcularResultado(TestCase):
    def test_valor_total_passa_a_aplicar_fator_saca(self):
        from analises.management.commands.recalcular_valor_total_saca import recalcular_resultado
        resultado = _criar_analise_cafe_com_valores_antigos()
        recalcular_resultado(resultado)
        resultado.refresh_from_db()
        assert resultado.valor_total_contrato == round(68 * LBS_PER_SACA_KC * 100)

    def test_lucro_maximo_passa_a_aplicar_fator_saca(self):
        from analises.management.commands.recalcular_valor_total_saca import recalcular_resultado
        resultado = _criar_analise_cafe_com_valores_antigos()
        recalcular_resultado(resultado)
        resultado.refresh_from_db()
        # lucro_bruto = K - premio = 2.00 - 0.68 = 1.32 USD/lb
        assert resultado.lucro_maximo == round(1.32 * 100 * LBS_PER_SACA_KC * 100)

    def test_premio_calculado_nao_muda(self):
        from analises.management.commands.recalcular_valor_total_saca import recalcular_resultado
        resultado = _criar_analise_cafe_com_valores_antigos()
        recalcular_resultado(resultado)
        resultado.refresh_from_db()
        assert resultado.premio_calculado == 68  # premio permanece por libra

    def test_curva_passa_a_ser_por_saca(self):
        from analises.management.commands.recalcular_valor_total_saca import recalcular_resultado
        resultado = _criar_analise_cafe_com_valores_antigos()
        recalcular_resultado(resultado)
        esperados = calcular_curva_resultado(
            S=2.48, K=2.00, premio=0.68, posicao="comprador", tipo="put",
            unidades_por_saca=LBS_PER_SACA_KC,
        )
        cenario = resultado.cenarios.get(nome="proposto")
        pontos = list(cenario.pontos_curva.order_by("preco_centavos"))
        assert [p.resultado_centavos for p in pontos] == [e["resultado_centavos"] for e in esperados]

    def test_idempotente(self):
        from analises.management.commands.recalcular_valor_total_saca import recalcular_resultado
        resultado = _criar_analise_cafe_com_valores_antigos()
        recalcular_resultado(resultado)
        resultado.refresh_from_db()
        valor_apos_1 = resultado.valor_total_contrato
        lucro_apos_1 = resultado.lucro_maximo
        recalcular_resultado(resultado)
        resultado.refresh_from_db()
        assert resultado.valor_total_contrato == valor_apos_1
        assert resultado.lucro_maximo == lucro_apos_1
