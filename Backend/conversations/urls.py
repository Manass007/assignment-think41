from django.urls import path
from .views import (
    ChatAPIView, ProductSearchAPIView, TrendingProductsAPIView,
    UserPreferencesAPIView, ConversationHistoryAPIView
)

urlpatterns = [
    path('chat/', ChatAPIView.as_view(), name='chat'),

    # Additional fashion-specific endpoints
    path('products/search/', ProductSearchAPIView.as_view(), name='product-search'),
    path('products/trending/', TrendingProductsAPIView.as_view(), name='trending-products'),
    path('user/preferences/', UserPreferencesAPIView.as_view(), name='user-preferences'),
    path('conversations/', ConversationHistoryAPIView.as_view(), name='conversation-history'),
    path('conversations/<int:conversation_id>/', ConversationHistoryAPIView.as_view(), name='conversation-detail'),
]