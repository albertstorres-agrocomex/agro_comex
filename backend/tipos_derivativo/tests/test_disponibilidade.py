from django.test import TestCase

from tipos_derivativo.models import TipoDerivativo


class TestCampoDisponivel(TestCase):
    def test_default_disponivel_true(self):
        tipo = TipoDerivativo.objects.create(nome="Teste", rotulo="TST_T")
        self.assertTrue(tipo.disponivel)

    def test_pode_marcar_indisponivel(self):
        tipo = TipoDerivativo.objects.create(
            nome="Teste2", rotulo="TST2_T", disponivel=False
        )
        self.assertFalse(tipo.disponivel)


class TestSeedForwardSwapIndisponiveis(TestCase):
    def test_forward_e_swap_indisponiveis(self):
        self.assertFalse(TipoDerivativo.objects.get(rotulo="FWD").disponivel)
        self.assertFalse(TipoDerivativo.objects.get(rotulo="SWAP").disponivel)

    def test_apenas_forward_e_swap_desativados(self):
        indisponiveis = set(
            TipoDerivativo.objects.filter(disponivel=False).values_list(
                "rotulo", flat=True
            )
        )
        self.assertEqual(indisponiveis, {"FWD", "SWAP"})
