from django.urls import path
from chatbot.views import (
    ConversationCreateView,
    ChatStreamView,
    ProativoConversaView,
    ProativoNaoLidasView,
    ProativoMarcarLidasView,
    ProativoAnalisesView,
)

urlpatterns = [
    path("chat/conversations/", ConversationCreateView.as_view(), name="conversation_create"),
    path("chat/conversations/<uuid:pk>/", ConversationCreateView.as_view(), name="conversation_detail"),
    path("chat/stream/", ChatStreamView.as_view(), name="chat_stream"),
    path("chat/proativo/", ProativoConversaView.as_view(), name="proativo_conversa"),
    path("chat/proativo/nao-lidas/", ProativoNaoLidasView.as_view(), name="proativo_nao_lidas"),
    path("chat/proativo/marcar-lidas/", ProativoMarcarLidasView.as_view(), name="proativo_marcar_lidas"),
    path("chat/proativo/analises/", ProativoAnalisesView.as_view(), name="proativo_analises"),
]
