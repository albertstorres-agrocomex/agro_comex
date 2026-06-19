from django.test import TestCase

from tipos_derivativo.models import TipoDerivativo
from tipos_derivativo.views import TipoDerivativoViewSet


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


class TestViewSetFiltraDisponiveis(TestCase):
    def test_queryset_exclui_indisponiveis(self):
        TipoDerivativo.objects.create(nome="DispTrue", rotulo="DT_T", disponivel=True)
        TipoDerivativo.objects.create(nome="DispFalse", rotulo="DF_T", disponivel=False)
        rotulos = set(
            TipoDerivativoViewSet().get_queryset().values_list("rotulo", flat=True)
        )
        self.assertIn("DT_T", rotulos)
        self.assertNotIn("DF_T", rotulos)
