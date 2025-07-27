import React from 'react';
import { Bot, User } from 'lucide-react';

const Message = ({ message, isUser, timestamp }) => {
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <Bot size={16} className="text-white" />
        </div>
      )}
      
      <div className={`max-w-[70%] ${isUser ? 'order-1' : 'order-2'}`}>
        <div className={`px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
        {timestamp && (
          <p className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTime(timestamp)}
          </p>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center flex-shrink-0 order-2">
          <User size={16} className="text-white" />
        </div>
      )}
    </div>
  );
};

export default Message;