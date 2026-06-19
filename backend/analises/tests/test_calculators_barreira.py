import math
import pytest
from analises.calculators import black_scholes
from analises.calculators_barreira import black_scholes_barreira, inferir_direcao

S, K, T, R, SIG = 100.0, 100.0, 1.0, 0.05, 0.20


class TestInferirDirecao:
    def test_barreira_abaixo_do_spot_e_down(self):
        assert inferir_direcao(90.0, 100.0) == "down"

    def test_barreira_acima_do_spot_e_up(self):
        assert inferir_direcao(110.0, 100.0) == "up"

    def test_barreira_igual_ao_spot_levanta(self):
        with pytest.raises(ValueError):
            inferir_direcao(100.0, 100.0)


class TestParidadeInOut:
    # vanilla = knock_in + knock_out, para as 8 variantes
    @pytest.mark.parametrize("tipo,direcao,H", [
        ("call", "down", 90.0), ("call", "up", 110.0),
        ("put", "down", 90.0), ("put", "up", 110.0),
    ])
    def test_in_mais_out_igual_vanilla(self, tipo, direcao, H):
        vanilla = black_scholes(S, K, T, R, SIG, tipo)
        ki = black_scholes_barreira(S, K, H, T, R, SIG, tipo, "in", direcao)
        ko = black_scholes_barreira(S, K, H, T, R, SIG, tipo, "out", direcao)
        assert abs((ki + ko) - vanilla) < 1e-6


class TestLimites:
    @pytest.mark.parametrize("tipo,knock,direcao,H", [
        ("call", "in", "down", 90.0), ("call", "out", "down", 90.0),
        ("put", "out", "up", 110.0), ("put", "in", "up", 110.0),
    ])
    def test_preco_entre_zero_e_vanilla(self, tipo, knock, direcao, H):
        vanilla = black_scholes(S, K, T, R, SIG, tipo)
        preco = black_scholes_barreira(S, K, H, T, R, SIG, tipo, knock, direcao)
        assert -1e-9 <= preco <= vanilla + 1e-6

    def test_down_out_call_mais_caro_com_barreira_distante(self):
        perto = black_scholes_barreira(S, K, 99.0, T, R, SIG, "call", "out", "down")
        longe = black_scholes_barreira(S, K, 70.0, T, R, SIG, "call", "out", "down")
        assert longe > perto


class TestVencimento:
    def test_T_zero_out_call_vale_intrinseco(self):
        preco = black_scholes_barreira(110.0, 100.0, 90.0, 0.0, R, SIG, "call", "out", "down")
        assert preco == pytest.approx(10.0)

    def test_T_zero_in_vale_zero(self):
        preco = black_scholes_barreira(110.0, 100.0, 90.0, 0.0, R, SIG, "call", "in", "down")
        assert preco == 0.0


@pytest.mark.django_db
class TestBarreiraTipoField:
    def test_choices_aceitos(self):
        from analises.models import SolicitacaoAnalise
        campo = SolicitacaoAnalise._meta.get_field("barreira_tipo")
        valores = {c[0] for c in campo.choices}
        assert valores == {"knock_in", "knock_out"}
        assert campo.null is True
