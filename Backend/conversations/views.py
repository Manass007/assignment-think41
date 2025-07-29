from rest_framework.views import APIView
from .llm import query_llm, parse_llm_response, extract_fashion_intent
from rest_framework.response import Response
from rest_framework import status, permissions
from django.contrib.auth.models import User
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import datetime, timedelta
from .models import (
    ConversationSession, Message, Product, InventoryItem, 
    Order, OrderItem, EcommerceUser
)
from .serializers import MessageSerializer, ProductSerializer
import json
import random

# Import the additional view classes
from .additional_views import (
    ProductSearchAPIView, TrendingProductsAPIView,
    UserPreferencesAPIView, ConversationHistoryAPIView
)

class ChatAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_user_context(self, django_user):
        """Get user context from ecommerce data"""
        try:
            ecommerce_user = EcommerceUser.objects.filter(email=django_user.email).first()
            if ecommerce_user:
                return {
                    'age': ecommerce_user.age,
                    'gender': ecommerce_user.gender,
                    'location': f"{ecommerce_user.city}, {ecommerce_user.state}",
                    'user_id': ecommerce_user.id
                }
        except Exception as e:
            print(f"Error getting user context: {e}")
        return {}

    def search_products(self, search_params):
        """Advanced product search with multiple filters"""
        filters = Q()
        
        print(f"Search params received: {search_params}")  # Debug log
        
        # Category filter with smart matching
        if 'category' in search_params and search_params['category']:
            category = search_params['category']
            filters &= Q(category__icontains=category)
            print(f"Applied category filter: {category}")
        
        # Brand filter (handle "all" or empty)
        if 'brand' in search_params and search_params['brand']:
            brand = search_params['brand']
            if brand.lower() not in ['all', 'any', '']:
                filters &= Q(brand__icontains=brand)
                print(f"Applied brand filter: {brand}")
        
        # Department filter
        if 'department' in search_params and search_params['department']:
            department = search_params['department']
            filters &= Q(department=department)
            print(f"Applied department filter: {department}")
        
        # Price range filters
        if 'min_price' in search_params and search_params['min_price']:
            min_price = float(search_params['min_price'])
            filters &= Q(retail_price__gte=min_price)
            print(f"Applied min_price filter: {min_price}")
        
        if 'max_price' in search_params and search_params['max_price']:
            max_price = float(search_params['max_price'])
            filters &= Q(retail_price__lte=max_price)
            print(f"Applied max_price filter: {max_price}")
        
        # General query search (search in name, brand, category)
        if 'query' in search_params and search_params['query']:
            query = search_params['query']
            query_filter = (
                Q(name__icontains=query) | 
                Q(brand__icontains=query) | 
                Q(category__icontains=query)
            )
            filters &= query_filter
            print(f"Applied general query filter: {query}")
        
        # Execute search
        print(f"Final filters: {filters}")
        products = Product.objects.filter(filters).order_by('retail_price')
        total_count = products.count()
        print(f"Found {total_count} products")
        
        # Limit results
        limit = search_params.get('limit', 8)
        return products[:limit]

    def get_product_availability(self, product_id):
        """Check product availability in inventory"""
        try:
            available_count = InventoryItem.objects.filter(
                product_id=product_id,
                sold_at__isnull=True
            ).count()
            
            if available_count > 10:
                return "✅ In Stock"
            elif available_count > 0:
                return f"⚠️ Only {available_count} left!"
            else:
                return "❌ Out of Stock"
        except Exception as e:
            print(f"Error checking availability for product {product_id}: {e}")
            return "📦 Check availability"

    def get_trending_products(self, category=None, limit=6):
        """Get trending products based on recent orders"""
        try:
            thirty_days_ago = timezone.now() - timedelta(days=30)
            
            # Base query for trending products
            trending_query = OrderItem.objects.filter(
                created_at__gte=thirty_days_ago
            ).values('product_id').annotate(
                order_count=Count('product_id')
            ).order_by('-order_count')
            
            if category and category.lower() != 'all':
                # Get product IDs for the category first
                category_products = Product.objects.filter(
                    category__icontains=category
                ).values_list('id', flat=True)
                trending_query = trending_query.filter(product_id__in=category_products)
            
            trending_product_ids = [item['product_id'] for item in trending_query[:limit]]
            
            # Get the actual product objects
            products = Product.objects.filter(id__in=trending_product_ids)
            
            # Sort by trending order
            products_dict = {p.id: p for p in products}
            sorted_products = [products_dict[pid] for pid in trending_product_ids if pid in products_dict]
            
            return sorted_products
        except Exception as e:
            print(f"Error getting trending products: {e}")
            # Fallback to random popular products
            return Product.objects.order_by('?')[:limit]

    def get_recommendations(self, style=None, occasion=None, category=None, user_context=None):
        """Generate style-based recommendations"""
        filters = Q()
        
        print(f"Getting recommendations for style: {style}, occasion: {occasion}, category: {category}")
        
        # Style-based filtering
        if style == "casual":
            filters &= Q(category__in=['Tops & Tees', 'Jeans', 'Shorts'])
        elif style == "formal":
            filters &= Q(category__in=['Suits & Sport Coats', 'Blazers & Jackets', 'Dresses'])
        elif style == "athletic" or style == "activewear":
            filters &= Q(category='Active')
        
        # Occasion-based filtering
        if occasion == "work":
            filters &= Q(category__in=['Blazers & Jackets', 'Pants', 'Tops & Tees', 'Dresses'])
        elif occasion == "party":
            filters &= Q(category__in=['Dresses', 'Accessories', 'Suits'])
        elif occasion == "weekend":
            filters &= Q(category__in=['Jeans', 'Tops & Tees', 'Shorts', 'Sweaters'])
        
        # Category specific
        if category:
            filters &= Q(category__icontains=category)
        
        # User context filtering
        if user_context and user_context.get('gender'):
            if user_context['gender'] == 'F':
                filters &= Q(department='Women')
            elif user_context['gender'] == 'M':
                filters &= Q(department='Men')
        
        products = Product.objects.filter(filters).order_by('?')[:8]  # Random selection
        print(f"Found {products.count()} recommendation products")
        return products

    def get_user_order_history(self, user_context, limit=5):
        """Get user's recent order history"""
        if not user_context or 'user_id' not in user_context:
            return []
        
        try:
            recent_orders = OrderItem.objects.filter(
                user_id=user_context['user_id']
            ).order_by('-created_at')[:limit]
            
            order_data = []
            for order_item in recent_orders:
                try:
                    product = Product.objects.get(id=order_item.product_id)
                    order_data.append({
                        'product_name': product.name,
                        'brand': product.brand,
                        'category': product.category,
                        'price': product.retail_price,
                        'status': order_item.status,
                        'order_date': order_item.created_at
                    })
                except Product.DoesNotExist:
                    continue
            
            return order_data
        except Exception as e:
            print(f"Error getting order history: {e}")
            return []

    def format_product_response(self, products, title="Here are some products I found:"):
        """Format products into a nice response"""
        if not products:
            return "Sorry, I couldn't find any products matching your criteria. Try browsing our popular categories like Jeans, Tops & Tees, or Accessories!"
        
        product_lines = [f"\n🛍️ **{title}**\n"]
        
        for i, product in enumerate(products, 1):
            availability = self.get_product_availability(product.id)
            product_lines.append(
                f"{i}. **{product.name}**\n"
                f"   👔 {product.brand} • {product.category}\n"
                f"   💰 ${product.retail_price} • {availability}\n"
            )
        
        return "\n".join(product_lines) + "\n\n💡 Need help with sizes, colors, or styling? Just ask!"

    def handle_direct_searches(self, text, user_context):
        """Handle direct search queries without going through LLM"""
        text_lower = text.lower()
        
        # Direct category searches
        category_queries = {
            'intimates': 'Intimates',
            'trending intimates': 'Intimates',
            'lingerie': 'Intimates',
            'activewear': 'Active',
            'summer essentials': ['Swim', 'Shorts', 'Tops & Tees'],
            'jeans': 'Jeans',
            'tops': 'Tops & Tees',
            'dresses': 'Dresses'
        }
        
        # Check for category matches
        for query, categories in category_queries.items():
            if query in text_lower:
                if isinstance(categories, list):
                    # Multiple categories
                    filters = Q()
                    for cat in categories:
                        filters |= Q(category__icontains=cat)
                    products = Product.objects.filter(filters)[:8]
                else:
                    # Single category
                    products = self.search_products({'category': categories})
                
                if query.startswith('trending'):
                    return self.format_product_response(products, f"🔥 Trending {categories}:")
                else:
                    return self.format_product_response(products, f"Here are great {query}:")
        
        # Brand-specific searches
        if 'columbia' in text_lower and 'activewear' in text_lower:
            products = self.search_products({'brand': 'Columbia', 'category': 'Active'})
            return self.format_product_response(products, "Columbia Activewear:")
        
        # Popular/trending searches
        if any(term in text_lower for term in ['popular', 'trending', 'what\'s hot']):
            products = self.get_trending_products(limit=8)
            return self.format_product_response(products, "🔥 What's Popular Right Now:")
        
        # Location-based or "my area" searches
        if 'my area' in text_lower or 'popular in' in text_lower:
            products = self.get_trending_products(limit=8)
            location = user_context.get('location', 'your area')
            return self.format_product_response(products, f"Popular items in {location}:")
        
        # Style-based searches
        if 'my style' in text_lower or 'for me' in text_lower:
            products = self.get_recommendations(user_context=user_context)
            return self.format_product_response(products, "Based on your style preferences:")
        
        # Age group searches
        if 'my age' in text_lower or 'age group' in text_lower:
            products = self.get_recommendations(user_context=user_context)
            age = user_context.get('age', 'your age group')
            return self.format_product_response(products, f"Trending for age {age}:")
        
        return None

    def post(self, request):
        user = request.user
        text = request.data.get('text', '').strip()
        conversation_id = request.data.get('conversation_id')

        if not text:
            return Response({'error': 'No message provided'}, status=400)

        # Get or create session
        if conversation_id:
            try:
                session = ConversationSession.objects.get(id=conversation_id, user=user)
            except ConversationSession.DoesNotExist:
                return Response({'error': 'Session not found.'}, status=404)
        else:
            session = ConversationSession.objects.create(user=user)

        # Get user context for personalization
        user_context = self.get_user_context(user)
        print(f"User context: {user_context}")

        # Try direct search handling first
        direct_response = self.handle_direct_searches(text, user_context)
        if direct_response:
            # Save messages and return direct response
            user_msg = Message.objects.create(session=session, sender='user', text=text)
            ai_msg = Message.objects.create(session=session, sender='ai', text=direct_response)
            
            return Response({
                'conversation_id': session.id,
                'user_message': MessageSerializer(user_msg).data,
                'ai_message': MessageSerializer(ai_msg).data,
                'user_context': user_context
            }, status=201)

        # Gather conversation history for LLM
        history = session.messages.order_by('timestamp')
        messages = [{"role": "system", "content": "You are STYLISTA, a fashion e-commerce assistant."}]
        
        for msg in history:
            messages.append({
                "role": "user" if msg.sender == "user" else "assistant",
                "content": msg.text
            })

        # Add current user message
        messages.append({"role": "user", "content": text})

        # Query enhanced LLM with user context
        ai_response = query_llm(messages, user_context)
        print(f"LLM Response: {ai_response}")

        # Save user message
        user_msg = Message.objects.create(session=session, sender='user', text=text)

        # Parse LLM response for actions
        has_json, command = parse_llm_response(ai_response)
        print(f"Parsed command: has_json={has_json}, command={command}")
        
        if has_json and command.get("action"):
            action = command.get("action")
            print(f"Processing action: {action}")
            
            try:
                if action == "search_products":
                    products = self.search_products(command)
                    ai_response = self.format_product_response(
                        products, 
                        "Here are the products I found for you:"
                    )
                
                elif action == "recommend_products":
                    products = self.get_recommendations(
                        style=command.get('style'),
                        occasion=command.get('occasion'),
                        category=command.get('category'),
                        user_context=user_context
                    )
                    style_text = command.get('style', 'great')
                    ai_response = self.format_product_response(
                        products, 
                        f"Perfect! Here are some {style_text} recommendations:"
                    )
                
                elif action == "show_trends":
                    trending_products = self.get_trending_products(
                        category=command.get('category'),
                        limit=6
                    )
                    ai_response = self.format_product_response(
                        trending_products, 
                        "🔥 Here's what's trending right now:"
                    )
                
                elif action == "check_inventory":
                    product_id = command.get('product_id')
                    if product_id:
                        availability = self.get_product_availability(product_id)
                        try:
                            product = Product.objects.get(id=product_id)
                            ai_response = f"**{product.name}** by {product.brand}\n💰 ${product.retail_price}\n📦 Status: {availability}"
                        except Product.DoesNotExist:
                            ai_response = "Sorry, I couldn't find that specific product. Can you provide more details?"
                    else:
                        ai_response = "I need a specific product to check inventory. Can you tell me which item you're interested in?"
                
                elif action == "order_history":
                    order_history = self.get_user_order_history(user_context)
                    if order_history:
                        history_lines = ["📋 **Your Recent Orders:**\n"]
                        for order in order_history:
                            history_lines.append(
                                f"• {order['product_name']} ({order['brand']})\n"
                                f"  💰 ${order['price']} • Status: {order['status']}\n"
                            )
                        ai_response = "\n".join(history_lines)
                    else:
                        ai_response = "I couldn't find your order history. Make sure you're logged in with the same email you used for purchases!"
                
                else:
                    print(f"Unknown action: {action}")
                    # Fallback to intent extraction
                    intent = extract_fashion_intent(text)
                    if intent:
                        products = self.search_products(intent)
                        ai_response = self.format_product_response(products)
            
            except Exception as e:
                print(f"Error processing action {action}: {e}")
                # Fallback to intent extraction
                intent = extract_fashion_intent(text)
                if intent:
                    products = self.search_products(intent)
                    ai_response = self.format_product_response(products)

        # If no JSON command found, try basic intent extraction
        elif not has_json:
            print("No JSON command found, trying intent extraction...")
            intent = extract_fashion_intent(text)
            print(f"Extracted intent: {intent}")
            if intent:
                products = self.search_products(intent)
                if products:
                    ai_response = self.format_product_response(products)
                else:
                    # If no products found, provide suggestions
                    ai_response = "Sorry, I couldn't find any products matching your criteria. Try browsing our popular categories like Jeans, Tops & Tees, or Accessories!"

        # Save AI response
        ai_msg = Message.objects.create(session=session, sender='ai', text=ai_response)

        return Response({
            'conversation_id': session.id,
            'user_message': MessageSerializer(user_msg).data,
            'ai_message': MessageSerializer(ai_msg).data,
            'user_context': user_context
        }, status=201)