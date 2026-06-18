from datetime import date
from decimal import Decimal
from django.test import TestCase
from dados.models import DadosMacroeconomicos
from chatbot.tool_cambio import make_cambio_tool


class CambioToolTest(TestCase):
    def test_retorna_usd_brl_mais_recente(self):
        DadosMacroeconomicos.objects.create(
            indicador="USD_BRL", data=date(2026, 6, 10),
            valor=Decimal("5.10"), fonte="BCB_SGS",
        )
        DadosMacroeconomicos.objects.create(
            indicador="USD_BRL", data=date(2026, 6, 17),
            valor=Decimal("5.43"), fonte="BCB_SGS",
        )
        out = make_cambio_tool().invoke({})
        self.assertIn("5.43", out)
        self.assertIn("17/06/2026", out)

    def test_sem_dado_informa_indisponibilidade(self):
        out = make_cambio_tool().invoke({})
        self.assertIn("nao tenho", out.lower().replace("ã", "a"))
