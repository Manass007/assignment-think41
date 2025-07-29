from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Q, Count, Avg
from django.utils import timezone
from datetime import timedelta
from .models import Product, InventoryItem, OrderItem, ConversationSession
from .serializers import (
    ProductSerializer, ProductSearchResponseSerializer,
    TrendingProductsSerializer, ConversationSessionSerializer
)

class ProductSearchAPIView(APIView):
    """Dedicated product search endpoint with advanced filtering"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """GET method for product search with query parameters"""
        # Extract search parameters
        category = request.query_params.get('category', '')
        brand = request.query_params.get('brand', '')
        department = request.query_params.get('department', '')
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        query = request.query_params.get('q', '')  # General search query
        limit = int(request.query_params.get('limit', 20))
        
        # Build filters
        filters = Q()
        
        if category:
            filters &= Q(category__icontains=category)
        if brand and brand.lower() != 'all':
            filters &= Q(brand__icontains=brand)
        if department:
            filters &= Q(department=department)
        if min_price:
            filters &= Q(retail_price__gte=float(min_price))
        if max_price:
            filters &= Q(retail_price__lte=float(max_price))
        if query:
            filters &= (
                Q(name__icontains=query) | 
                Q(brand__icontains=query) | 
                Q(category__icontains=query)
            )
        
        # Execute search
        products = Product.objects.filter(filters).order_by('retail_price')
        total_count = products.count()
        products = products[:limit]
        
        # Generate suggestions if no results
        suggestions = []
        if total_count == 0:
            # Suggest popular categories
            popular_categories = Product.objects.values('category').annotate(
                count=Count('category')
            ).order_by('-count')[:5]
            suggestions = [cat['category'] for cat in popular_categories]
        
        return Response({
            'products': ProductSerializer(products, many=True).data,
            'total_count': total_count,
            'search_params': {
                'category': category,
                'brand': brand,
                'department': department,
                'min_price': min_price,
                'max_price': max_price,
                'query': query
            },
            'suggestions': suggestions
        })

    def post(self, request):
        """POST method for complex search with JSON body"""
        search_data = request.data
        
        filters = Q()
        
        # Handle complex filters from JSON
        if 'categories' in search_data:
            category_filter = Q()
            for cat in search_data['categories']:
                category_filter |= Q(category__icontains=cat)
            filters &= category_filter
            
        if 'brands' in search_data:
            brand_filter = Q()
            for brand in search_data['brands']:
                brand_filter |= Q(brand__icontains=brand)
            filters &= brand_filter
            
        if 'price_range' in search_data:
            price_range = search_data['price_range']
            if 'min' in price_range:
                filters &= Q(retail_price__gte=price_range['min'])
            if 'max' in price_range:
                filters &= Q(retail_price__lte=price_range['max'])
        
        if 'department' in search_data:
            filters &= Q(department=search_data['department'])
            
        # Execute search
        products = Product.objects.filter(filters)
        
        # Apply sorting
        sort_by = search_data.get('sort_by', 'price')
        if sort_by == 'price_asc':
            products = products.order_by('retail_price')
        elif sort_by == 'price_desc':
            products = products.order_by('-retail_price')
        elif sort_by == 'name':
            products = products.order_by('name')
        elif sort_by == 'brand':
            products = products.order_by('brand')
        
        limit = search_data.get('limit', 20)
        total_count = products.count()
        products = products[:limit]
        
        return Response({
            'products': ProductSerializer(products, many=True).data,
            'total_count': total_count,
            'search_params': search_data,
            'applied_filters': str(filters)
        })

class TrendingProductsAPIView(APIView):
    """Get trending products based on recent order data"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        category = request.query_params.get('category')
        timeframe = request.query_params.get('timeframe', '30')  # days
        limit = int(request.query_params.get('limit', 10))
        
        # Calculate date range
        days_ago = timezone.now() - timedelta(days=int(timeframe))
        
        # Get trending product IDs
        trending_query = OrderItem.objects.filter(
            created_at__gte=days_ago
        ).values('product_id').annotate(
            order_count=Count('product_id')
        ).order_by('-order_count')
        
        if category:
            # Filter by category
            category_products = Product.objects.filter(
                category__icontains=category
            ).values_list('id', flat=True)
            trending_query = trending_query.filter(product_id__in=category_products)
        
        trending_product_ids = [
            item['product_id'] for item in trending_query[:limit]
        ]
        
        # Get product details
        products = Product.objects.filter(id__in=trending_product_ids)
        
        # Sort by trending order
        products_dict = {p.id: p for p in products}
        sorted_products = [
            products_dict[pid] for pid in trending_product_ids 
            if pid in products_dict
        ]
        
        return Response({
            'trending_products': ProductSerializer(sorted_products, many=True).data,
            'timeframe': f'{timeframe} days',
            'category': category,
            'total_trending': len(sorted_products)
        })

