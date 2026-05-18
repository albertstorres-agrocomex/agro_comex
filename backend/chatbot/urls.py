from django.urls import path
from chatbot.views import ConversationCreateView, ChatStreamView

urlpatterns = [
    path("chat/conversations/", ConversationCreateView.as_view(), name="conversation_create"),
    path("chat/conversations/<uuid:pk>/", ConversationCreateView.as_view(), name="conversation_detail"),
    path("chat/stream/", ChatStreamView.as_view(), name="chat_stream"),
]
