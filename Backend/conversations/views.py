from rest_framework.views import APIView
from .llm import query_llm
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth.models import User
from .models import ConversationSession, Message, Product  # Import Product model
from .serializers import MessageSerializer
import json

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



        # Gather conversation history BEFORE saving the new message
        history = session.messages.order_by('timestamp')
        messages = [{
            "role": "system",
            "content": (
                "You are a helpful e-commerce assistant. "
                "If you need to search for products, respond with a JSON object like: "
                '{"action": "search_products", "category": "shirts", "brand": "Nike"}'
            )
        }]
        for msg in history:
            messages.append({
                "role": "user" if msg.sender == "user" else "assistant",
                "content": msg.text
            })

        # Add the current user message
        messages.append({
            "role": "user",
            "content": text
        })

        # Query LLM
        ai_response = query_llm(messages)

        # NOW save the user message after getting the AI response
        user_msg = Message.objects.create(
            session=session,
            sender='user',
            text=text
        )

        # Try to parse a JSON command from the LLM
        product_list = ""
        try:
            response_json = json.loads(ai_response)
            if response_json.get("action") == "search_products":
                filters = {}
                if "category" in response_json:
                    filters["category__icontains"] = response_json["category"]
                if "brand" in response_json:
                    filters["brand__icontains"] = response_json["brand"]
                # Add more filters as needed
                products = Product.objects.filter(**filters)[:5]
                if products:
                    product_list = "\n".join([f"{p.name} ({p.brand}) - ${p.retail_price}" for p in products])
                    ai_response = f"Here are some products I found:\n{product_list}"
                else:
                    ai_response = "Sorry, I couldn't find any products matching your criteria."
        except Exception:
            # If not JSON, just use the LLM's text
            pass

        # Save AI response
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