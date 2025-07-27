import React, { useEffect } from 'react';
import { Bot, Menu } from 'lucide-react';
import MessageList from './MessageList';
import UserInput from './UserInput';
import ConversationSidebar from './ConversationSidebar';
import useChatStore from '../store/chatStore';

const ChatWindow = () => {
  const { 
    sendMessage,
    createNewConversation,
    currentConversationId,
    error,
    clearError,
    isSidebarOpen,
    toggleSidebar,
    saveCurrentConversation,
    messages
  } = useChatStore();

  // Initialize with a new conversation on first load
  useEffect(() => {
    if (!currentConversationId) {
      createNewConversation();
    }
  }, [currentConversationId, createNewConversation]);

  // Save conversation periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (messages.length > 0) {
        saveCurrentConversation();
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [messages.length, saveCurrentConversation]);

  // API call function
  const sendMessageToAPI = async (message) => {
    try {
      // Replace with your actual backend API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversationId: currentConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      throw new Error(error.message || 'Failed to send message');
    }
  };

  const handleSendMessage = async (messageContent) => {
    await sendMessage(messageContent, sendMessageToAPI);
  };

  const handleNewChat = () => {
    createNewConversation();
  };

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
            {/* Mobile menu button - only visible on mobile */}
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
              <h1 className="text-xl font-semibold text-gray-800">AI Assistant</h1>
              <p className="text-sm text-gray-500">
                {currentConversationId ? 'Active conversation' : 'Ready to chat'}
              </p>
            </div>
          </div>
          
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            New Chat
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <MessageList />

        {/* Input */}
        <UserInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
};

export default ChatWindow;