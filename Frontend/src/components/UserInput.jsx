import React, { useState, useRef } from 'react';
import { Send, Loader2 } from 'lucide-react';

const UserInput = ({ onSendMessage, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  const handleSubmit = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
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
    setInput(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="border-t bg-white px-4 py-4">
      <div className="flex gap-3 items-end">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
            rows="1"
            style={{ maxHeight: '120px' }}
          />
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || disabled}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 text-white p-3 rounded-2xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center min-w-12"
        >
          {disabled ? (
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