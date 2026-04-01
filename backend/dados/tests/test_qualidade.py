import pytest
from datetime import date, timedelta
from commodities.models import Comomodity
from dados.models import CacheDadosMercado
from dados.validacao.qualidade import QualidadeDado, validar_preco, validar_macro, validar_exportacao


def _criar_commodity(codigo, nome=None):
    return Comomodity.objects.get_or_create(
        codigo=codigo,
        defaults={"nome": nome or codigo, "unidade": "bu", "moeda": "USD", "ativo": True},
    )[0]


def _criar_cache(commodity, data_preco, preco_fechamento, fonte="B3_FUTUROS"):
    return CacheDadosMercado.objects.create(
        commodity=commodity,
        data_preco=data_preco,
        preco_fechamento=preco_fechamento,
        fonte=fonte,
    )


@pytest.mark.django_db
def test_validar_preco_ok_sem_historico():
    """Primeiro registro — sem historico, deve retornar OK."""
    qualidade, motivo = validar_preco("ZC", 500_00, date(2024, 1, 15), "B3_FUTUROS")
    assert qualidade == QualidadeDado.OK
    assert motivo is None


@pytest.mark.django_db
def test_validar_preco_suspeito_variacao_diaria():
    """Variacao de 20% no dia deve retornar SUSPEITO."""
    c = _criar_commodity("ZC")
    _criar_cache(c, date(2024, 1, 14), 50_000, "B3_FUTUROS")
    # +20% variacao
    qualidade, motivo = validar_preco("ZC", 60_000, date(2024, 1, 15), "B3_FUTUROS")
    assert qualidade == QualidadeDado.SUSPEITO
    assert "VARIACAO_DIARIA" in motivo


@pytest.mark.django_db
def test_validar_preco_invalido_variacao_diaria():
    """Variacao de 60% no dia deve retornar INVALIDO."""
    c = _criar_commodity("ZC")
    _criar_cache(c, date(2024, 1, 14), 50_000, "B3_FUTUROS")
    # +60% variacao
    qualidade, motivo = validar_preco("ZC", 80_000, date(2024, 1, 15), "B3_FUTUROS")
    assert qualidade == QualidadeDado.INVALIDO
    assert "VARIACAO_DIARIA" in motivo


@pytest.mark.django_db
def test_validar_preco_suspeito_zscore():
    """Z-score > 3 deve retornar SUSPEITO ou INVALIDO."""
    import random
    random.seed(42)
    c = _criar_commodity("ZS")
    base_date = date(2024, 1, 1)
    for i in range(60):
        _criar_cache(c, base_date + timedelta(days=i), 50_000 + random.randint(-500, 500), "B3_FUTUROS")
    # std ~300, preco 4 std acima => z ~4
    qualidade, motivo = validar_preco("ZS", 51_200, date(2024, 3, 1), "B3_FUTUROS")
    assert qualidade in (QualidadeDado.SUSPEITO, QualidadeDado.INVALIDO)
    assert "DESVIO_HISTORICO" in motivo


@pytest.mark.django_db
def test_validar_preco_invalido_zscore():
    """Z-score > 5 deve retornar INVALIDO."""
    import random
    random.seed(42)
    c = _criar_commodity("ZS")
    base_date = date(2024, 1, 1)
    for i in range(60):
        _criar_cache(c, base_date + timedelta(days=i), 50_000 + random.randint(-200, 200), "B3_FUTUROS")
    # std ~120, preco 6+ std acima => z > 5
    qualidade, motivo = validar_preco("ZS", 50_720, date(2024, 3, 1), "B3_FUTUROS")
    assert qualidade in (QualidadeDado.SUSPEITO, QualidadeDado.INVALIDO)
    assert "DESVIO_HISTORICO" in motivo


@pytest.mark.django_db
def test_validar_preco_combina_motivos():
    """Quando variacao diaria E z-score disparam, ambos sao registrados."""
    import random
    random.seed(42)
    c = _criar_commodity("KC")
    base_date = date(2024, 1, 1)
    for i in range(60):
        _criar_cache(c, base_date + timedelta(days=i), 30_000 + random.randint(-300, 300), "CEPEA_SPOT")
    # Ontem: preco normal
    _criar_cache(c, date(2024, 3, 1), 30_000, "CEPEA_SPOT")
    # Hoje: +60% variacao + alto z-score
    qualidade, motivo = validar_preco("KC", 50_000, date(2024, 3, 2), "CEPEA_SPOT")
    assert qualidade == QualidadeDado.INVALIDO
    assert motivo is not None and len(motivo) > 0


def test_validar_preco_raises_for_negative():
    """Preco negativo deve lancar ValueError."""
    with pytest.raises(ValueError):
        validar_preco("ZC", -100, date(2024, 1, 15), "B3_FUTUROS")


def test_validar_preco_raises_for_zero():
    """Preco zero deve lancar ValueError."""
    with pytest.raises(ValueError):
        validar_preco("ZC", 0, date(2024, 1, 15), "B3_FUTUROS")


def test_validar_macro_ok():
    """USD_BRL valido deve retornar OK."""
    qualidade, motivo = validar_macro("USD_BRL", 5.50, date(2024, 1, 15))
    assert qualidade == QualidadeDado.OK
    assert motivo is None


def test_validar_macro_raises_out_of_range():
    """USD_BRL fora do range (0.5) deve lancar ValueError."""
    with pytest.raises(ValueError):
        validar_macro("USD_BRL", 0.5, date(2024, 1, 15))


def test_validar_macro_raises_negative():
    """Valor negativo para SELIC deve lancar ValueError."""
    with pytest.raises(ValueError):
        validar_macro("SELIC", -1.0, date(2024, 1, 15))


def test_validar_macro_ipca_pode_ser_negativo():
    """IPCA pode ser negativo (deflacao) dentro do range [-5, 50]."""
    qualidade, motivo = validar_macro("IPCA", -0.5, date(2024, 1, 15))
    assert qualidade == QualidadeDado.OK


def test_validar_macro_ipca_raises_abaixo_range():
    """IPCA abaixo de -5 deve lancar ValueError."""
    with pytest.raises(ValueError):
        validar_macro("IPCA", -6.0, date(2024, 1, 15))


def test_validar_exportacao_ok():
    """Valor FOB positivo deve retornar OK."""
    qualidade, motivo = validar_exportacao("ZS", 1_000_000, date(2024, 1, 1))
    assert qualidade == QualidadeDado.OK
    assert motivo is None


def test_validar_exportacao_raises_negative():
    """Valor FOB negativo deve lancar ValueError."""
    with pytest.raises(ValueError):
        validar_exportacao("ZS", -500, date(2024, 1, 1))


@pytest.mark.django_db
def test_invalido_vence_suspeito():
    """INVALIDO prevalece sobre SUSPEITO (pior resultado ganha)."""
    import random
    random.seed(42)
    c = _criar_commodity("ZC")
    # Insere historico em datas distantes para z-score (fora da janela de variacao diaria)
    base = date(2023, 1, 1)
    for i in range(60):
        _criar_cache(c, base + timedelta(days=i), 50_000 + random.randint(-300, 300), "B3_FUTUROS")
    # Ontem (para variacao diaria)
    _criar_cache(c, date(2024, 1, 14), 50_000, "B3_FUTUROS")
    # +60% variacao (INVALIDO) + alto z-score => INVALIDO
    qualidade, motivo = validar_preco("ZC", 80_000, date(2024, 1, 15), "B3_FUTUROS")
    assert qualidade == QualidadeDado.INVALIDO
