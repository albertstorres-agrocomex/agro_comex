from django.test import TestCase
from types import SimpleNamespace
from chatbot.proativo import templates


class TemplatesTest(TestCase):
    def setUp(self):
        self.analise = SimpleNamespace(commodity=SimpleNamespace(nome="Soja"))

    def test_cenario_menciona_commodity_e_sem_emoji(self):
        texto = templates.cenario_nao_escolhido(self.analise)
        self.assertIn("Soja", texto)
        self.assertIn("cenario", texto.lower())
        self.assertTrue(texto.isascii() or all(ord(c) < 0x1F000 for c in texto))

    def test_cotacao_menciona_valores(self):
        texto = templates.cotacao_cruzou(self.analise, 47.0, 46.0)
        self.assertIn("Soja", texto)
        self.assertIn("47.00", texto)
        self.assertIn("46.00", texto)
