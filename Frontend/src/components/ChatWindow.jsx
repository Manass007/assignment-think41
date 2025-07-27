import React, { useEffect } from 'react';
import { Bot } from 'lucide-react';
import MessageList from './MessageList';
import UserInput from './UserInput';
import useChatStore from '../store/chatStore';

const ChatWindow = () => {
  const { 
    sendMessage, 
    setConversationId, 
    clearMessages,
    error,
    clearError 
  } = useChatStore();

  // Initialize conversation on component mount
  useEffect(() => {
    // You can set a conversation ID here if needed
    // setConversationId(generateConversationId());
  }, [setConversationId]);

  // API call function to pass to sendMessage
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
          // Add any other required fields like user_id, conversation_id, etc.
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response; // Adjust based on your API response structure
    } catch (error) {
      throw new Error(error.message || 'Failed to send message');
    }
  };

  const handleSendMessage = async (messageContent) => {
    await sendMessage(messageContent, sendMessageToAPI);
  };

  const handleClearChat = () => {
    clearMessages();
    clearError();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">AI Assistant</h1>
            <p className="text-sm text-gray-500">Always here to help</p>
          </div>
        </div>
        
        {/* Clear chat button */}
        <button
          onClick={handleClearChat}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          Clear Chat
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
  );
};

export default ChatWindow;