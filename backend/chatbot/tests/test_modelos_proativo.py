# backend/chatbot/tests/test_modelos_proativo.py
from django.test import TestCase
from django.contrib.auth import get_user_model
from usuario.models import Usuario
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from analises.models import SolicitacaoAnalise
from chatbot.models import Conversation, ConversationMessage, EstadoAlertaAnalise

User = get_user_model()


def _analise():
    user = User.objects.create_user(username="t@test.com", password="pass")
    perfil = Usuario.objects.get_or_create(user=user)[0]
    commodity = Comomodity.objects.create(nome="Soja", codigo="ZS", bolsa="CME", unidade="bushel", moeda="USD")
    tipo = TipoDerivativo.objects.create(nome="Call", rotulo="CALL", requer_posicao=True, requer_barreira=False)
    return SolicitacaoAnalise.objects.create(
        usuario=perfil, commodity=commodity, tipo_derivativo=tipo,
        preco_mercado_atual=4500, preco_exercicio=4600, status="concluido", posicao="comprador",
    )


class ModelosProativoTest(TestCase):
    def test_conversation_proativa_flag(self):
        analise = _analise()
        conv = Conversation.objects.create(user=analise.usuario.user, is_proativa=True)
        self.assertTrue(conv.is_proativa)

    def test_mensagem_proativa_campos(self):
        analise = _analise()
        conv = Conversation.objects.create(user=analise.usuario.user, is_proativa=True)
        msg = ConversationMessage.objects.create(
            conversation=conv, role="ai", content="oi", is_proativa=True,
            solicitacao=analise, tipo_alerta="cenario_nao_escolhido",
        )
        self.assertIsNone(msg.lida_em)
        self.assertEqual(msg.solicitacao, analise)

    def test_estado_alerta_unico_por_tipo(self):
        from django.db import IntegrityError
        analise = _analise()
        EstadoAlertaAnalise.objects.create(solicitacao=analise, tipo_alerta="cotacao_cruzou", ultimo_estado="acima")
        with self.assertRaises(IntegrityError):
            EstadoAlertaAnalise.objects.create(solicitacao=analise, tipo_alerta="cotacao_cruzou", ultimo_estado="abaixo")
