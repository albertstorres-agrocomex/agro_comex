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


class PersistirExportacaoMensalTest(TestCase):
    def setUp(self):
        self.commodity = Comomodity.objects.create(
            codigo="ZS", nome="Soja", bolsa="CME",
            unidade="bushel", moeda="USD", ativo=True,
        )

    def test_persiste_registro_novo(self):
        from datetime import date
        from dados.servicos import persistir_exportacao_mensal

        registros = [
            {
                "codigo_commodity": "ZS",
                "data_referencia": date(2025, 1, 1),
                "valor_fob_usd": 44594875800,
                "fonte": "COMEXSTAT_EXPORT",
            }
        ]
        count = persistir_exportacao_mensal(registros)
        self.assertEqual(count, 1)
        self.assertEqual(ExportacaoMensal.objects.count(), 1)

    def test_atualiza_registro_existente(self):
        from datetime import date
        from dados.servicos import persistir_exportacao_mensal

        registros = [
            {
                "codigo_commodity": "ZS",
                "data_referencia": date(2025, 1, 1),
                "valor_fob_usd": 44594875800,
                "fonte": "COMEXSTAT_EXPORT",
            }
        ]
        persistir_exportacao_mensal(registros)

        registros[0]["valor_fob_usd"] = 50000000000
        persistir_exportacao_mensal(registros)

        obj = ExportacaoMensal.objects.get()
        self.assertEqual(obj.valor_fob_usd, 50000000000)

    def test_ignora_commodity_inexistente(self):
        from datetime import date
        from dados.servicos import persistir_exportacao_mensal

        registros = [
            {
                "codigo_commodity": "XX",
                "data_referencia": date(2025, 1, 1),
                "valor_fob_usd": 1000,
                "fonte": "COMEXSTAT_EXPORT",
            }
        ]
        count = persistir_exportacao_mensal(registros)
        self.assertEqual(count, 0)
        self.assertEqual(ExportacaoMensal.objects.count(), 0)
