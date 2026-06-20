from rest_framework import serializers
from chatbot.models import Conversation, ConversationMessage


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ["id", "created_at"]
        read_only_fields = ["id", "created_at"]


class ProativoMessageSerializer(serializers.ModelSerializer):
    solicitacao = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = ConversationMessage
        fields = ["id", "role", "content", "created_at", "is_proativa", "lida_em", "tipo_alerta", "solicitacao"]
        read_only_fields = fields
