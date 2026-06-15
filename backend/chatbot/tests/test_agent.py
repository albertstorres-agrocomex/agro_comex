from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch
from langchain.agents import AgentExecutor
from langchain_core.tools import tool
from chatbot.agent import _build_system_prompt, create_agent_executor

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
            "tipo_derivativo": "Call",
            "status": "concluido",
            "preco_exercicio_reais": 46.00,
            "quantidade_sacas": 1000,
            "data_vencimento": "14/11/2025",
        }
        prompt = _build_system_prompt(ctx)
        self.assertIn("<contexto_analise>", prompt)
        self.assertIn("Soja", prompt)
        self.assertIn("42", prompt)
        self.assertIn("R$ 46.00", prompt)
        self.assertIn("1000 sacas", prompt)

    def test_com_contexto_mantem_identidade_mauro(self):
        ctx = {
            "analise_id": 1, "commodity": "Milho", "tipo_derivativo": "Put",
            "status": "aguardando", "preco_exercicio_reais": 30.0,
            "quantidade_sacas": 500, "data_vencimento": "15/09/2025",
        }
        prompt = _build_system_prompt(ctx)
        self.assertIn("Mauro", prompt)
        self.assertIn("<contexto_analise>", prompt)

    def test_quantidade_sacas_zero_formatado_corretamente(self):
        ctx = {
            "analise_id": 7, "commodity": "Cafe", "tipo_derivativo": "Futuro",
            "status": "erro", "preco_exercicio_reais": 0.0,
            "quantidade_sacas": 0, "data_vencimento": "nao informado",
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
            "analise_id": 5, "commodity": "Cafe", "tipo_derivativo": "Put",
            "status": "aprovado", "preco_exercicio_reais": 120.0,
            "quantidade_sacas": 200, "data_vencimento": "10/12/2025",
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
