from django.conf import settings
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from chatbot.tool_db import make_db_tool
from chatbot.tool_rag import make_rag_tool


def create_agent_executor(django_user) -> AgentExecutor:
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        api_key=settings.OPENAI_API_KEY,
        streaming=True,
    )
    tools = [make_db_tool(django_user), make_rag_tool(django_user)]

    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "Voce e um assistente especializado em analise de derivativos agricolas do AgroComex. "
            "Responda sempre em portugues brasileiro. "
            "Use consultar_analises para perguntas quantitativas com filtros exatos (status, commodity, data, valor). "
            "Use busca_semantica para perguntas qualitativas e abertas sobre o conteudo das analises. "
            "Para perguntas gerais sobre derivativos ou mercado agricola, responda diretamente. "
            "Seja conciso e direto.",
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=False)
