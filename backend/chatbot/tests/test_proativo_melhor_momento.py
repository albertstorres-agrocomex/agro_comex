import datetime as dt
from django.test import TestCase
from chatbot.proativo import regras


class MelhorMomentoSinaisTest(TestCase):
    def test_intrinseco_call_e_put(self):
        self.assertEqual(regras.valor_intrinseco_usd("Call", 47.0, 46.0), 1.0)
        self.assertEqual(regras.valor_intrinseco_usd("Call", 45.0, 46.0), 0.0)
        self.assertEqual(regras.valor_intrinseco_usd("Put", 45.0, 46.0), 1.0)

    def test_proximo_knockout_dentro_e_fora_da_tolerancia(self):
        self.assertTrue(regras.proximo_knockout(50.9, 50.0, "knock_out"))   # 1.8% -> dentro
        self.assertFalse(regras.proximo_knockout(48.0, 50.0, "knock_out"))  # 4% -> fora
        self.assertFalse(regras.proximo_knockout(50.9, 50.0, "knock_in"))   # so knock_out

    def test_intrinseco_relevante(self):
        self.assertTrue(regras.intrinseco_relevante(1.6, 1.0))   # 160% do premio
        self.assertFalse(regras.intrinseco_relevante(1.0, 1.0))  # 100%

    def test_dias_uteis_ate(self):
        seg = dt.date(2026, 6, 22)
        sex = dt.date(2026, 6, 26)
        self.assertEqual(regras.dias_uteis_ate(sex, seg), 4)

    def test_proximo_vencimento(self):
        self.assertTrue(regras.proximo_vencimento(3, 1.0))
        self.assertFalse(regras.proximo_vencimento(3, 0.0))   # sem intrinseco
        self.assertFalse(regras.proximo_vencimento(10, 1.0))  # longe
