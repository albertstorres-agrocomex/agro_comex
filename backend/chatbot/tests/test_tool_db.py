from django.test import TestCase
from django.contrib.auth import get_user_model
from usuario.models import Usuario
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from analises.models import SolicitacaoAnalise
from chatbot.tool_db import make_db_tool

User = get_user_model()


class DbToolTest(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username="a@test.com", password="pass")
        self.user_b = User.objects.create_user(username="b@test.com", password="pass")
        self.perfil_a = Usuario.objects.get_or_create(user=self.user_a)[0]
        self.perfil_b = Usuario.objects.get_or_create(user=self.user_b)[0]
        self.commodity = Comomodity.objects.create(
            nome="Soja", codigo="ZS", bolsa="CME", unidade="bushel", moeda="USD"
        )
        self.tipo = TipoDerivativo.objects.create(
            nome="Call", rotulo="CALL", requer_posicao=True, requer_barreira=False
        )
        SolicitacaoAnalise.objects.create(
            usuario=self.perfil_a, commodity=self.commodity, tipo_derivativo=self.tipo,
            preco_mercado_atual=4500, preco_exercicio=4600, status="concluido", posicao="comprador",
        )
        SolicitacaoAnalise.objects.create(
            usuario=self.perfil_b, commodity=self.commodity, tipo_derivativo=self.tipo,
            preco_mercado_atual=4500, preco_exercicio=4700, status="aguardando", posicao="vendedor",
        )

    def test_retorna_apenas_analises_do_usuario(self):
        tool = make_db_tool(self.user_a)
        resultado = tool.invoke({"query": "todas as analises"})
        self.assertIn("Soja", resultado)
        self.assertNotIn("vendedor", resultado)

    def test_nao_vaza_dados_de_outro_usuario(self):
        tool = make_db_tool(self.user_a)
        resultado = tool.invoke({"query": "todas as analises"})
        analise_b = SolicitacaoAnalise.objects.get(usuario=self.perfil_b)
        self.assertNotIn(f"[ID {analise_b.id}]", resultado)

    def test_filtra_por_status(self):
        tool = make_db_tool(self.user_a)
        resultado = tool.invoke({"query": "analises com status concluido"})
        self.assertIn("concluido", resultado)

    def test_retorna_mensagem_quando_sem_analises(self):
        user_vazio = User.objects.create_user(username="vazio@test.com", password="pass")
        Usuario.objects.get_or_create(user=user_vazio)
        tool = make_db_tool(user_vazio)
        resultado = tool.invoke({"query": "todas as analises"})
        self.assertIn("Nenhuma", resultado)
