# backend/chatbot/tests/test_tool_listagem.py
import json
from django.test import TestCase
from django.contrib.auth import get_user_model
from usuario.models import Usuario
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from analises.models import SolicitacaoAnalise
from chatbot.tool_listagem import make_listagem_tool, listar_analises_payload

User = get_user_model()


class ToolListagemTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tl@t.com", password="p")
        self.perfil = Usuario.objects.get_or_create(user=self.user)[0]
        self.soja = Comomodity.objects.create(nome="Soja", codigo="ZS", bolsa="CME", unidade="bushel", moeda="USD")
        self.call = TipoDerivativo.objects.create(nome="Call", rotulo="CALL")
        SolicitacaoAnalise.objects.create(
            usuario=self.perfil, commodity=self.soja, tipo_derivativo=self.call,
            preco_mercado_atual=4500, preco_exercicio=4600, status="concluido", posicao="comprador",
        )

    def test_retorna_json_cards_escopado(self):
        tool = make_listagem_tool(self.user)
        saida = tool.invoke({"commodity": "soja"})
        dados = json.loads(saida)
        self.assertEqual(dados["tipo"], "cards")
        self.assertEqual(len(dados["payload"]), 1)
        self.assertEqual(dados["payload"][0]["commodity"], "Soja")

    def test_usuario_sem_perfil(self):
        outro = User.objects.create_user(username="np@t.com", password="p")
        tool = make_listagem_tool(outro)
        saida = tool.invoke({})
        self.assertEqual(json.loads(saida)["payload"], [])


class ListarAnalisesPayloadTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="pl@t.com", password="p")
        self.perfil = Usuario.objects.get_or_create(user=self.user)[0]
        self.soja = Comomodity.objects.create(nome="Soja", codigo="ZS", bolsa="CME", unidade="bushel", moeda="USD")
        self.milho = Comomodity.objects.create(nome="Milho", codigo="ZC", bolsa="CME", unidade="bushel", moeda="USD")
        self.call = TipoDerivativo.objects.create(nome="Call", rotulo="CALL")
        self.put = TipoDerivativo.objects.create(nome="Put", rotulo="PUT")
        SolicitacaoAnalise.objects.create(
            usuario=self.perfil, commodity=self.soja, tipo_derivativo=self.put,
            preco_mercado_atual=4500, preco_exercicio=4600, status="concluido", posicao="comprador",
        )
        SolicitacaoAnalise.objects.create(
            usuario=self.perfil, commodity=self.milho, tipo_derivativo=self.call,
            preco_mercado_atual=400, preco_exercicio=420, status="pendente", posicao="comprador",
        )

    def test_filtra_por_tipo(self):
        dados = listar_analises_payload(self.user, tipo="put")
        self.assertEqual(dados["tipo"], "cards")
        self.assertEqual(len(dados["payload"]), 1)
        self.assertEqual(dados["payload"][0]["tipo"], "Put")
        self.assertEqual(dados["payload"][0]["commodity"], "Soja")

    def test_filtra_por_commodity(self):
        dados = listar_analises_payload(self.user, commodity="milho")
        self.assertEqual(len(dados["payload"]), 1)
        self.assertEqual(dados["payload"][0]["commodity"], "Milho")

    def test_sem_filtro_retorna_todas_do_usuario(self):
        dados = listar_analises_payload(self.user)
        self.assertEqual(len(dados["payload"]), 2)

    def test_escopo_por_usuario(self):
        outro = User.objects.create_user(username="outro@t.com", password="p")
        Usuario.objects.get_or_create(user=outro)
        dados = listar_analises_payload(outro)
        self.assertEqual(dados["payload"], [])
