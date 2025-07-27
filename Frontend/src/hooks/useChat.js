import { useCallback } from 'react';
import useChatStore from '../store/chatStore';

export const useChat = () => {
  const store = useChatStore();

  const sendMessage = useCallback(async (messageContent, apiCall) => {
    await store.sendMessage(messageContent, apiCall);
  }, [store]);

  const clearChat = useCallback(() => {
    store.clearMessages();
    store.clearError();
    store.clearUserInput();
  }, [store]);

  return {
    // State
    messages: store.messages,
    isLoading: store.isLoading,
    userInput: store.userInput,
    error: store.error,
    
    // Actions
    sendMessage,
    clearChat,
    setUserInput: store.setUserInput,
    clearError: store.clearError,
    
    // Computed values
    messagesCount: store.getMessagesCount(),
    lastMessage: store.getLastMessage(),
  };
};