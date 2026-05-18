import json
from django.http import StreamingHttpResponse, HttpResponse
from langchain_core.messages import HumanMessage, AIMessage
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from chatbot.models import Conversation, ConversationMessage
from chatbot.serializers import ConversationSerializer
from chatbot.agent import create_agent_executor


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


class ChatStreamView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            body = json.loads(request.body)
        except (json.JSONDecodeError, ValueError):
            return HttpResponse(status=400)

        conversation_id = body.get("conversation_id")
        message = body.get("message", "").strip()

        if not message:
            return HttpResponse(status=400)

        # OWASP A01: valida que a conversa pertence ao usuario autenticado
        try:
            conversation = Conversation.objects.get(id=conversation_id)
        except Exception:
            return HttpResponse(status=404)

        if conversation.user_id != request.user.id:
            return HttpResponse(status=403)

        history = []
        for msg in ConversationMessage.objects.filter(
            conversation=conversation
        ).order_by("created_at"):
            if msg.role == "human":
                history.append(HumanMessage(content=msg.content))
            else:
                history.append(AIMessage(content=msg.content))

        agent_executor = create_agent_executor(request.user)

        async def event_stream():
            full_response = ""
            try:
                async for event in agent_executor.astream_events(
                    {"input": message, "chat_history": history},
                    version="v2",
                ):
                    if event["event"] == "on_chat_model_stream":
                        chunk = event["data"]["chunk"]
                        content = chunk.content if hasattr(chunk, "content") else ""
                        if content:
                            full_response += content
                            yield f"data: {json.dumps({'content': content})}\n\n"
            finally:
                await ConversationMessage.objects.acreate(
                    conversation=conversation, role="human", content=message
                )
                await ConversationMessage.objects.acreate(
                    conversation=conversation,
                    role="ai",
                    content=full_response or "(sem resposta)",
                )
                yield "data: [DONE]\n\n"

        return StreamingHttpResponse(
            streaming_content=event_stream(),
            content_type="text/event-stream",
            headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
        )
