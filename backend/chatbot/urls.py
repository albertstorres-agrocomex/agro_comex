from django.urls import path
from chatbot.views import ConversationCreateView

urlpatterns = [
    path("chat/conversations/", ConversationCreateView.as_view(), name="conversation_create"),
    path("chat/conversations/<uuid:pk>/", ConversationCreateView.as_view(), name="conversation_detail"),
]
