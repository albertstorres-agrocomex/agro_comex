# backend/chatbot/tests/test_proativo_signals.py
from django.test import TestCase
from unittest.mock import patch, MagicMock
from chatbot.proativo import signals


class SignalsTest(TestCase):
    @patch("chatbot.proativo.signals.varrer_alertas_proativos")
    def test_dispara_para_task_gatilho(self, mock_task):
        sender = MagicMock()
        sender.name = "dados.tasks.agrobr.atualizar_precos_cepea"
        signals.disparar_varredura(sender=sender)
        mock_task.delay.assert_called_once()

    @patch("chatbot.proativo.signals.varrer_alertas_proativos")
    def test_ignora_task_nao_gatilho(self, mock_task):
        sender = MagicMock()
        sender.name = "analises.tasks.processar_analise"
        signals.disparar_varredura(sender=sender)
        mock_task.delay.assert_not_called()
