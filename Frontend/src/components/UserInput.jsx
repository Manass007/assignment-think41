import React, { useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import useChatStore from '../store/chatStore';

const UserInput = ({ onSendMessage }) => {
  const textareaRef = useRef(null);
  const { userInput, setUserInput, clearUserInput, isLoading } = useChatStore();

  const handleSubmit = () => {
    if (userInput.trim() && !isLoading) {
      onSendMessage(userInput.trim());
      clearUserInput();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  // Focus input when loading finishes
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  return (
    <div className="border-t bg-white px-4 py-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            disabled={isLoading}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
            rows="1"
            style={{ maxHeight: '120px' }}
          />
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!userInput.trim() || isLoading}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-3 rounded-2xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center min-w-12"
        >
          {isLoading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Send size={20} />
          )}
        </button>
      </div>
    </div>
  );
};

export default UserInput;