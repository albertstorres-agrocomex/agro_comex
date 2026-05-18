from celery import shared_task
from django.conf import settings
from openai import OpenAI
from analises.models import SolicitacaoAnalise
from chatbot.models import AnaliseEmbedding
from chatbot.embedding import build_embedding_content, compute_content_hash

openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)


@shared_task
def reembedar_analise(analise_id: int) -> None:
    analise = SolicitacaoAnalise.objects.select_related(
        "commodity", "tipo_derivativo", "mes_contrato"
    ).get(id=analise_id)

    content = build_embedding_content(analise)
    novo_hash = compute_content_hash(content)

    try:
        embedding_obj = AnaliseEmbedding.objects.get(analise=analise)
        if embedding_obj.content_hash == novo_hash:
            return
    except AnaliseEmbedding.DoesNotExist:
        embedding_obj = AnaliseEmbedding(analise=analise)

    vector = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=content,
    ).data[0].embedding

    embedding_obj.content = content
    embedding_obj.content_hash = novo_hash
    embedding_obj.embedding = vector
    embedding_obj.save()
