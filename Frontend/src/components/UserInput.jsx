import React, { useRef, useEffect, useState } from 'react';
import { 
  Send, 
  Loader2, 
  Mic, 
  MicOff, 
  Paperclip, 
  Smile, 
  Search,
  TrendingUp,
  Camera,
  MapPin,
  Zap
} from 'lucide-react';
import useChatStore from '../store/chatStore';
import apiService from '../services/apiService';

// Quick suggestion pills component
const QuickSuggestions = ({ onSuggestionClick, suggestions }) => {
  const [visible, setVisible] = useState(true);

  if (!visible || !suggestions.length) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-t">
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        <span className="text-xs text-gray-500 whitespace-nowrap">Quick suggestions:</span>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => {
              onSuggestionClick(suggestion.text);
              setVisible(false);
            }}
            className="flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            {suggestion.icon && <suggestion.icon size={12} />}
            {suggestion.text}
          </button>
        ))}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-gray-400 hover:text-gray-600 ml-2"
      >
        ×
      </button>
    </div>
  );
};

// Voice input component
const VoiceInput = ({ onTranscript, isListening, onToggleListening }) => {
  const [isSupported] = useState(
    typeof window !== 'undefined' && 
    'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  );

  const handleVoiceToggle = () => {
    if (!isSupported) {
      alert('Speech recognition is not supported in your browser');
      return;
    }
    onToggleListening();
  };

  if (!isSupported) return null;

  return (
    <button
      onClick={handleVoiceToggle}
      className={`p-2 rounded-full transition-colors ${
        isListening
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
    </button>
  );
};

// Smart autocomplete component
const SmartAutocomplete = ({ query, onSuggestionSelect, isVisible }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Get quick search suggestions from API
        const results = await apiService.quickSearch(query, 5);
        
        // Transform results to suggestions
        const productSuggestions = results.map(product => ({
          type: 'product',
          text: product.name,
          subtitle: product.brand || product.category,
          price: product.price || product.regular_price,
          image: product.image_url
        }));

        // Add query-based suggestions
        const querySuggestions = [
          {
            type: 'search',
            text: `Search for "${query}"`,
            icon: Search
          },
          {
            type: 'trending',
            text: `Show trending ${query}`,
            icon: TrendingUp
          }
        ];

        setSuggestions([...querySuggestions, ...productSuggestions]);
      } catch (error) {
        console.warn('Failed to load autocomplete suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  if (!isVisible || (!suggestions.length && !isLoading)) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mb-2 max-h-60 overflow-y-auto z-10">
      {isLoading ? (
        <div className="p-3 text-center">
          <Loader2 size={16} className="animate-spin text-gray-400 mx-auto" />
          <p className="text-xs text-gray-500 mt-1">Loading suggestions...</p>
        </div>
      ) : (
        suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionSelect(suggestion)}
            className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
          >
            <div className="flex items-center gap-3">
              {suggestion.type === 'product' ? (
                suggestion.image ? (
                  <img 
                    src={suggestion.image} 
                    alt={suggestion.text}
                    className="w-8 h-8 object-cover rounded"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <Search size={12} className="text-gray-500" />
                  </div>
                )
              ) : (
                suggestion.icon && (
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <suggestion.icon size={14} className="text-blue-600" />
                  </div>
                )
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {suggestion.text}
                </p>
                {suggestion.subtitle && (
                  <p className="text-xs text-gray-500 truncate">
                    {suggestion.subtitle}
                  </p>
                )}
              </div>
              
              {suggestion.price && (
                <span className="text-sm font-semibold text-gray-800">
                  ${suggestion.price}
                </span>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );
};

const UserInput = ({ onSendMessage }) => {
  const textareaRef = useRef(null);
  const { userInput, setUserInput, clearUserInput, isLoading } = useChatStore();
  
  // Enhanced state
  const [isListening, setIsListening] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [quickSuggestions, setQuickSuggestions] = useState([]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setUserInput(transcript);
          setIsListening(false);
        };

        recognitionInstance.onerror = () => {
          setIsListening(false);
        };

        recognitionInstance.onend = () => {
          setIsListening(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, [setUserInput]);

  // Load contextual suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        // Get user preferences to customize suggestions
        const preferences = await apiService.getUserPreferences();
        
        const suggestions = [
          { 
            text: "What's trending today?", 
            icon: TrendingUp 
          },
          { 
            text: "Show me something in my style", 
            icon: Zap 
          },
          { 
            text: "Find items under $50", 
            icon: Search 
          }
        ];

        // Add preference-based suggestions
        if (preferences.favorite_categories?.length > 0) {
          suggestions.push({
            text: `Show me ${preferences.favorite_categories[0]} items`,
            icon: Search
          });
        }

        setQuickSuggestions(suggestions.slice(0, 4));
      } catch (error) {
        // Fallback suggestions
        setQuickSuggestions([
          { text: "What's trending today?", icon: TrendingUp },
          { text: "Help me find an outfit", icon: Search },
          { text: "Show me sale items", icon: Zap }
        ]);
      }
    };

    loadSuggestions();
  }, []);

  const handleSubmit = () => {
    if (userInput.trim() && !isLoading) {
      onSendMessage(userInput.trim());
      clearUserInput();
      setShowAutocomplete(false);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!showAutocomplete) {
        handleSubmit();
      }
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserInput(value);
    
    // Show autocomplete for searches
    setShowAutocomplete(value.length > 1);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const handleVoiceToggle = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    if (suggestion.type === 'product') {
      setUserInput(`Tell me more about ${suggestion.text}`);
    } else {
      setUserInput(suggestion.text);
    }
    setShowAutocomplete(false);
    textareaRef.current?.focus();
  };

  const handleQuickSuggestionClick = (text) => {
    setUserInput(text);
    textareaRef.current?.focus();
  };

  // Focus input when loading finishes
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // Handle file upload (for future image search feature)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // For now, just add a message indicating image upload
      const message = `[Uploaded image: ${file.name}] Please help me find similar items to this image.`;
      onSendMessage(message);
      e.target.value = ''; // Reset file input
    }
  };

  return (
    <div className="border-t bg-white">
      {/* Quick Suggestions */}
      {quickSuggestions.length > 0 && !userInput && (
        <QuickSuggestions
          suggestions={quickSuggestions}
          onSuggestionClick={handleQuickSuggestionClick}
        />
      )}

      {/* Main Input Area */}
      <div className="px-4 py-4">
        <div className="relative">
          {/* Autocomplete Suggestions */}
          <SmartAutocomplete
            query={userInput}
            onSuggestionSelect={handleSuggestionSelect}
            isVisible={showAutocomplete}
          />

          <div className="flex gap-3 items-end">
            {/* Left side buttons */}
            <div className="flex items-center gap-2">
              {/* File Upload */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isLoading}
                />
                <div className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                  <Camera size={18} />
                </div>
              </label>

              {/* Voice Input */}
              <VoiceInput
                onTranscript={(transcript) => setUserInput(transcript)}
                isListening={isListening}
                onToggleListening={handleVoiceToggle}
              />
            </div>
            
            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={userInput}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                onFocus={() => setShowAutocomplete(userInput.length > 1)}
                onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                placeholder={
                  isListening 
                    ? "Listening... Speak now" 
                    : "Ask me about fashion, search for products, or get style advice..."
                }
                disabled={isLoading}
                className={`w-full px-4 py-3 pr-12 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 ${
                  isListening ? 'ring-2 ring-red-500 border-red-300' : ''
                }`}
                rows="1"
                style={{ maxHeight: '120px' }}
              />
              
              {/* Character count for long messages */}
              {userInput.length > 200 && (
                <div className="absolute bottom-1 right-14 text-xs text-gray-400">
                  {userInput.length}/500
                </div>
              )}

              {/* Voice recording indicator */}
              {isListening && (
                <div className="absolute top-1/2 right-3 transform -translate-y-1/2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-600">Recording</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Send Button */}
            <button
              onClick={handleSubmit}
              disabled={!userInput.trim() || isLoading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-3 rounded-2xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center min-w-12 group"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={20} className="group-hover:translate-x-0.5 transition-transform" />
              )}
            </button>
          </div>

          {/* Enhanced Status Bar */}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>
                Press Enter to send, Shift+Enter for new line
              </span>
              {recognition && (
                <span className="flex items-center gap-1">
                  <Mic size={10} />
                  Voice input available
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* API Status */}
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>AI Ready</span>
              </div>
              
              {/* Typing indicator for long messages */}
              {userInput.length > 50 && (
                <span className="text-blue-600">
                  Rich response mode
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Action Bar */}
      {userInput.length === 0 && !isLoading && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Search size={10} />
              <span>Search products</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <TrendingUp size={10} />
              <span>Get trends</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Zap size={10} />
              <span>Style advice</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Camera size={10} />
              <span>Image search</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading State Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-md">
            <Loader2 size={20} className="animate-spin text-blue-600" />
            <div className="text-sm">
              <div className="font-medium text-gray-800">Processing your request</div>
              <div className="text-gray-500">Searching products and generating response...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserInput;