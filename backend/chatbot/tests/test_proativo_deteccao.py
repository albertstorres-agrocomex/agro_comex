# backend/chatbot/tests/test_proativo_deteccao.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from usuario.models import Usuario
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from analises.models import SolicitacaoAnalise
from chatbot.models import Conversation, ConversationMessage, EstadoAlertaAnalise
from chatbot.proativo import deteccao

User = get_user_model()


def _analise(status="concluido", preco_exercicio=4600):
    n = SolicitacaoAnalise.objects.count()
    user = User.objects.create_user(username=f"d{n}@t.com", password="p")
    perfil = Usuario.objects.get_or_create(user=user)[0]
    commodity = Comomodity.objects.create(nome="Soja", codigo=f"ZS{n}", bolsa="CME", unidade="bushel", moeda="USD")
    tipo = TipoDerivativo.objects.create(nome="Call", rotulo="CALL")
    return SolicitacaoAnalise.objects.create(
        usuario=perfil, commodity=commodity, tipo_derivativo=tipo,
        preco_mercado_atual=4500, preco_exercicio=preco_exercicio, status=status, posicao="comprador",
    )


class DeteccaoTest(TestCase):
    @patch("chatbot.proativo.deteccao.obter_cotacao_cache", return_value=None)
    def test_cenario_pendente_gera_uma_mensagem(self, _cot):
        analise = _analise()
        deteccao.varrer_alertas_proativos()
        msgs = ConversationMessage.objects.filter(is_proativa=True, tipo_alerta="cenario_nao_escolhido")
        self.assertEqual(msgs.count(), 1)
        self.assertEqual(msgs.first().conversation.user, analise.usuario.user)

    @patch("chatbot.proativo.deteccao.obter_cotacao_cache", return_value=None)
    def test_cenario_nao_duplica_em_nova_varredura(self, _cot):
        _analise()
        deteccao.varrer_alertas_proativos()
        deteccao.varrer_alertas_proativos()
        self.assertEqual(
            ConversationMessage.objects.filter(tipo_alerta="cenario_nao_escolhido").count(), 1
        )

    def test_cotacao_alerta_apenas_na_transicao(self):
        analise = _analise(preco_exercicio=4600)  # strike 46.00
        # 1a varredura: spot 45 (abaixo) -> registra estado, sem alerta
        with patch("chatbot.proativo.deteccao.obter_cotacao_cache",
                   return_value={"preco_usd": 45.0, "data_preco": None, "fonte": "X"}):
            deteccao.varrer_alertas_proativos()
        self.assertEqual(ConversationMessage.objects.filter(tipo_alerta="cotacao_cruzou").count(), 0)
        # 2a varredura: spot 47 (acima) -> transicao -> alerta
        with patch("chatbot.proativo.deteccao.obter_cotacao_cache",
                   return_value={"preco_usd": 47.0, "data_preco": None, "fonte": "X"}):
            deteccao.varrer_alertas_proativos()
        self.assertEqual(ConversationMessage.objects.filter(tipo_alerta="cotacao_cruzou").count(), 1)
