from rest_framework import serializers
from chatbot.models import Conversation


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ["id", "created_at"]
        read_only_fields = ["id", "created_at"]
