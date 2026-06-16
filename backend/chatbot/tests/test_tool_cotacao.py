from datetime import date
from unittest.mock import patch
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from commodities.models import Comomodity
from usuario.models import Usuario
from chatbot.tool_cotacao import make_cotacao_tool

User = get_user_model()


class CotacaoToolTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ana@test.com", password="x")
        self.perfil = Usuario.objects.get_or_create(user=self.user)[0]
        self.soja = Comomodity.objects.create(
            nome="Soja", codigo="ZS", bolsa="B3", unidade="saca", moeda="USD"
        )
        self.cafe = Comomodity.objects.create(
            nome="Cafe", codigo="KC", bolsa="ICE", unidade="saca", moeda="USD"
        )
        self.perfil.commodities.add(self.soja)  # usuario NAO tem cafe

    def _tool(self):
        return make_cotacao_tool(self.user)

    @override_settings(COTACAO_MODO="CACHE")
    @patch("chatbot.tool_cotacao.obter_cotacao_cache")
    def test_commodity_associada_modo_cache(self, mock_cache):
        mock_cache.return_value = {
            "preco_usd": 135.0, "data_preco": date(2026, 6, 15), "fonte": "CEPEA_SPOT"
        }
        out = self._tool().invoke({"commodity": "soja"})
        self.assertIn("135", out)
        self.assertIn("15/06/2026", out)

    @override_settings(COTACAO_MODO="CACHE")
    def test_commodity_nao_associada_recusa(self):
        out = self._tool().invoke({"commodity": "cafe"})
        self.assertIn("nao esta associada", out.lower().replace("ã", "a"))

    @override_settings(COTACAO_MODO="AO_VIVO")
    @patch("chatbot.tool_cotacao.obter_cotacao_cache")
    @patch("chatbot.tool_cotacao.obter_cotacao_ao_vivo")
    def test_ao_vivo_falha_cai_no_cache(self, mock_vivo, mock_cache):
        mock_vivo.side_effect = TimeoutError("lento")
        mock_cache.return_value = {
            "preco_usd": 134.0, "data_preco": date(2026, 6, 14), "fonte": "CEPEA_SPOT"
        }
        out = self._tool().invoke({"commodity": "soja"})
        self.assertIn("134", out)
        mock_cache.assert_called_once()

    @override_settings(COTACAO_MODO="CACHE")
    @patch("chatbot.tool_cotacao.obter_cotacao_cache")
    def test_commodity_inexistente_pede_esclarecimento(self, mock_cache):
        out = self._tool().invoke({"commodity": "ouro"})
        self.assertIn("nao identifiquei", out.lower().replace("ã", "a"))
        mock_cache.assert_not_called()
