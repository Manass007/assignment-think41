import React, { useEffect, useState } from 'react';
import { 
  Bot, 
  Menu, 
  LogOut, 
  User, 
  AlertCircle, 
  Settings, 
  TrendingUp,
  Search,
  Heart,
  ShoppingBag
} from 'lucide-react';
import MessageList from './MessageList';
import UserInput from './UserInput';
import ConversationSidebar from './ConversationSidebar';
import useChatStore from '../store/chatStore';
import apiService from '../services/apiService';

// User Preferences Modal Component
const UserPreferencesModal = ({ isOpen, onClose, preferences, onUpdate }) => {
  const [localPrefs, setLocalPrefs] = useState(preferences || {});
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Load categories and brands when modal opens
      const loadData = async () => {
        try {
          const [categoriesData, brandsData] = await Promise.all([
            apiService.getProductCategories(),
            apiService.getPopularBrands()
          ]);
          setCategories(categoriesData);
          setBrands(brandsData);
        } catch (error) {
          console.warn('Could not load preferences data:', error);
        }
      };
      loadData();
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdate(localPrefs);
      onClose();
    } catch (error) {
      console.error('Failed to update preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Shopping Preferences</h2>
        
        <div className="space-y-6">
          {/* Favorite Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Favorite Categories
            </label>
            <div className="grid grid-cols-2 gap-2">
              {categories.map(category => (
                <label key={category} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localPrefs.favorite_categories?.includes(category) || false}
                    onChange={(e) => {
                      const categories = localPrefs.favorite_categories || [];
                      if (e.target.checked) {
                        setLocalPrefs(prev => ({
                          ...prev,
                          favorite_categories: [...categories, category]
                        }));
                      } else {
                        setLocalPrefs(prev => ({
                          ...prev,
                          favorite_categories: categories.filter(c => c !== category)
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preferred Brands */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Brands
            </label>
            <div className="grid grid-cols-2 gap-2">
              {brands.map(brand => (
                <label key={brand} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localPrefs.preferred_brands?.includes(brand) || false}
                    onChange={(e) => {
                      const brands = localPrefs.preferred_brands || [];
                      if (e.target.checked) {
                        setLocalPrefs(prev => ({
                          ...prev,
                          preferred_brands: [...brands, brand]
                        }));
                      } else {
                        setLocalPrefs(prev => ({
                          ...prev,
                          preferred_brands: brands.filter(b => b !== brand)
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range ($)
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="Min"
                value={localPrefs.price_range?.min || ''}
                onChange={(e) => setLocalPrefs(prev => ({
                  ...prev,
                  price_range: { ...prev.price_range, min: e.target.value }
                }))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md"
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={localPrefs.price_range?.max || ''}
                onChange={(e) => setLocalPrefs(prev => ({
                  ...prev,
                  price_range: { ...prev.price_range, max: e.target.value }
                }))}
                className="w-24 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Size Preferences */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Sizes
            </label>
            <div className="flex flex-wrap gap-2">
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                <label key={size} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localPrefs.preferred_sizes?.includes(size) || false}
                    onChange={(e) => {
                      const sizes = localPrefs.preferred_sizes || [];
                      if (e.target.checked) {
                        setLocalPrefs(prev => ({
                          ...prev,
                          preferred_sizes: [...sizes, size]
                        }));
                      } else {
                        setLocalPrefs(prev => ({
                          ...prev,
                          preferred_sizes: sizes.filter(s => s !== size)
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{size}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md"
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Login Modal Component
const LoginModal = ({ isOpen, onLogin, onClose, error, isLoading }) => {
  const [credentials, setCredentials] = useState({
    username: 'lancelord',
    password: 'Hype123@'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(credentials.username, credentials.password);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Login to Continue</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-md transition-colors"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-700">
            <strong>Test Credentials:</strong><br />
            Username: lancelord<br />
            Password: Hype123@
          </p>
        </div>
      </div>
    </div>
  );
};

// Quick Actions Component
const QuickActions = ({ onAction }) => {
  const actions = [
    { 
      icon: TrendingUp, 
      label: 'Trending', 
      action: 'trending',
      description: 'Show trending products'
    },
    { 
      icon: Search, 
      label: 'Search', 
      action: 'search',
      description: 'Search for products'
    },
    { 
      icon: Heart, 
      label: 'Seasonal', 
      action: 'seasonal',
      description: 'Seasonal recommendations'
    },
    { 
      icon: ShoppingBag, 
      label: 'Outfit', 
      action: 'outfit',
      description: 'Get outfit suggestions'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 border-b">
      {actions.map(({ icon: Icon, label, action, description }) => (
        <button
          key={action}
          onClick={() => onAction(action)}
          className="flex items-center gap-2 p-3 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-all text-left"
        >
          <Icon size={18} className="text-blue-600" />
          <div>
            <div className="font-medium text-sm text-gray-800">{label}</div>
            <div className="text-xs text-gray-500">{description}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

const ChatWindow = () => {
  const { 
    sendMessage,
    createNewConversation,
    currentConversationId,
    setConversationId,
    error,
    clearError,
    isSidebarOpen,
    toggleSidebar,
    saveCurrentConversation,
    messages,
    clearMessages,
    loadSavedConversations
  } = useChatStore();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [user, setUser] = useState(null);

  // Preferences state
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [userPreferences, setUserPreferences] = useState(null);

  // Check authentication on component mount
  useEffect(() => {
    apiService.loadTokens();
    if (apiService.isAuthenticated()) {
      setIsAuthenticated(true);
      setUser({ username: 'User' });
      loadUserPreferences();
    } else {
      setShowLoginModal(true);
    }
  }, []);

  // Initialize conversation when authenticated
  useEffect(() => {
    if (isAuthenticated && !currentConversationId) {
      createNewConversation();
      // Load conversation history from localStorage
      loadSavedConversations();
    }
  }, [isAuthenticated, currentConversationId, createNewConversation, loadSavedConversations]);

  // Auto-save conversation
  useEffect(() => {
    const interval = setInterval(() => {
      if (messages.length > 0 && isAuthenticated) {
        saveCurrentConversation();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [messages.length, saveCurrentConversation, isAuthenticated]);

  const loadUserPreferences = async () => {
    try {
      const preferences = await apiService.getUserPreferences();
      setUserPreferences(preferences);
    } catch (error) {
      console.warn('Could not load user preferences:', error);
    }
  };

  const handleLogin = async (username, password) => {
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      await apiService.authenticate(username, password);
      setIsAuthenticated(true);
      setUser({ username });
      setShowLoginModal(false);
      await loadUserPreferences();
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    apiService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setUserPreferences(null);
    clearMessages();
    setConversationId(null);
    setShowLoginModal(true);
  };

  const handleUpdatePreferences = async (preferences) => {
    try {
      const updated = await apiService.updateUserPreferences(preferences);
      setUserPreferences(updated);
    } catch (error) {
      throw error;
    }
  };

  const handleQuickAction = async (action) => {
    let message = '';
    
    switch (action) {
      case 'trending':
        message = 'Show me the trending products right now';
        break;
      case 'search':
        message = 'I want to search for products';
        break;
      case 'seasonal':
        message = 'What are your seasonal recommendations for this time of year?';
        break;
      case 'outfit':
        message = 'Help me put together a complete outfit';
        break;
      default:
        return;
    }
    
    if (message) {
      await handleSendMessage(message);
    }
  };

  const sendMessageToAPI = async (messageContent) => {
    try {
      const result = await apiService.sendChatMessage(messageContent, currentConversationId);
      
      // Update the conversation ID if it's a new conversation
      if (result.conversationId && result.conversationId !== currentConversationId) {
        setConversationId(result.conversationId);
      }
      
      return result.aiMessage.content;
    } catch (error) {
      if (error.message.includes('login') || error.message.includes('Token refresh failed')) {
        setIsAuthenticated(false);
        setUser(null);
        setUserPreferences(null);
        setShowLoginModal(true);
      }
      throw error;
    }
  };

  const handleSendMessage = async (messageContent) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    await sendMessage(messageContent, sendMessageToAPI);
  };

  const handleNewChat = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    createNewConversation();
  };

  // Show login modal if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <div className="flex h-screen bg-gray-50 items-center justify-center">
          <div className="text-center">
            <Bot size={64} className="text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">AI E-commerce Assistant</h1>
            <p className="text-gray-600 mb-6">Please login to start chatting and shopping</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Login
            </button>
          </div>
        </div>
        
        <LoginModal
          isOpen={showLoginModal}
          onLogin={handleLogin}
          onClose={() => setShowLoginModal(false)}
          error={loginError}
          isLoading={isLoggingIn}
        />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Conversation Sidebar */}
      <ConversationSidebar />

      {/* Main Chat Area */}
      <div 
        className={`flex flex-col flex-1 transition-all duration-300 ${
          isSidebarOpen ? 'ml-80' : 'ml-0'
        }`}
      >
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-md mr-2"
            >
              <Menu size={20} />
            </button>
            
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">AI E-commerce Assistant</h1>
              <p className="text-sm text-gray-500">
                {currentConversationId ? 'Active conversation' : 'Ready to chat'}
                {userPreferences && (
                  <span className="ml-2 text-blue-600">• Preferences loaded</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* User Info */}
            {user && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={16} />
                <span>{user.username}</span>
              </div>
            )}
            
            {/* Preferences Button */}
            <button
              onClick={() => setShowPreferencesModal(true)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Shopping Preferences"
            >
              <Settings size={20} />
            </button>
            
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              New Chat
            </button>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="bg-green-50 border-l-4 border-green-400 p-2 mx-4 mt-2">
          <p className="text-xs text-green-700">
            ✅ Connected to backend • 🤖 AI responses include product search • 
            🛍️ Full e-commerce features enabled
          </p>
        </div>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <QuickActions onAction={handleQuickAction} />
        )}

        {/* Messages */}
        <MessageList />

        {/* Input */}
        <UserInput onSendMessage={handleSendMessage} />
      </div>

      {/* Modals */}
      <UserPreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowPreferencesModal(false)}
        preferences={userPreferences}
        onUpdate={handleUpdatePreferences}
      />
    </div>
  );
};

export default ChatWindow;