from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from langchain.agents import AgentExecutor
from langchain_core.tools import tool
from chatbot.agent import _build_system_prompt, create_agent_executor
from chatbot.views import _build_analise_context
from commodities.models import Comomodity
from tipos_derivativo.models import TipoDerivativo
from usuario.models import Usuario
from analises.models import SolicitacaoAnalise

User = get_user_model()


@tool
def _fake_db_tool(query: str) -> str:
    """Ferramenta falsa para consultar analises em testes."""
    return ""


@tool
def _fake_rag_tool(query: str) -> str:
    """Ferramenta falsa para busca semantica em testes."""
    return ""


class BuildSystemPromptTest(TestCase):
    def test_sem_contexto_nao_tem_secao_analise(self):
        prompt = _build_system_prompt()
        self.assertNotIn("<contexto_analise>", prompt)

    def test_sem_contexto_mantem_identidade_mauro(self):
        prompt = _build_system_prompt()
        self.assertIn("Mauro", prompt)

    def test_com_contexto_inclui_bloco_analise(self):
        ctx = {
            "analise_id": 42,
            "commodity": "Soja",
            "unidade": "saca",
            "tipo_derivativo": "Call",
            "posicao": "comprador",
            "status": "concluido",
            "preco_exercicio_usd": 46.00,
            "preco_mercado_usd": 48.00,
            "quantidade_sacas": 1000,
            "barreira": "sem barreira",
            "data_vencimento": "14/11/2025",
        }
        prompt = _build_system_prompt(ctx)
        self.assertIn("<contexto_analise>", prompt)
        self.assertIn("Soja", prompt)
        self.assertIn("42", prompt)
        self.assertIn("USD 46.00", prompt)
        self.assertIn("1000 sacas", prompt)

    def test_com_contexto_mantem_identidade_mauro(self):
        ctx = {
            "analise_id": 1, "commodity": "Milho", "unidade": "saca",
            "tipo_derivativo": "Put", "posicao": "vendedor",
            "status": "aguardando", "preco_exercicio_usd": 30.0,
            "preco_mercado_usd": 29.0, "quantidade_sacas": 500,
            "barreira": "sem barreira", "data_vencimento": "15/09/2025",
        }
        prompt = _build_system_prompt(ctx)
        self.assertIn("Mauro", prompt)
        self.assertIn("<contexto_analise>", prompt)

    def test_quantidade_sacas_zero_formatado_corretamente(self):
        ctx = {
            "analise_id": 7, "commodity": "Cafe", "unidade": "saca",
            "tipo_derivativo": "Futuro", "posicao": "nao informada",
            "status": "erro", "preco_exercicio_usd": 0.0,
            "preco_mercado_usd": 0.0, "quantidade_sacas": 0,
            "barreira": "sem barreira", "data_vencimento": "nao informado",
        }
        prompt = _build_system_prompt(ctx)
        self.assertIn("0 sacas", prompt)


class CreateAgentExecutorTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="agent@test.com", password="pass", first_name="Joao"
        )

    @patch("chatbot.agent.ChatOpenAI")
    @patch("chatbot.agent.make_db_tool")
    @patch("chatbot.agent.make_rag_tool")
    def test_retorna_agent_executor_sem_contexto(self, mock_rag, mock_db, mock_llm):
        mock_db.return_value = _fake_db_tool
        mock_rag.return_value = _fake_rag_tool
        executor = create_agent_executor(self.user)
        self.assertIsInstance(executor, AgentExecutor)

    @patch("chatbot.agent.ChatOpenAI")
    @patch("chatbot.agent.make_db_tool")
    @patch("chatbot.agent.make_rag_tool")
    def test_retorna_agent_executor_com_contexto(self, mock_rag, mock_db, mock_llm):
        mock_db.return_value = _fake_db_tool
        mock_rag.return_value = _fake_rag_tool
        ctx = {
            "analise_id": 5, "commodity": "Cafe", "unidade": "saca",
            "tipo_derivativo": "Put", "posicao": "comprador",
            "status": "aprovado", "preco_exercicio_usd": 120.0,
            "preco_mercado_usd": 118.0, "quantidade_sacas": 200,
            "barreira": "sem barreira", "data_vencimento": "10/12/2025",
        }
        executor = create_agent_executor(self.user, ctx)
        self.assertIsInstance(executor, AgentExecutor)

    @patch("chatbot.agent.ChatOpenAI")
    @patch("chatbot.agent.make_db_tool")
    @patch("chatbot.agent.make_rag_tool")
    def test_username_usado_quando_first_name_vazio(self, mock_rag, mock_db, mock_llm):
        mock_db.return_value = _fake_db_tool
        mock_rag.return_value = _fake_rag_tool
        user_sem_nome = User.objects.create_user(username="semnome@test.com", password="pass")
        executor = create_agent_executor(user_sem_nome)
        self.assertIsInstance(executor, AgentExecutor)


class AnaliseContextTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="ana@test.com", password="x")
        self.perfil = Usuario.objects.get_or_create(user=self.user)[0]
        self.soja = Comomodity.objects.create(
            nome="Soja", codigo="ZS", bolsa="B3", unidade="saca", moeda="USD"
        )
        self.tipo = TipoDerivativo.objects.create(
            nome="call", rotulo="Call", requer_barreira=False
        )
        self.sol = SolicitacaoAnalise.objects.create(
            usuario=self.perfil, commodity=self.soja, tipo_derivativo=self.tipo,
            preco_mercado_atual=1300, preco_exercicio=1200,
            quantidade_sacas=1000, posicao="comprador",
            status=SolicitacaoAnalise.Status.CONCLUIDO,
        )

    def test_contexto_inclui_posicao_unidade_e_usd(self):
        ctx = _build_analise_context(self.sol)
        self.assertEqual(ctx["posicao"], "comprador")
        self.assertEqual(ctx["unidade"], "saca")
        self.assertEqual(ctx["preco_exercicio_usd"], 12.0)
        self.assertEqual(ctx["preco_mercado_usd"], 13.0)
        self.assertEqual(ctx["barreira"], "sem barreira")

    def test_template_formata_sem_keyerror(self):
        ctx = _build_analise_context(self.sol)
        prompt = _build_system_prompt(ctx)
        self.assertIn("USD 12.00", prompt)
        self.assertIn("comprador", prompt)
        self.assertNotIn("R$", prompt.split("<contexto_analise>")[1])


class AgentToolsRegistryTest(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="ana@test.com", password="x"
        )
        Usuario.objects.get_or_create(user=self.user)

    def test_novas_tools_registradas(self):
        executor = create_agent_executor(self.user)
        nomes = {t.name for t in executor.tools}
        self.assertIn("consultar_cenarios", nomes)
        self.assertIn("consultar_cambio", nomes)
