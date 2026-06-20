# backend/chatbot/tests/test_proativo_deteccao_melhor_momento.py
import datetime as dt
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from usuario.models import Usuario
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from meses_contrato_futuro.models import MesContratoFurturo
from analises.models import SolicitacaoAnalise, ResultadoAnalise
from chatbot.models import ConversationMessage
from chatbot.proativo import deteccao

User = get_user_model()


def _analise_call_itm():
    n = SolicitacaoAnalise.objects.count()
    user = User.objects.create_user(username=f"mm{n}@t.com", password="p")
    perfil = Usuario.objects.get_or_create(user=user)[0]
    commodity = Comomodity.objects.create(nome="Soja", codigo=f"ZS{n}", bolsa="CME", unidade="bushel", moeda="USD")
    tipo = TipoDerivativo.objects.create(nome="Call", rotulo="CALL")
    analise = SolicitacaoAnalise.objects.create(
        usuario=perfil, commodity=commodity, tipo_derivativo=tipo,
        preco_mercado_atual=4500, preco_exercicio=4000, status="concluido", posicao="comprador",
    )
    ResultadoAnalise.objects.create(
        solicitacao=analise, premio_calculado=100, percentual_premio=Decimal("2.0"),
        valor_total_contrato=1000, lucro_maximo=500, volatilidade_utilizada=Decimal("0.2"),
        taxa_juros_utilizada=Decimal("0.1"), d1=Decimal("0.5"), d2=Decimal("0.4"),
    )
    return analise


class MelhorMomentoDeteccaoTest(TestCase):
    def test_intrinseco_relevante_gera_alerta(self):
        analise = _analise_call_itm()  # strike 40.00, premio 1.00; spot 47 -> intrinseco 7.00 >= 1.5
        with patch("chatbot.proativo.deteccao.obter_cotacao_cache",
                   return_value={"preco_usd": 47.0, "data_preco": None, "fonte": "X"}):
            deteccao.varrer_alertas_proativos()
        self.assertEqual(
            ConversationMessage.objects.filter(tipo_alerta="melhor_momento").count(), 1
        )

    def test_premio_nulo_nao_aborta_knockout_e_vencimento(self):
        """ResultadoAnalise com premio_calculado=None nao deve impedir avaliacao
        de knockout/vencimento nem crashar a varredura."""
        n = SolicitacaoAnalise.objects.count()
        user = User.objects.create_user(username=f"mm_nulo{n}@t.com", password="p")
        perfil = Usuario.objects.get_or_create(user=user)[0]
        commodity = Comomodity.objects.create(
            nome="Soja", codigo=f"ZSN{n}", bolsa="CME", unidade="bushel", moeda="USD",
        )
        tipo = TipoDerivativo.objects.create(nome="Call", rotulo="CALL")
        venc = dt.date.today() + dt.timedelta(days=3)
        mes = MesContratoFurturo.objects.create(
            commodity=commodity, codigo_mes="F", ano=2026, data_vencimento=venc,
        )
        analise = SolicitacaoAnalise.objects.create(
            usuario=perfil, commodity=commodity, tipo_derivativo=tipo,
            preco_mercado_atual=4500, preco_exercicio=4000, status="concluido",
            posicao="comprador", mes_contrato=mes,
        )
        ResultadoAnalise.objects.create(
            solicitacao=analise, premio_calculado=None, percentual_premio=Decimal("2.0"),
            valor_total_contrato=1000, lucro_maximo=500, volatilidade_utilizada=Decimal("0.2"),
            taxa_juros_utilizada=Decimal("0.1"), d1=Decimal("0.5"), d2=Decimal("0.4"),
        )
        # spot 47 -> intrinseco 7.0 para Call ITM; vencimento em 3 dias uteis -> proximo_vencimento
        with patch("chatbot.proativo.deteccao.obter_cotacao_cache",
                   return_value={"preco_usd": 47.0, "data_preco": None, "fonte": "X"}):
            result = deteccao.varrer_alertas_proativos()
        # A varredura nao deve crashar
        self.assertGreaterEqual(result["analises_avaliadas"], 1)
        # Vencimento proximo com intrinseco positivo deve gerar alerta melhor_momento
        self.assertGreaterEqual(
            ConversationMessage.objects.filter(tipo_alerta="melhor_momento").count(), 1,
        )

    def test_nao_duplica_enquanto_continua_disparado(self):
        _analise_call_itm()
        with patch("chatbot.proativo.deteccao.obter_cotacao_cache",
                   return_value={"preco_usd": 47.0, "data_preco": None, "fonte": "X"}):
            deteccao.varrer_alertas_proativos()
            deteccao.varrer_alertas_proativos()
        self.assertEqual(
            ConversationMessage.objects.filter(tipo_alerta="melhor_momento").count(), 1
        )
