import React, { useRef, useEffect, useState } from 'react';
import { 
  Bot, 
  Loader2, 
  TrendingUp, 
  Search, 
  Sparkles, 
  ShoppingBag,
  Heart,
  Star,
  Filter,
  Zap,
  ChevronDown,
  Grid,
  List,
  Eye,
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight,
  ArrowUp
} from 'lucide-react';
import Message from './Message';
import useChatStore from '../store/chatStore';
import apiService from '../services/apiService';

// Product Card Component
const ProductCard = ({ product, onView, onSave, onSuggestOutfit, compact = false }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action, actionFn) => {
    setIsLoading(true);
    try {
      await actionFn(product);
    } catch (error) {
      console.error(`Error with ${action}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:shadow-md transition-shadow">
        <img 
          src={product.image || '/api/placeholder/60/60'} 
          alt={product.name}
          className="w-15 h-15 object-cover rounded-md"
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{product.name}</h4>
          <p className="text-xs text-gray-500">{product.brand}</p>
          <p className="text-sm font-semibold text-blue-600">${product.price}</p>
        </div>
        <button
          onClick={() => handleAction('view', onView)}
          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
          disabled={isLoading}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="relative">
        <img 
          src={product.image || '/api/placeholder/250/300'} 
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <button
          onClick={() => setIsLiked(!isLiked)}
          className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${
            isLiked ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </button>
        {product.rating && (
          <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs flex items-center">
            <Star className="w-3 h-3 fill-current mr-1" />
            {product.rating}
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 truncate flex-1">{product.name}</h3>
          <span className="text-lg font-bold text-blue-600 ml-2">${product.price}</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{product.brand}</p>
        
        {product.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{product.description}</p>
        )}
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleAction('view', onView)}
            disabled={isLoading}
            className="flex-1 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4 mr-1" />}
            View
          </button>
          
          <button
            onClick={() => handleAction('save', onSave)}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Bookmark className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => handleAction('suggest', onSuggestOutfit)}
            className="px-3 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Product Grid Component
const ProductGrid = ({ products, viewMode, onProductView, onProductSave, onOutfitSuggest }) => {
  if (!products || products.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No products found</p>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {products.map((product, index) => (
          <ProductCard
            key={product.id || index}
            product={product}
            onView={onProductView}
            onSave={onProductSave}
            onSuggestOutfit={onOutfitSuggest}
            compact={true}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.id || index}
          product={product}
          onView={onProductView}
          onSave={onProductSave}
          onSuggestOutfit={onOutfitSuggest}
        />
      ))}
    </div>
  );
};

// Product Carousel Component
const ProductCarousel = ({ products, onProductView, onProductSave, onOutfitSuggest }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const updateVisibleCount = () => {
      if (window.innerWidth < 640) setVisibleCount(1);
      else if (window.innerWidth < 1024) setVisibleCount(2);
      else setVisibleCount(3);
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);
    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  const canGoNext = currentIndex < products.length - visibleCount;
  const canGoPrev = currentIndex > 0;

  const goNext = () => {
    if (canGoNext) setCurrentIndex(prev => prev + 1);
  };

  const goPrev = () => {
    if (canGoPrev) setCurrentIndex(prev => prev - 1);
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Featured Products</h3>
        <div className="flex space-x-2">
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            className="p-2 rounded-full border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goNext}
            disabled={!canGoNext}
            className="p-2 rounded-full border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
            width: `${(products.length / visibleCount) * 100}%`
          }}
        >
          {products.map((product, index) => (
            <div 
              key={product.id || index} 
              className="px-2"
              style={{ width: `${100 / products.length}%` }}
            >
              <ProductCard
                product={product}
                onView={onProductView}
                onSave={onProductSave}
                onSuggestOutfit={onOutfitSuggest}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Welcome suggestions component
const WelcomeSuggestions = ({ onSuggestionClick }) => {
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [seasonalProducts, setSeasonalProducts] = useState([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoadingTrending(true);
    try {
      // Load trending products
      const trending = await apiService.getTrendingProducts({ limit: 3 });
      setTrendingProducts(trending.products || []);
      
      // Load seasonal recommendations
      const seasonal = await apiService.getSeasonalRecommendations();
      setSeasonalProducts(seasonal.products?.slice(0, 3) || []);
    } catch (error) {
      console.warn('Could not load initial data:', error);
    } finally {
      setIsLoadingTrending(false);
    }
  };

  const suggestions = [
    {
      icon: TrendingUp,
      title: "What's trending now?",
      subtitle: "Discover popular fashion items",
      color: "bg-gradient-to-r from-pink-500 to-rose-500",
      query: "Show me what's trending in fashion right now"
    },
    {
      icon: Search,
      title: "Find specific items",
      subtitle: "Search for clothes, shoes, accessories",
      color: "bg-gradient-to-r from-blue-500 to-cyan-500",
      query: "I'm looking for a specific type of clothing item"
    },
    {
      icon: Sparkles,
      title: "Style recommendations",
      subtitle: "Get personalized outfit suggestions",
      color: "bg-gradient-to-r from-purple-500 to-violet-500",
      query: "Give me some personalized style recommendations based on my preferences"
    },
    {
      icon: Heart,
      title: "Seasonal favorites",
      subtitle: "Perfect for current weather",
      color: "bg-gradient-to-r from-green-500 to-emerald-500",
      query: "What are your seasonal recommendations for this time of year?"
    }
  ];

  const handleProductAction = async (action, product) => {
    console.log(`${action} product:`, product);
    // Implement product actions here
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="relative">
            <Bot className="w-12 h-12 text-blue-500" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fashion AI Assistant</h1>
            <p className="text-gray-600">Your personal style companion</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Welcome! How can I help you today?
          </h2>
          <p className="text-gray-600">
            I can help you discover trending fashion, find specific items, or create personalized outfit recommendations.
          </p>
        </div>
      </div>

      {/* Quick Action Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion, index) => {
          const IconComponent = suggestion.icon;
          return (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.query)}
              className="group relative overflow-hidden rounded-xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-lg"
            >
              <div className={`absolute inset-0 ${suggestion.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
              <div className="relative z-10">
                <div className={`inline-flex p-3 rounded-lg ${suggestion.color} text-white mb-4`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{suggestion.title}</h3>
                <p className="text-gray-600 text-sm">{suggestion.subtitle}</p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-medium">
                  Try it now <ChevronDown className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Trending Products */}
      {isLoadingTrending ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
          <p className="text-gray-600">Loading trending products...</p>
        </div>
      ) : trendingProducts.length > 0 && (
        <div className="space-y-4">
          <ProductCarousel
            products={trendingProducts}
            onProductView={handleProductAction.bind(null, 'view')}
            onProductSave={handleProductAction.bind(null, 'save')}
            onOutfitSuggest={handleProductAction.bind(null, 'outfit')}
          />
        </div>
      )}

      {/* Seasonal Recommendations */}
      {seasonalProducts.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-green-500" />
            Seasonal Picks
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {seasonalProducts.map((product, index) => (
              <ProductCard
                key={product.id || index}
                product={product}
                onView={handleProductAction.bind(null, 'view')}
                onSave={handleProductAction.bind(null, 'save')}
                onSuggestOutfit={handleProductAction.bind(null, 'outfit')}
                compact={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Loading Component
const EnhancedLoading = ({ progress = 0, stage = "Processing" }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="relative">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <div className="absolute inset-0 bg-blue-500 opacity-20 rounded-full animate-ping"></div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-gray-700 font-medium">{stage}{dots}</p>
        
        {progress > 0 && (
          <div className="w-48 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        )}
        
        <p className="text-sm text-gray-500">
          This may take a few moments...
        </p>
      </div>
    </div>
  );
};

// Smart Suggestions Component
const SmartSuggestions = ({ onSuggestionClick, context = {} }) => {
  const contextualSuggestions = [
    "Show me similar items",
    "Find matching accessories",
    "Create an outfit with this",
    "What's my budget for this style?",
    "Show reviews for this brand"
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-4 my-4">
      <p className="text-sm text-gray-600 mb-3 flex items-center">
        <Zap className="w-4 h-4 mr-1" />
        Quick suggestions:
      </p>
      <div className="flex flex-wrap gap-2">
        {contextualSuggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

// Main MessageList Component
const MessageList = () => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const { messages, isLoading, loadingStage, loadingProgress } = useChatStore();
  
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [autoScroll, setAutoScroll] = useState(true);

  // Scroll to bottom functionality
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle scroll events
  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    setShowScrollButton(!isNearBottom);
    setAutoScroll(isNearBottom);
  };

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
    }
  }, [messages, autoScroll]);

  // Product interaction handlers
  const handleProductView = async (product) => {
    console.log('Viewing product:', product);
    // Track product view
    try {
      await apiService.trackProductInteraction({
        productId: product.id,
        type: 'view',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  };

  const handleProductSave = async (product) => {
    console.log('Saving product:', product);
    try {
      await apiService.saveProduct(product.id);
      // Show success feedback
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleOutfitSuggest = async (product) => {
    console.log('Suggesting outfit for:', product);
    try {
      const suggestions = await apiService.getOutfitSuggestions({
        baseProduct: product.id,
        style: product.style || 'casual'
      });
      // Handle outfit suggestions
    } catch (error) {
      console.error('Error getting outfit suggestions:', error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    // This would typically send the suggestion as a new message
    console.log('Suggestion clicked:', suggestion);
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gray-50"
      onScroll={handleScroll}
    >
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 ? (
          <WelcomeSuggestions onSuggestionClick={handleSuggestionClick} />
        ) : (
          <div className="space-y-4 p-4">
            {/* View Mode Toggle */}
            <div className="flex justify-end mb-4">
              <div className="flex bg-white rounded-lg border p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-blue-500'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-600 hover:text-blue-500'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            {messages.map((message, index) => (
              <div key={message.id || index}>
                <Message 
                  message={message}
                  viewMode={viewMode}
                  onProductView={handleProductView}
                  onProductSave={handleProductSave}
                  onOutfitSuggest={handleOutfitSuggest}
                />
                
                {/* Smart Suggestions after bot messages */}
                {message.type === 'bot' && index === messages.length - 1 && (
                  <SmartSuggestions 
                    onSuggestionClick={handleSuggestionClick}
                    context={message}
                  />
                )}
              </div>
            ))}

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-xs lg:max-w-md bg-white rounded-lg shadow-sm p-4">
                  <EnhancedLoading 
                    progress={loadingProgress}
                    stage={loadingStage || "Thinking"}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="fixed bottom-20 right-6 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300 z-10"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default MessageList;