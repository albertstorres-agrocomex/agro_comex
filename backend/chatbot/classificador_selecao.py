# backend/chatbot/classificador_selecao.py
"""Classificador deterministico de intencao de selecao de analise.

O agente do Mauro decide de forma probabilistica se chama a tool listar_analises,
o que faz os cards de selecao aparecerem de forma inconsistente. Este modulo isola
essa decisao numa chamada LLM curta e dedicada, com saida estruturada: dado o texto
do usuario, responde se ele quer escolher/trocar de analise e quais filtros aplicar.
A view usa esse resultado para emitir SOMENTE os cards, sem texto."""

from django.conf import settings
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from pydantic import BaseModel, Field


class SelecaoAnalise(BaseModel):
    """Resultado da classificacao da mensagem do usuario."""

    quer_selecionar: bool = Field(
        description=(
            "True somente quando o usuario quer ESCOLHER, LISTAR, VER ou TROCAR "
            "qual analise vai discutir (ex: 'quero falar de uma analise de put', "
            "'me mostra minhas analises', 'quero trocar de analise', 'aquela de soja'). "
            "False para perguntas sobre a analise ja aberta ('essa analise vale a pena?', "
            "'qual cenario e melhor?'), saudacoes, ou duvidas gerais de hedge/mercado."
        )
    )
    commodity: str = Field(
        default="",
        description=(
            "Commodity citada como filtro, em minusculas e singular "
            "(soja, milho, cafe, acucar, boi, algodao, trigo). Vazio se nao citada."
        ),
    )
    tipo: str = Field(
        default="",
        description="Tipo de derivativo citado como filtro: 'call' ou 'put'. Vazio se nao citado.",
    )
    status: str = Field(
        default="",
        description="Status citado como filtro (ex: 'concluido', 'pendente'). Vazio se nao citado.",
    )


_SYSTEM = (
    "Voce e um classificador de intencao para o chat do Mauro, especialista em hedge "
    "agricola. Sua unica funcao e decidir se a mensagem do usuario pede para ESCOLHER, "
    "LISTAR ou TROCAR qual analise sera discutida, e extrair filtros (commodity, tipo, "
    "status) quando citados. Nao responda a pergunta, apenas classifique.\n"
    "Contexto da conversa: {contexto}\n"
    "Se o usuario se referir a analise ja aberta ('essa', 'minha analise', 'a analise'), "
    "isso NAO e selecao (quer_selecionar=false). Apenas pedidos explicitos de ver/listar/"
    "escolher/trocar de analise, ou de falar de OUTRA analise, sao selecao."
)


def _build_classificador(llm=None):
    llm = llm or ChatOpenAI(
        model="gpt-4o-mini",
        api_key=settings.OPENAI_API_KEY,
        temperature=0,
    )
    prompt = ChatPromptTemplate.from_messages(
        [("system", _SYSTEM), ("human", "{mensagem}")]
    )
    return prompt | llm.with_structured_output(SelecaoAnalise)


async def classificar_selecao(
    mensagem: str, tem_analise_em_contexto: bool = False, classificador=None
) -> SelecaoAnalise:
    """Classifica a intencao de selecao da mensagem. Em caso de falha do LLM,
    retorna quer_selecionar=False para nao bloquear o fluxo normal do agente."""
    classificador = classificador or _build_classificador()
    contexto = (
        "o usuario ja esta com uma analise aberta nesta conversa."
        if tem_analise_em_contexto
        else "nenhuma analise esta aberta no momento."
    )
    try:
        return await classificador.ainvoke({"contexto": contexto, "mensagem": mensagem})
    except Exception:
        return SelecaoAnalise(quer_selecionar=False)
