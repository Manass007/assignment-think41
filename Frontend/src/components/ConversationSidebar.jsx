import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Clock, 
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Archive,
  Download,
  RefreshCw
} from 'lucide-react';
import useChatStore from '../store/chatStore';
import apiService from '../services/apiService';

const ConversationSidebar = () => {
  const {
    conversations,
    currentConversationId,
    isSidebarOpen,
    toggleSidebar,
    createNewConversation,
    loadConversation,
    deleteConversation,
    isLoading
  } = useChatStore();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);
  const [sortBy, setSortBy] = useState('recent'); // recent, oldest, name
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [error, setError] = useState(null);

  // Load conversations from backend
  const loadConversationsFromBackend = async () => {
    setIsLoadingConversations(true);
    setError(null);
    try {
      const response = await apiService.getConversationHistory();
      
      // Transform backend data to match frontend format
      const transformedConversations = response.conversations?.map(conv => ({
        id: conv.id,
        title: conv.title || `Conversation ${conv.id}`,
        lastUpdated: new Date(conv.updated_at || conv.created_at),
        messageCount: conv.message_count || 0,
        preview: conv.last_message_preview || '',
        createdAt: new Date(conv.created_at)
      })) || [];
      
      // Update conversations directly in the store state
      useChatStore.setState({ conversations: transformedConversations });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Load conversations on component mount
  useEffect(() => {
    if (apiService.isAuthenticated()) {
      loadConversationsFromBackend();
    }
  }, []);

  // Filter and sort conversations
  useEffect(() => {
    let filtered = conversations.filter(conv =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (conv.preview && conv.preview.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Sort conversations
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.lastUpdated) - new Date(a.lastUpdated);
        case 'oldest':
          return new Date(a.lastUpdated) - new Date(b.lastUpdated);
        case 'name':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredConversations(filtered);
  }, [conversations, searchQuery, sortBy]);

  const formatDate = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return messageDate.toLocaleDateString();
  };

  const handleDeleteConversation = async (e, conversationId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        // Delete from backend
        await apiService.deleteConversation(conversationId);
        // Update local state
        deleteConversation(conversationId);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        alert('Conversation could not be deleted');
      }
    }
  };

  const handleLoadConversation = (conversationId) => {
    loadConversation(conversationId);
  };

  const handleExportConversation = (conversationId) => {
    // Export functionality can be implemented here
    console.log('Export conversation:', conversationId);
  };

  const handleDeleteAllVisible = async () => {
    if (window.confirm(`Are you sure you want to delete all ${filteredConversations.length} visible conversations?`)) {
      setIsLoadingConversations(true);
      try {
        // Delete each conversation
        for (const conversation of filteredConversations) {
          try {
            await apiService.deleteConversation(conversation.id);
            deleteConversation(conversation.id);
          } catch (error) {
            console.error(`Failed to delete conversation ${conversation.id}:`, error);
          }
        }
      } catch (error) {
        console.error('Failed to bulk delete conversations:', error);
        alert('Some conversations could not be deleted');
      } finally {
        setIsLoadingConversations(false);
      }
    }
  };

  return (
    <>
      {/* Sidebar Toggle Button */}
      <button
        onClick={toggleSidebar}
        className={`fixed top-20 z-50 p-2 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-all duration-300 ${
          isSidebarOpen ? 'left-80' : ''
        }`}
      >
        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 z-40 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '320px' }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Conversations</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {filteredConversations.length} of {conversations.length}
              </span>
              <button
                onClick={loadConversationsFromBackend}
                disabled={isLoadingConversations}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                title="Refresh conversations"
              >
                <RefreshCw size={16} className={`text-gray-500 ${isLoadingConversations ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={createNewConversation}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
            >
              <Plus size={16} />
              New Chat
            </button>
            
            {filteredConversations.length > 0 && (
              <button
                onClick={handleDeleteAllVisible}
                disabled={isLoadingConversations}
                className="px-3 py-2 text-red-600 border border-red-300 hover:bg-red-50 rounded-lg transition-colors text-sm"
                title="Delete all visible conversations"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 mx-4 mt-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-xs text-red-600 hover:text-red-800 mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="p-4 text-center">
              <RefreshCw size={24} className="animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? (
                <>
                  <Search size={48} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No conversations match "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                  >
                    Clear search
                  </button>
                </>
              ) : conversations.length === 0 ? (
                <>
                  <MessageSquare size={48} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs">Start chatting to see your history here</p>
                </>
              ) : (
                <>
                  <Filter size={48} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No conversations match current filter</p>
                </>
              )}
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => handleLoadConversation(conversation.id)}
                  className={`group relative p-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    currentConversationId === conversation.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-sm truncate ${
                        currentConversationId === conversation.id
                          ? 'text-blue-800'
                          : 'text-gray-800'
                      }`}>
                        {conversation.title}
                      </h3>
                      
                      {/* Preview */}
                      {conversation.preview && (
                        <p className="text-xs text-gray-600 truncate mt-1">
                          {conversation.preview}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500">
                          {formatDate(conversation.lastUpdated)}
                        </span>
                        <span className="text-xs text-gray-400">
                          • {conversation.messageCount} messages
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportConversation(conversation.id);
                        }}
                        className="p-1 hover:bg-blue-100 rounded transition-colors"
                        title="Export conversation"
                      >
                        <Download size={12} className="text-blue-600" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(e, conversation.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Delete conversation"
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Active Indicator */}
                  {currentConversationId === conversation.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Total conversations:</span>
              <span className="font-medium">{conversations.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Storage used:</span>
              <span className="font-medium">
                {(conversations.reduce((acc, conv) => acc + conv.messageCount, 0)).toLocaleString()} messages
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};

export default ConversationSidebar;