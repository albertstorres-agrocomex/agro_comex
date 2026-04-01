import datetime
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


class TestEscolherCenarioView(TestCase):
    def setUp(self):
        from analises.models import (
            SolicitacaoAnalise, ResultadoAnalise, CenarioAnalise,
        )
        from commodities.models import Comomodity
        from tipos_derivativo.models import TipoDerivativo
        from meses_contrato_futuro.models import MesContratoFurturo
        from usuario.models import Usuario
        from django.contrib.auth.models import User

        self.auth_user = User.objects.create_user(username="test_escolher", password="test")
        outro_user = User.objects.create_user(username="outro_escolher", password="outro")

        self.perfil = Usuario.objects.create(first_name="Test", user=self.auth_user)
        self.outro_perfil = Usuario.objects.create(first_name="Outro", user=outro_user)

        commodity = Comomodity.objects.create(nome="Soja", codigo="SOJA_ESC", moeda="USD", unidade="sc")
        tipo = TipoDerivativo.objects.create(nome="put", rotulo="PutEsc", requer_posicao=True, requer_barreira=False)
        mes = MesContratoFurturo.objects.create(
            commodity=commodity, codigo_mes="K", ano=2026, ativo=True,
            data_vencimento=datetime.date(2026, 5, 14),
            ticket_completo="ZCK26_ESC",
        )

        self.sol = SolicitacaoAnalise.objects.create(
            usuario=self.perfil, commodity=commodity, tipo_derivativo=tipo,
            mes_contrato=mes, preco_mercado_atual=13000, preco_exercicio=13000,
            quantidade_sacas=1000, posicao="vendedor",
        )
        self.resultado = ResultadoAnalise.objects.create(
            solicitacao=self.sol, premio_calculado=350, valor_total_contrato=350000,
        )
        self.cenario_conservador = CenarioAnalise.objects.create(
            resultado=self.resultado, nome="conservador", fator="0.90",
            preco_exercicio_centavos=11700, premio_centavos=280,
            valor_total_centavos=280000, ponto_equilibrio_centavos=11420,
            nivel_risco="baixo", e_recomendado=False,
        )
        self.cenario_moderado = CenarioAnalise.objects.create(
            resultado=self.resultado, nome="moderado", fator="0.99",
            preco_exercicio_centavos=12870, premio_centavos=310,
            valor_total_centavos=310000, ponto_equilibrio_centavos=12560,
            nivel_risco="medio", e_recomendado=True,
        )
        self.cenario_agressivo = CenarioAnalise.objects.create(
            resultado=self.resultado, nome="agressivo", fator="1.07",
            preco_exercicio_centavos=13910, premio_centavos=290,
            valor_total_centavos=290000, ponto_equilibrio_centavos=13620,
            nivel_risco="alto", e_recomendado=False,
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.auth_user)

    def _url(self, pk):
        return reverse("cenario_escolher", kwargs={"pk": pk})

    def test_patch_marca_cenario_como_escolhido(self):
        resp = self.client.patch(self._url(self.cenario_moderado.pk), {"escolhido_pelo_usuario": True}, format="json")
        assert resp.status_code == 200
        self.cenario_moderado.refresh_from_db()
        assert self.cenario_moderado.escolhido_pelo_usuario is True
        assert self.cenario_moderado.escolhido_em is not None

    def test_patch_desmarca_outros_cenarios_do_mesmo_resultado(self):
        self.client.patch(self._url(self.cenario_conservador.pk), {"escolhido_pelo_usuario": True}, format="json")
        self.client.patch(self._url(self.cenario_moderado.pk), {"escolhido_pelo_usuario": True}, format="json")
        self.cenario_conservador.refresh_from_db()
        assert self.cenario_conservador.escolhido_pelo_usuario is False
        assert self.cenario_conservador.escolhido_em is None

    def test_patch_retorna_dados_do_cenario_atualizado(self):
        resp = self.client.patch(self._url(self.cenario_agressivo.pk), {"escolhido_pelo_usuario": True}, format="json")
        assert resp.status_code == 200
        assert resp.data["nome"] == "agressivo"
        assert resp.data["escolhido_pelo_usuario"] is True

    def test_patch_sem_autenticacao_retorna_401(self):
        client_anonimo = APIClient()
        resp = client_anonimo.patch(self._url(self.cenario_moderado.pk), {"escolhido_pelo_usuario": True}, format="json")
        assert resp.status_code == 401

    def test_patch_cenario_de_outro_usuario_retorna_403(self):
        from django.contrib.auth.models import User
        outro_auth = User.objects.get(username="outro_escolher")
        client_outro = APIClient()
        client_outro.force_authenticate(user=outro_auth)
        resp = client_outro.patch(self._url(self.cenario_moderado.pk), {"escolhido_pelo_usuario": True}, format="json")
        assert resp.status_code == 403

    def test_patch_cenario_inexistente_retorna_404(self):
        resp = self.client.patch(self._url(99999), {"escolhido_pelo_usuario": True}, format="json")
        assert resp.status_code == 404

    def test_patch_sem_campo_obrigatorio_retorna_400(self):
        resp = self.client.patch(self._url(self.cenario_moderado.pk), {}, format="json")
        assert resp.status_code == 400
