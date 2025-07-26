from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth.models import User
from .models import ConversationSession, Message
from .serializers import MessageSerializer

class ChatAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        text = request.data.get('text')
        conversation_id = request.data.get('conversation_id')

        # Get or create session
        if conversation_id:
            try:
                session = ConversationSession.objects.get(id=conversation_id, user=user)
            except ConversationSession.DoesNotExist:
                return Response({'error': 'Session not found.'}, status=404)
        else:
            session = ConversationSession.objects.create(user=user)

        # Save user message
        user_msg = Message.objects.create(
            session=session,
            sender='user',
            text=text
        )

        # Generate AI response (placeholder)
        ai_response = f"Echo: {text}"
        ai_msg = Message.objects.create(
            session=session,
            sender='ai',
            text=ai_response
        )

        return Response({
            'conversation_id': session.id,
            'user_message': MessageSerializer(user_msg).data,
            'ai_message': MessageSerializer(ai_msg).data
        }, status=201)