from django.test import TestCase
from dados.models import ExportacaoMensal
from commodities.models import Comomodity


class ExportacaoMensalModelTest(TestCase):
    def setUp(self):
        self.commodity = Comomodity.objects.create(
            codigo="ZS", nome="Soja", bolsa="CME",
            unidade="bushel", moeda="USD", ativo=True,
        )

    def test_criacao_basica(self):
        from datetime import date
        obj = ExportacaoMensal.objects.create(
            commodity=self.commodity,
            data_referencia=date(2025, 1, 1),
            valor_fob_usd=44594875800,
            fonte="COMEXSTAT_EXPORT",
        )
        self.assertEqual(obj.valor_fob_usd, 44594875800)
        self.assertEqual(obj.fonte, "COMEXSTAT_EXPORT")

    def test_unique_together(self):
        from datetime import date
        from django.db import IntegrityError
        ExportacaoMensal.objects.create(
            commodity=self.commodity,
            data_referencia=date(2025, 1, 1),
            valor_fob_usd=44594875800,
            fonte="COMEXSTAT_EXPORT",
        )
        with self.assertRaises(IntegrityError):
            ExportacaoMensal.objects.create(
                commodity=self.commodity,
                data_referencia=date(2025, 1, 1),
                valor_fob_usd=99999,
                fonte="COMEXSTAT_EXPORT",
            )
