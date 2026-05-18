import json
from django.http import StreamingHttpResponse, HttpResponse
from langchain_core.messages import HumanMessage, AIMessage
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from chatbot.models import Conversation, ConversationMessage
from chatbot.serializers import ConversationSerializer


class ConversationCreateView(generics.CreateAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get(self, request, pk=None):
        if pk is None:
            return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
        try:
            conv = Conversation.objects.filter(user=request.user).get(id=pk)
        except Conversation.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(ConversationSerializer(conv).data)


# ChatStreamView adicionado na Task 5
