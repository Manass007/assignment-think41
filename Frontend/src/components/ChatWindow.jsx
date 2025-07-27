import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import MessageList from './MessageList';
import UserInput from './UserInput';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to communicate with your backend
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
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      return data.response; // Adjust based on your API response structure
    } catch (error) {
      console.error('Error sending message:', error);
      return "Sorry, I'm having trouble connecting right now. Please try again.";
    }
  };

  const handleSendMessage = async (messageContent) => {
    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      content: messageContent,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Call your backend API
      const aiResponse = await sendMessageToAPI(messageContent);
      
      // Add AI response
      const aiMessage = {
        id: Date.now() + 1,
        content: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      // Handle error case
      const errorMessage = {
        id: Date.now() + 1,
        content: "Sorry, something went wrong. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-800">AI Assistant</h1>
          <p className="text-sm text-gray-500">Always here to help</p>
        </div>
      </div>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <UserInput onSendMessage={handleSendMessage} disabled={isLoading} />
    </div>
  );
};

export default ChatWindow;