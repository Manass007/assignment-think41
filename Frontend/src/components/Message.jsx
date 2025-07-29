import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  User, 
  Copy, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  RefreshCw,
  ExternalLink,
  ShoppingBag,
  Heart,
  Star,
  TrendingUp,
  Eye,
  DollarSign
} from 'lucide-react';
import apiService from '../services/apiService';

// Product Card Component for displaying products in messages
const ProductCard = ({ product, onViewDetails, onAddToWishlist }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [availability, setAvailability] = useState(null);

  useEffect(() => {
    // Check product availability when component mounts
    const checkAvailability = async () => {
      try {
        const availabilityData = await apiService.checkProductAvailability(product.id);
        setAvailability(availabilityData);
      } catch (error) {
        console.warn('Could not check availability:', error);
      }
    };

    if (product.id) {
      checkAvailability();
    }
  }, [product.id]);

  const handleWishlistToggle = async () => {
    try {
      setIsWishlisted(!isWishlisted);
      if (onAddToWishlist) {
        await onAddToWishlist(product.id, !isWishlisted);
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      setIsWishlisted(isWishlisted); // Revert on error
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        {/* Product Image */}
        {product.image_url && (
          <div className="w-16 h-16 flex-shrink-0">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover rounded-md"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-gray-800 truncate">
            {product.name}
          </h4>
          
          {product.brand && (
            <p className="text-xs text-gray-600 mb-1">{product.brand}</p>
          )}
          
          {/* Price */}
          <div className="flex items-center gap-2 mb-2">
            {product.sale_price && product.sale_price !== product.regular_price ? (
              <>
                <span className="text-sm font-semibold text-red-600">
                  {formatPrice(product.sale_price)}
                </span>
                <span className="text-xs text-gray-500 line-through">
                  {formatPrice(product.regular_price)}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-gray-800">
                {formatPrice(product.regular_price || product.price)}
              </span>
            )}
          </div>

          {/* Rating */}
          {product.rating && (
            <div className="flex items-center gap-1 mb-2">
              <Star size={12} className="text-yellow-400 fill-current" />
              <span className="text-xs text-gray-600">
                {product.rating} ({product.review_count || 0} reviews)
              </span>
            </div>
          )}

          {/* Availability Status */}
          {availability && (
            <div className="mb-2">
              <span className={`text-xs px-2 py-1 rounded-full ${
                availability.available 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {availability.available ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onViewDetails && onViewDetails(product)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
            >
              <Eye size={12} />
              View
            </button>
            
            <button
              onClick={handleWishlistToggle}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                isWishlisted
                  ? 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Heart size={12} className={isWishlisted ? 'fill-current' : ''} />
              {isWishlisted ? 'Saved' : 'Save'}
            </button>

            {product.url && (
              <button
                onClick={() => window.open(product.url, '_blank')}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded transition-colors"
              >
                <ShoppingBag size={12} />
                Buy
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Trending Indicator Component
const TrendingIndicator = ({ trend }) => {
  if (!trend) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
      <TrendingUp size={12} />
      <span>Trending {trend}%</span>
    </div>
  );
};

const Message = ({ message, isUser, timestamp, messageId, products = [], userContext = {} }) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(null); // null, true (thumbs up), false (thumbs down)
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [parsedProducts, setParsedProducts] = useState([]);

  // Get message content - handle both string and object formats
  const messageContent = typeof message === 'string' ? message : (message?.content || '');

  // Parse products from message or props
  useEffect(() => {
    if (products && products.length > 0) {
      setParsedProducts(products);
    } else if (messageContent && typeof messageContent === 'string') {
      // Try to extract product information from message text
      try {
        const productMatches = messageContent.match(/\[PRODUCT:.*?\]/g);
        if (productMatches) {
          const extractedProducts = productMatches.map(match => {
            try {
              return JSON.parse(match.replace('[PRODUCT:', '').replace(']', ''));
            } catch {
              return null;
            }
          }).filter(Boolean);
          setParsedProducts(extractedProducts);
        }
      } catch (error) {
        console.warn('Could not parse products from message:', error);
      }
    }
  }, [messageContent, products]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const handleRegenerate = async () => {
    if (isUser) return;
    
    setIsRegenerating(true);
    try {
      // This would need to be implemented in your chat store
      // For now, just show the loading state
      setTimeout(() => {
        setIsRegenerating(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to regenerate message:', error);
      setIsRegenerating(false);
    }
  };

  const handleProductView = async (product) => {
    try {
      // Get detailed product information
      const productDetails = await apiService.searchProducts({ 
        id: product.id,
        detailed: true 
      });
      
      // Open product in modal or new tab
      if (product.url) {
        window.open(product.url, '_blank');
      } else {
        console.log('Product details:', productDetails);
        // You could open a product details modal here
      }
    } catch (error) {
      console.error('Failed to get product details:', error);
    }
  };

  const handleWishlistToggle = async (productId, isAdding) => {
    try {
      // This would integrate with your wishlist API
      console.log(`${isAdding ? 'Adding to' : 'Removing from'} wishlist:`, productId);
      // await apiService.updateWishlist(productId, isAdding);
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      throw error;
    }
  };

  const getOutfitSuggestions = async (productId) => {
    try {
      const suggestions = await apiService.getOutfitSuggestions(productId);
      console.log('Outfit suggestions:', suggestions);
      // You could display these suggestions in the chat
    } catch (error) {
      console.error('Failed to get outfit suggestions:', error);
    }
  };

  // Clean message text (remove product markers) - this is line 280 that was causing the error
  const cleanMessage = messageContent && typeof messageContent === 'string' ? messageContent.replace(/\[PRODUCT:.*?\]/g, '').trim() : '';

  return (
    <div className={`flex gap-3 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
        {/* Message Bubble */}
        <div className={`px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {isRegenerating ? (
            <div className="flex items-center gap-2">
              <RefreshCw size={16} className="animate-spin" />
              <span className="text-sm">Regenerating response...</span>
            </div>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanMessage}</p>
          )}
        </div>

        {/* Products Display */}
        {parsedProducts.length > 0 && !isUser && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <ShoppingBag size={12} />
              <span>Products found ({parsedProducts.length})</span>
            </div>
            <div className="grid gap-2">
              {parsedProducts.slice(0, 3).map((product, index) => (
                <ProductCard
                  key={product.id || index}
                  product={product}
                  onViewDetails={handleProductView}
                  onAddToWishlist={handleWishlistToggle}
                />
              ))}
              {parsedProducts.length > 3 && (
                <div className="text-center">
                  <button className="text-xs text-blue-600 hover:text-blue-800">
                    View {parsedProducts.length - 3} more products
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Context Display */}
        {userContext && Object.keys(userContext).length > 0 && !isUser && (
          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
            <div className="text-xs text-blue-700 mb-1">Personalized for you:</div>
            <div className="text-xs text-blue-600 space-y-1">
              {userContext.preferences && (
                <div>Based on your preferences: {userContext.preferences.join(', ')}</div>
              )}
              {userContext.budget && (
                <div className="flex items-center gap-1">
                  <DollarSign size={10} />
                  Budget range: ${userContext.budget.min} - ${userContext.budget.max}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Actions */}
        <div className="flex items-center justify-between mt-2">
          {/* Timestamp */}
          {timestamp && (
            <p className={`text-xs text-gray-500 ${isUser ? 'text-right' : 'text-left'}`}>
              {formatTime(timestamp)}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100"
              title="Copy message"
            >
              {copied ? (
                <Check size={12} className="text-green-600" />
              ) : (
                <Copy size={12} className="text-gray-500" />
              )}
            </button>

            {/* AI Message Actions */}
            {!isUser && (
              <>
                {/* Feedback Buttons */}
                <button
                  onClick={() => setLiked(liked === true ? null : true)}
                  className={`p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                    liked === true ? 'text-green-600' : 'text-gray-500'
                  }`}
                  title="Good response"
                >
                  <ThumbsUp size={12} />
                </button>
                
                <button
                  onClick={() => setLiked(liked === false ? null : false)}
                  className={`p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                    liked === false ? 'text-red-600' : 'text-gray-500'
                  }`}
                  title="Poor response"
                >
                  <ThumbsDown size={12} />
                </button>

                {/* Regenerate Button */}
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="p-1 hover:bg-gray-200 rounded transition-colors opacity-0 group-hover:opacity-100 text-gray-500 disabled:opacity-50"
                  title="Regenerate response"
                >
                  <RefreshCw size={12} className={isRegenerating ? 'animate-spin' : ''} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Product Actions for AI Messages */}
        {parsedProducts.length > 0 && !isUser && (
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => getOutfitSuggestions(parsedProducts[0]?.id)}
              className="text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-1 rounded-full transition-colors"
            >
              Get outfit ideas
            </button>
            <button
              onClick={() => {
                const categories = [...new Set(parsedProducts.map(p => p.category).filter(Boolean))];
                console.log('Show similar products in categories:', categories);
              }}
              className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded-full transition-colors"
            >
              Find similar
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0 order-2">
          <User size={16} className="text-white" />
        </div>
      )}
    </div>
  );
};

export default Message;