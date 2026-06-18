import json
from django.http import StreamingHttpResponse, HttpResponse
from langchain_core.messages import HumanMessage, AIMessage
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from chatbot.models import Conversation, ConversationMessage
from chatbot.serializers import ConversationSerializer
from chatbot.agent import create_agent_executor
from analises.models import SolicitacaoAnalise


def _get_saudacao(hour: int) -> str:
    if 5 <= hour < 12:
        return "Bom-dia"
    elif 12 <= hour < 18:
        return "Boa tarde"
    return "Boa noite"


def _build_analise_context(analise) -> dict:
    tipo = analise.tipo_derivativo
    if tipo.requer_barreira and analise.nivel_barreira:
        barreira = f"com barreira em USD {analise.nivel_barreira / 100:.2f}"
    else:
        barreira = "sem barreira"
    return {
        "analise_id": analise.id,
        "commodity": analise.commodity.nome,
        "unidade": analise.commodity.unidade,
        "tipo_derivativo": tipo.nome,
        "posicao": analise.posicao or "nao informada",
        "status": analise.status,
        "preco_exercicio_usd": analise.preco_exercicio / 100,
        "preco_mercado_usd": analise.preco_mercado_atual / 100,
        "quantidade_sacas": analise.quantidade_sacas or 0,
        "barreira": barreira,
        "data_vencimento": (
            analise.mes_contrato.data_vencimento.strftime("%d/%m/%Y")
            if analise.mes_contrato_id
            else "nao informado"
        ),
    }


class ConversationCreateView(generics.GenericAPIView):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if pk is None:
            return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)
        try:
            conv = Conversation.objects.filter(user=request.user).get(id=pk)
        except Conversation.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(ConversationSerializer(conv).data)

    def post(self, request):
        analise_id = request.data.get("analise_id")
        client_hour = request.data.get("client_hour")

        hour = None
        if client_hour is not None:
            try:
                hour = int(client_hour)
                if not 0 <= hour <= 23:
                    raise ValueError
            except (TypeError, ValueError):
                return Response(
                    {"error": "client_hour deve ser um inteiro entre 0 e 23."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        analise = None
        analise_context = None
        if analise_id is not None:
            try:
                analise = SolicitacaoAnalise.objects.select_related(
                    "commodity", "tipo_derivativo", "mes_contrato"
                ).get(id=analise_id, usuario__user=request.user)
            except (SolicitacaoAnalise.DoesNotExist, ValueError, TypeError):
                return Response(
                    {"error": "Analise nao encontrada."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            analise_context = _build_analise_context(analise)

        conversation = Conversation.objects.create(
            user=request.user, analise=analise
        )

        greeting = None
        if analise_context and hour is not None:
            saudacao = _get_saudacao(hour)
            agent_executor = create_agent_executor(request.user, analise_context)
            result = agent_executor.invoke(
                {
                    "input": (
                        f"Cumprimente o usuario com '{saudacao}' pelo primeiro nome e "
                        f"apresente o contexto da analise de forma breve e profissional. "
                        f"Maximo 3 frases."
                    ),
                    "chat_history": [],
                }
            )
            greeting = result.get("output", "")
            ConversationMessage.objects.create(
                conversation=conversation, role="ai", content=greeting
            )

        return Response(
            {
                "id": str(conversation.id),
                "created_at": conversation.created_at.isoformat(),
                "greeting": greeting,
            },
            status=status.HTTP_201_CREATED,
        )


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
            conversation = Conversation.objects.select_related(
                "analise__commodity",
                "analise__tipo_derivativo",
                "analise__mes_contrato",
            ).get(id=conversation_id)
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

        analise_context = (
            _build_analise_context(conversation.analise)
            if conversation.analise_id
            else None
        )
        agent_executor = create_agent_executor(request.user, analise_context)

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
