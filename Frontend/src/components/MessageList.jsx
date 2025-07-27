import React, { useRef, useEffect } from 'react';
import { Bot, Loader2 } from 'lucide-react';
import Message from './Message';
import useChatStore from '../store/chatStore';

const MessageList = () => {
  const messagesEndRef = useRef(null);
  const { messages, isLoading } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <Bot size={48} className="text-gray-300 mb-4" />
          <h3 className="text-xl font-medium mb-2">Welcome to AI Chat</h3>
          <p className="text-center max-w-md">
            Start a conversation with our AI assistant. Ask questions, get help, or just have a friendly chat!
          </p>
        </div>
      ) : (
        <>
          {messages.map((msg, index) => (
            <Message
              key={msg.id || index}
              message={msg.content}
              isUser={msg.isUser}
              timestamp={msg.timestamp}
            />
          ))}
          
          {isLoading && (
            <div className="flex gap-3 mb-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-gray-600" />
                  <span className="text-sm text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;