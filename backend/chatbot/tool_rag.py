from django.conf import settings
from langchain.tools import tool
from openai import OpenAI
from pgvector.django import CosineDistance
from chatbot.models import AnaliseEmbedding
from usuario.models import Usuario

openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)


def make_rag_tool(django_user):
    """Retorna LangChain tool de busca semantica vinculada ao usuario."""

    @tool
    def busca_semantica(query: str) -> str:
        """
        Busca analises semanticamente similares a uma descricao qualitativa.

        Use esta ferramenta para perguntas abertas como:
        - "quais analises discutem hedge de soja com puts?"
        - "operacoes onde o mercado estava em alta"
        - "analises defensivas de cafe arabica"

        Para filtros exatos (status, data, valor), use consultar_analises.
        """
        try:
            perfil = Usuario.objects.get(user=django_user)
        except Usuario.DoesNotExist:
            return "Usuario sem perfil cadastrado."

        query_vector = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=query,
        ).data[0].embedding

        resultados = list(
            AnaliseEmbedding.objects
            .filter(analise__usuario=perfil)
            .order_by(CosineDistance("embedding", query_vector))
            .select_related("analise__commodity", "analise__tipo_derivativo")
            [:5]
        )

        if not resultados:
            return "Nenhuma analise encontrada na busca semantica."

        linhas = ["Analises semanticamente relevantes:\n"]
        for emb in resultados:
            a = emb.analise
            linhas.append(
                f"- [ID {a.id}] {a.tipo_derivativo.nome} de {a.commodity.nome} | "
                f"Status: {a.status} | Resumo: {emb.content[:100]}..."
            )

        return "\n".join(linhas)

    return busca_semantica
