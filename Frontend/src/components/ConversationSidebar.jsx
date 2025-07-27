import React from 'react';
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Clock, 
  ChevronLeft,
  ChevronRight 
} from 'lucide-react';
import useChatStore from '../store/chatStore';

const ConversationSidebar = () => {
  const {
    conversations,
    currentConversationId,
    isSidebarOpen,
    toggleSidebar,
    createNewConversation,
    loadConversation,
    deleteConversation,
  } = useChatStore();

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

  const handleDeleteConversation = (e, conversationId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      deleteConversation(conversationId);
    }
  };

  return (
    <>
      {/* Sidebar Toggle Button - Positioned to avoid header overlap */}
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
            <span className="text-sm text-gray-500">
              {conversations.length} total
            </span>
          </div>
          
          {/* New Conversation Button */}
          <button
            onClick={createNewConversation}
            className="w-full flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <Plus size={16} />
            New Conversation
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs">Start chatting to see your history here</p>
            </div>
          ) : (
            <div className="p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => loadConversation(conversation.id)}
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
                    
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteConversation(e, conversation.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all duration-200"
                      title="Delete conversation"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
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