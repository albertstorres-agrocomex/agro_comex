import uuid
from django.db import models
from django.conf import settings
from pgvector.django import VectorField


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
