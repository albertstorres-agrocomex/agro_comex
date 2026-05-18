from django.contrib import admin
from chatbot.models import Conversation, ConversationMessage


class MessageInline(admin.TabularInline):
    model = ConversationMessage
    extra = 0
    readonly_fields = ["role", "content", "created_at"]


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "created_at"]
    inlines = [MessageInline]
