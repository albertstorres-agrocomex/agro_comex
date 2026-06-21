import json
from django.http import StreamingHttpResponse, HttpResponse
from django.utils import timezone
from langchain_core.messages import HumanMessage, AIMessage
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from chatbot.models import Conversation, ConversationMessage
from chatbot.serializers import ConversationSerializer, ProativoMessageSerializer
from chatbot.agent import create_agent_executor
from analises.models import SolicitacaoAnalise
from analises.serializers import SolicitacaoAnaliseReadSerializer


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


def _frame_cards(output):
    if not isinstance(output, str):
        return None
    try:
        dados = json.loads(output)
    except (ValueError, TypeError):
        return None
    if isinstance(dados, dict) and dados.get("tipo") == "cards":
        return f"data: {json.dumps(dados)}\n\n"
    return None


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

        # Contexto por turno: analise_id no corpo sobrepoe o FK da conversa
        analise_id = body.get("analise_id")
        analise_context = None
        if analise_id:
            analise = SolicitacaoAnalise.objects.filter(
                id=analise_id, usuario__user=request.user
            ).select_related(
                "commodity", "tipo_derivativo", "mes_contrato"
            ).first()
            if analise:
                analise_context = _build_analise_context(analise)
        elif conversation.analise_id:
            analise_context = _build_analise_context(conversation.analise)

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
                    elif (
                        event["event"] == "on_tool_end"
                        and event.get("name") == "listar_analises"
                    ):
                        raw_output = event["data"].get("output")
                        tool_output = getattr(raw_output, "content", raw_output)
                        frame = _frame_cards(tool_output)
                        if frame:
                            yield frame
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


def _conversa_proativa_do_usuario(user):
    conversa, _ = Conversation.objects.get_or_create(user=user, is_proativa=True)
    return conversa


class ProativoConversaView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversa = _conversa_proativa_do_usuario(request.user)
        mensagens = conversa.messages.all()
        return Response({
            "conversation_id": str(conversa.id),
            "messages": ProativoMessageSerializer(mensagens, many=True).data,
        })


class ProativoNaoLidasView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        nao_lidas = ConversationMessage.objects.filter(
            conversation__user=request.user, is_proativa=True, lida_em__isnull=True
        )
        solicitacoes = list(
            nao_lidas.exclude(solicitacao__isnull=True)
            .values_list("solicitacao_id", flat=True).distinct()
        )
        return Response({"nao_lidas": nao_lidas.count(), "solicitacoes": solicitacoes})


class ProativoMarcarLidasView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        marcadas = ConversationMessage.objects.filter(
            conversation__user=request.user, is_proativa=True, lida_em__isnull=True
        ).update(lida_em=timezone.now())
        return Response({"marcadas": marcadas}, status=status.HTTP_200_OK)


class ProativoAnalisesView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = SolicitacaoAnalise.objects.filter(usuario__user=request.user).select_related(
            "commodity", "tipo_derivativo"
        ).order_by("-criado_em")
        busca = request.query_params.get("busca") or request.query_params.get("commodity")
        if busca:
            qs = qs.filter(commodity__nome__icontains=busca)
        tipo = request.query_params.get("tipo")
        if tipo:
            qs = qs.filter(tipo_derivativo__nome__icontains=tipo)
        status_q = request.query_params.get("status")
        if status_q:
            qs = qs.filter(status=status_q)
        dados = SolicitacaoAnaliseReadSerializer(qs[:12], many=True).data
        return Response({"analises": dados})


class ProativoAberturaView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
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

        agora = timezone.localtime()
        if hour is None:
            hour = agora.hour
        saudacao = _get_saudacao(hour)
        periodo = saudacao

        conversa = _conversa_proativa_do_usuario(request.user)
        ultima = (
            conversa.messages.filter(tipo_alerta="abertura")
            .order_by("-created_at")
            .first()
        )
        if ultima:
            ult_local = timezone.localtime(ultima.created_at)
            if ult_local.date() == agora.date():
                return Response(
                    {"created": False, "message": ProativoMessageSerializer(ultima).data},
                    status=status.HTTP_200_OK,
                )

        nome = request.user.first_name or request.user.username
        instrucao = (
            f"Cumprimente {nome} com '{saudacao}' pelo primeiro nome. Em seguida, de "
            f"forma breve (maximo 4 frases), resuma o que ha de novo ou pendente nas "
            f"analises dele e sugira qual revisar. Se nao houver nenhuma novidade, apenas "
            f"convide-o a escolher uma analise para conversar. Nao invente dados."
        )
        agent_executor = create_agent_executor(request.user, None)
        result = agent_executor.invoke({"input": instrucao, "chat_history": []})
        texto = result.get("output", "")
        msg = ConversationMessage.objects.create(
            conversation=conversa,
            role="ai",
            content=texto,
            is_proativa=True,
            tipo_alerta="abertura",
        )
        return Response(
            {"created": True, "message": ProativoMessageSerializer(msg).data},
            status=status.HTTP_201_CREATED,
        )
