from rest_framework import serializers
from .models import ConversationSession, Message, Product, InventoryItem, Order, OrderItem, EcommerceUser

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'session', 'sender', 'text', 'timestamp']

class ConversationSessionSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ConversationSession
        fields = ['id', 'user', 'started_at', 'title', 'messages']

class ProductSerializer(serializers.ModelSerializer):
    """Serializer for product data with additional computed fields"""
    availability_status = serializers.SerializerMethodField()
    formatted_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'brand', 'category', 'department', 
            'retail_price', 'formatted_price', 'sku', 
            'availability_status'
        ]
    
    def get_availability_status(self, obj):
        """Get real-time availability status"""
        available_count = InventoryItem.objects.filter(
            product_id=obj.id,
            sold_at__isnull=True
        ).count()
        
        if available_count > 10:
            return {"status": "in_stock", "message": "In Stock", "count": available_count}
        elif available_count > 0:
            return {"status": "low_stock", "message": f"Only {available_count} left!", "count": available_count}
        else:
            return {"status": "out_of_stock", "message": "Out of Stock", "count": 0}
    
    def get_formatted_price(self, obj):
        """Format price with currency symbol"""
        return f"${obj.retail_price:.2f}"

class InventoryItemSerializer(serializers.ModelSerializer):
    """Serializer for inventory items"""
    class Meta:
        model = InventoryItem
        fields = [
            'id', 'product_id', 'created_at', 'sold_at', 
            'product_name', 'product_brand', 'product_category',
            'product_retail_price', 'product_department'
        ]

class OrderSerializer(serializers.ModelSerializer):
    """Serializer for order data"""
    class Meta:
        model = Order
        fields = [
            'order_id', 'user_id', 'status', 'gender',
            'created_at', 'shipped_at', 'delivered_at', 'returned_at',
            'num_of_item'
        ]

class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items with product details"""
    product_details = serializers.SerializerMethodField()
    
    class Meta:
        model = OrderItem
        fields = [
            'id', 'order_id', 'user_id', 'product_id', 
            'status', 'created_at', 'shipped_at', 'delivered_at', 'returned_at',
            'product_details'
        ]
    
    def get_product_details(self, obj):
        """Get associated product details"""
        try:
            product = Product.objects.get(id=obj.product_id)
            return {
                'name': product.name,
                'brand': product.brand,
                'category': product.category,
                'price': product.retail_price
            }
        except Product.DoesNotExist:
            return None

class EcommerceUserSerializer(serializers.ModelSerializer):
    """Serializer for ecommerce user data"""
    full_name = serializers.SerializerMethodField()
    order_count = serializers.SerializerMethodField()
    
    class Meta:
        model = EcommerceUser
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email',
            'age', 'gender', 'state', 'city', 'country',
            'created_at', 'order_count'
        ]
    
    def get_full_name(self, obj):
        """Get formatted full name"""
        return f"{obj.first_name} {obj.last_name}".strip()
    
    def get_order_count(self, obj):
        """Get total order count for user"""
        return OrderItem.objects.filter(user_id=obj.id).count()

class ProductSearchResponseSerializer(serializers.Serializer):
    """Serializer for product search API responses"""
    products = ProductSerializer(many=True)
    total_count = serializers.IntegerField()
    search_params = serializers.DictField()
    suggestions = serializers.ListField(child=serializers.CharField(), required=False)
    
class TrendingProductsSerializer(serializers.Serializer):
    """Serializer for trending products response"""
    trending_products = ProductSerializer(many=True)
    timeframe = serializers.CharField()
    category = serializers.CharField(required=False)
    trend_score = serializers.SerializerMethodField()
    
    def get_trend_score(self, obj):
        """Calculate trend score based on recent orders"""
        # This would be implemented based on your trending algorithm
        return "high"  # placeholder

class StyleRecommendationSerializer(serializers.Serializer):
    """Serializer for style-based recommendations"""
    recommended_products = ProductSerializer(many=True)
    style = serializers.CharField()
    occasion = serializers.CharField(required=False)
    confidence_score = serializers.FloatField()
    styling_tips = serializers.ListField(child=serializers.CharField(), required=False)

class UserContextSerializer(serializers.Serializer):
    """Serializer for user context data"""
    age = serializers.IntegerField(required=False)
    gender = serializers.CharField(required=False)
    location = serializers.CharField(required=False)
    user_id = serializers.IntegerField(required=False)
    preferences = serializers.DictField(required=False)

class ChatResponseSerializer(serializers.Serializer):
    """Serializer for complete chat API response"""
    conversation_id = serializers.IntegerField()
    user_message = MessageSerializer()
    ai_message = MessageSerializer()
    user_context = UserContextSerializer(required=False)
    products = ProductSerializer(many=True, required=False)
    action_type = serializers.CharField(required=False)
    metadata = serializers.DictField(required=False)