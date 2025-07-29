// Enhanced API Service for Fashion E-commerce Chat
// Updated to work with all backend endpoints

class FashionApiService {
  constructor() {
    this.baseUrl = 'http://localhost:8000';
    this.accessToken = null;
    this.refreshToken = null;
    this.loadTokens();
  }

  // Token management with memory storage (compatible with Claude artifacts)
  saveTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    // Try localStorage if available (works in your local environment)
    try {
      if (typeof Storage !== 'undefined' && localStorage) {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
      }
    } catch (error) {
      console.warn('localStorage not available, using memory storage');
    }
  }

  loadTokens() {
    try {
      if (typeof Storage !== 'undefined' && localStorage) {
        this.accessToken = localStorage.getItem('access_token');
        this.refreshToken = localStorage.getItem('refresh_token');
      }
    } catch (error) {
      console.warn('Could not load tokens from localStorage');
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    
    try {
      if (typeof Storage !== 'undefined' && localStorage) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    } catch (error) {
      console.warn('Could not clear tokens from localStorage');
    }
  }

  isAuthenticated() {
    return !!this.accessToken;
  }

  // Authentication methods
  async authenticate(username, password) {
    const response = await fetch(`${this.baseUrl}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Authentication failed');
    }

    const data = await response.json();
    this.saveTokens(data.access, data.refresh);
    
    console.log('✅ Authentication successful');
    return { success: true, accessToken: data.access, refreshToken: data.refresh };
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/api/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: this.refreshToken })
    });

    if (!response.ok) {
      this.clearTokens();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.saveTokens(data.access, this.refreshToken);
    console.log('🔄 Token refreshed successfully');
    return data.access;
  }

  // Helper method for authenticated requests
  async makeAuthenticatedRequest(url, options = {}, retryCount = 0) {
    if (!this.isAuthenticated()) {
      throw new Error('Please login first');
    }

    const requestOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        ...options.headers
      }
    };

    try {
      console.log(`🔄 Making request to: ${url}`);
      const response = await fetch(url, requestOptions);

      // Handle token expiry
      if (response.status === 401 && retryCount < 1) {
        console.log('🔄 Token expired, refreshing...');
        await this.refreshAccessToken();
        requestOptions.headers['Authorization'] = `Bearer ${this.accessToken}`;
        return this.makeAuthenticatedRequest(url, options, retryCount + 1);
      }

      if (!response.ok) {
        const error = await response.json();
        console.error(`❌ API Error (${response.status}):`, error);
        throw new Error(error.detail || error.message || `API Error: ${response.status}`);
      }

      console.log(`✅ Request successful: ${url}`);
      return response;
    } catch (error) {
      if (error.message.includes('login') || error.message.includes('Token refresh failed')) {
        this.clearTokens();
      }
      console.error('❌ Request failed:', error.message);
      throw error;
    }
  }

  // ========== CHAT FUNCTIONALITY ==========
  async sendChatMessage(messageText, conversationId = null) {
    console.log(`💬 Sending message: "${messageText.substring(0, 50)}..."`);
    
    const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/chat/`, {
      method: 'POST',
      body: JSON.stringify({
        text: messageText,
        conversation_id: conversationId
      })
    });

    const data = await response.json();
    
    console.log('✅ Chat response received');
    return {
      conversationId: data.conversation_id,
      userMessage: {
        id: data.user_message.id,
        content: data.user_message.text,
        isUser: true,
        timestamp: new Date(data.user_message.timestamp),
      },
      aiMessage: {
        id: data.ai_message.id,
        content: data.ai_message.text,
        isUser: false,
        timestamp: new Date(data.ai_message.timestamp),
      },
      userContext: data.user_context,
      products: data.products || []
    };
  }

  // ========== PRODUCT SEARCH FUNCTIONALITY ==========
  async searchProducts(params = {}) {
    console.log('🔍 Searching products with params:', params);
    
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const url = `${this.baseUrl}/api/products/search/?${queryParams.toString()}`;
    const response = await this.makeAuthenticatedRequest(url);
    
    const data = await response.json();
    console.log(`✅ Found ${data.total_count} products`);
    return data;
  }

  // Advanced product search with POST body
  async advancedProductSearch(searchData) {
    console.log('🔍 Advanced product search with data:', searchData);
    
    const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/products/search/`, {
      method: 'POST',
      body: JSON.stringify(searchData)
    });
    
    const data = await response.json();
    console.log(`✅ Advanced search found ${data.total_count} products`);
    return data;
  }

  // ========== TRENDING PRODUCTS ==========
  async getTrendingProducts(params = {}) {
    console.log('📈 Getting trending products with params:', params);
    
    const queryParams = new URLSearchParams();
    
    if (params.category) queryParams.append('category', params.category);
    if (params.timeframe) queryParams.append('timeframe', params.timeframe);
    if (params.limit) queryParams.append('limit', params.limit);

    const url = `${this.baseUrl}/api/products/trending/?${queryParams.toString()}`;
    const response = await this.makeAuthenticatedRequest(url);
    
    const data = await response.json();
    console.log(`✅ Found ${data.total_trending} trending products`);
    return data;
  }

  // ========== USER PREFERENCES & RECOMMENDATIONS ==========
  async getUserPreferences() {
    console.log('👤 Getting user preferences...');
    
    const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/user/preferences/`);
    const data = await response.json();
    
    console.log('✅ User preferences loaded');
    return data;
  }

  async updateUserPreferences(preferences) {
    console.log('👤 Updating user preferences:', preferences);
    
    const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/user/preferences/`, {
      method: 'POST',
      body: JSON.stringify(preferences)
    });
    
    const data = await response.json();
    console.log('✅ User preferences updated');
    return data;
  }

  // ========== CONVERSATION MANAGEMENT ==========
  async getConversationHistory() {
    console.log('💬 Loading conversation history...');
    
    const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/conversations/`);
    const data = await response.json();
    
    console.log(`✅ Loaded ${data.total_count} conversations`);
    return data;
  }

  async getConversationDetails(conversationId) {
    console.log(`💬 Loading conversation ${conversationId}...`);
    
    const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/conversations/${conversationId}/`);
    const data = await response.json();
    
    console.log('✅ Conversation details loaded');
    return data;
  }

  async deleteConversation(conversationId) {
    console.log(`🗑️ Deleting conversation ${conversationId}...`);
    
    const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/conversations/${conversationId}/`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    console.log('✅ Conversation deleted');
    return data;
  }

  // ========== HELPER METHODS FOR FRONTEND ==========
  async getProductCategories() {
    console.log('📂 Getting product categories...');
    
    try {
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/products/search/?limit=0`);
      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.warn('Could not fetch categories:', error);
      return ['Tops & Tees', 'Jeans', 'Dresses', 'Accessories', 'Active', 'Sweaters'];
    }
  }

  // Quick search for autocomplete
  async quickSearch(query, limit = 5) {
    if (!query || query.length < 2) return [];
    
    try {
      console.log(`🔍 Quick search: "${query}"`);
      const response = await this.makeAuthenticatedRequest(
        `${this.baseUrl}/api/products/search/?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      const data = await response.json();
      return data.products || [];
    } catch (error) {
      console.warn('Quick search failed:', error);
      return [];
    }
  }

  // Get popular brands
  async getPopularBrands() {
    try {
      console.log('🏷️ Getting popular brands...');
      const response = await this.makeAuthenticatedRequest(`${this.baseUrl}/api/products/search/?limit=0`);
      const data = await response.json();
      
      return data.popular_brands || [
        'Calvin Klein', 'Levi\'s', 'Tommy Hilfiger', 'Columbia', 
        'Champion', 'Hanes', 'Nautica', 'Carhartt'
      ];
    } catch (error) {
      console.warn('Could not fetch popular brands:', error);
      return ['Calvin Klein', 'Levi\'s', 'Tommy Hilfiger', 'Columbia'];
    }
  }

  // ========== FASHION-SPECIFIC HELPER METHODS ==========
  async getSeasonalRecommendations(season = null) {
    console.log(`🌞 Getting seasonal recommendations for: ${season || 'current season'}`);
    
    const params = { category: 'seasonal' };
    if (season) params.season = season;
    
    return this.searchProducts(params);
  }

  async getOutfitSuggestions(productId) {
    console.log(`👗 Getting outfit suggestions for product: ${productId}`);
    
    try {
      const response = await this.makeAuthenticatedRequest(
        `${this.baseUrl}/api/products/outfit-suggestions/?product_id=${productId}`
      );
      return response.json();
    } catch (error) {
      console.warn('Outfit suggestions not available:', error);
      // Fallback to complementary products
      return { suggestions: [], message: 'Outfit suggestions coming soon!' };
    }
  }

  // ========== PRODUCT DETAILS & INVENTORY ==========
  async checkProductAvailability(productId) {
    console.log(`📦 Checking availability for product: ${productId}`);
    
    try {
      const response = await this.makeAuthenticatedRequest(
        `${this.baseUrl}/api/products/${productId}/availability/`
      );
      return response.json();
    } catch (error) {
      console.warn('Could not check availability:', error);
      return { available: true, message: 'Check availability at checkout' };
    }
  }

  async getPriceHistory(productId, days = 30) {
    console.log(`💰 Getting price history for product: ${productId}`);
    
    try {
      const response = await this.makeAuthenticatedRequest(
        `${this.baseUrl}/api/products/${productId}/price-history/?days=${days}`
      );
      return response.json();
    } catch (error) {
      console.warn('Price history not available:', error);
      return { history: [], message: 'Price history not available' };
    }
  }

  // ========== BATCH OPERATIONS ==========
  async batchRequest(requests) {
    console.log(`📦 Executing ${requests.length} batch requests...`);
    
    const results = await Promise.allSettled(
      requests.map(request => this.makeAuthenticatedRequest(request.url, request.options))
    );
    
    return results.map((result, index) => ({
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
      originalRequest: requests[index]
    }));
  }

  // ========== TESTING METHODS ==========
  async testAllEndpoints() {
    console.log('🧪 Testing all API endpoints...');
    
    const tests = [
      { name: 'Chat', fn: () => this.sendChatMessage('Hello!') },
      { name: 'Product Search', fn: () => this.searchProducts({ category: 'Jeans', limit: 3 }) },
      { name: 'Trending Products', fn: () => this.getTrendingProducts({ limit: 3 }) },
      { name: 'User Preferences', fn: () => this.getUserPreferences() },
      { name: 'Conversation History', fn: () => this.getConversationHistory() },
    ];

    const results = {};
    
    for (const test of tests) {
      try {
        console.log(`Testing ${test.name}...`);
        const result = await test.fn();
        results[test.name] = { success: true, data: result };
        console.log(`✅ ${test.name} passed`);
      } catch (error) {
        results[test.name] = { success: false, error: error.message };
        console.log(`❌ ${test.name} failed:`, error.message);
      }
    }
    
    return results;
  }

  // ========== LOGOUT ==========
  logout() {
    console.log('👋 Logging out...');
    this.clearTokens();
    return { success: true };
  }

  // ========== DEBUG METHODS ==========
  getStatus() {
    return {
      isAuthenticated: this.isAuthenticated(),
      hasTokens: !!(this.accessToken && this.refreshToken),
      baseUrl: this.baseUrl,
      tokenLength: this.accessToken ? this.accessToken.length : 0
    };
  }

  // Log current status
  logStatus() {
    const status = this.getStatus();
    console.log('📊 API Service Status:', status);
    return status;
  }
}

// Create singleton instance
const apiService = new FashionApiService();

// Add global debugging helper
if (typeof window !== 'undefined') {
  window.apiService = apiService;
  window.testAPI = () => apiService.testAllEndpoints();
}

export default apiService;