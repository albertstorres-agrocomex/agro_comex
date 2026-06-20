import uuid
from django.db import models
from django.conf import settings
from pgvector.django import VectorField

TIPO_ALERTA_CHOICES = [
    ("cenario_nao_escolhido", "Cenario nao escolhido"),
    ("cotacao_cruzou", "Cotacao cruzou nivel"),
    ("melhor_momento", "Melhor momento"),
]


class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="conversations",
    )
    analise = models.ForeignKey(
        "analises.SolicitacaoAnalise",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="conversations",
    )
    is_proativa = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chatbot_conversations"
        ordering = ["-created_at"]


class ConversationMessage(models.Model):
    ROLE_CHOICES = [("human", "Human"), ("ai", "AI")]

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    is_proativa = models.BooleanField(default=False)
    lida_em = models.DateTimeField(null=True, blank=True)
    solicitacao = models.ForeignKey(
        "analises.SolicitacaoAnalise", on_delete=models.SET_NULL,
        null=True, blank=True, related_name="mensagens_proativas",
    )
    tipo_alerta = models.CharField(max_length=30, choices=TIPO_ALERTA_CHOICES, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chatbot_messages"
        ordering = ["created_at"]


class AnaliseEmbedding(models.Model):
    analise = models.OneToOneField(
        "analises.SolicitacaoAnalise",
        on_delete=models.CASCADE,
        related_name="embedding",
    )
    content = models.TextField()
    content_hash = models.CharField(max_length=64)
    embedding = VectorField(dimensions=1536)
    embedded_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chatbot_analise_embeddings"


class EstadoAlertaAnalise(models.Model):
    solicitacao = models.ForeignKey(
        "analises.SolicitacaoAnalise", on_delete=models.CASCADE, related_name="estados_alerta",
    )
    tipo_alerta = models.CharField(max_length=30, choices=TIPO_ALERTA_CHOICES)
    ultimo_estado = models.CharField(max_length=30)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chatbot_estado_alerta_analise"
        unique_together = ("solicitacao", "tipo_alerta")