class UserPreferencesAPIView(APIView):
    """Manage user preferences and get personalized recommendations"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """Get user's shopping patterns and preferences"""
        user = request.user
        
        # Get user's order history to infer preferences
        user_orders = OrderItem.objects.filter(
            user_id=user.id
        ).select_related()[:50]  # Recent 50 orders
        
        if not user_orders:
            return Response({
                'message': 'No order history found',
                'preferences': {},
                'recommendations': []
            })
        
        # Analyze preferences
        categories = {}
        brands = {}
        price_range = {'min': float('inf'), 'max': 0, 'avg': 0}
        
        total_spent = 0
        for order in user_orders:
            try:
                product = Product.objects.get(id=order.product_id)
                
                # Count categories
                categories[product.category] = categories.get(product.category, 0) + 1
                
                # Count brands
                brands[product.brand] = brands.get(product.brand, 0) + 1
                
                # Track price range
                price = float(product.retail_price)
                price_range['min'] = min(price_range['min'], price)
                price_range['max'] = max(price_range['max'], price)
                total_spent += price
                
            except Product.DoesNotExist:
                continue
        
        if user_orders:
            price_range['avg'] = total_spent / len(user_orders)
            if price_range['min'] == float('inf'):
                price_range['min'] = 0
        
        # Get top preferences
        top_categories = sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]
        top_brands = sorted(brands.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Generate recommendations based on preferences
        if top_categories:
            recommended_products = Product.objects.filter(
                category=top_categories[0][0]
            ).exclude(
                id__in=[order.product_id for order in user_orders]
            ).order_by('?')[:6]  # Random selection excluding already bought
        else:
            recommended_products = []
        
        return Response({
            'preferences': {
                'favorite_categories': [{'name': cat, 'count': count} for cat, count in top_categories],
                'favorite_brands': [{'name': brand, 'count': count} for brand, count in top_brands],
                'price_range': price_range,
                'total_orders': len(user_orders),
                'total_spent': total_spent
            },
            'recommendations': ProductSerializer(recommended_products, many=True).data
        })

class ConversationHistoryAPIView(APIView):
    """Manage conversation history"""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, conversation_id=None):
        """Get conversation history"""
        user = request.user
        
        if conversation_id:
            # Get specific conversation
            try:
                conversation = ConversationSession.objects.get(
                    id=conversation_id, 
                    user=user
                )
                return Response(
                    ConversationSessionSerializer(conversation).data
                )
            except ConversationSession.DoesNotExist:
                return Response(
                    {'error': 'Conversation not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # Get all user conversations
            conversations = ConversationSession.objects.filter(
                user=user
            ).order_by('-started_at')[:10]  # Latest 10 conversations
            
            return Response({
                'conversations': ConversationSessionSerializer(conversations, many=True).data,
                'total_count': ConversationSession.objects.filter(user=user).count()
            })

    def delete(self, request, conversation_id):
        """Delete a conversation"""
        user = request.user
        
        try:
            conversation = ConversationSession.objects.get(
                id=conversation_id, 
                user=user
            )
            conversation.delete()
            return Response({'message': 'Conversation deleted successfully'})
        except ConversationSession.DoesNotExist:
            return Response(
                {'error': 'Conversation not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )