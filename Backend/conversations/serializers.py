from rest_framework import serializers
from .models import ConversationSession, Message

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'session', 'sender', 'text', 'timestamp']

class ConversationSessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    class Meta:
        model = ConversationSession
        fields = ['id', 'user', 'started_at', 'title', 'messages']