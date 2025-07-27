import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useChatStore = create(
  devtools(
    (set, get) => ({
      // Message list state
      messages: [],
      
      // Loading status indicator
      isLoading: false,
      
      // User input value
      userInput: '',
      
      // Additional useful states
      error: null,
      currentConversationId: null,
      
      // Actions for message management
      addMessage: (message) =>
        set(
          (state) => ({
            messages: [...state.messages, message],
          }),
          false,
          'addMessage'
        ),
      
      addUserMessage: (content) => {
        const userMessage = {
          id: Date.now(),
          content,
          isUser: true,
          timestamp: new Date(),
        };
        
        set(
          (state) => ({
            messages: [...state.messages, userMessage],
          }),
          false,
          'addUserMessage'
        );
        
        return userMessage;
      },
      
      addAIMessage: (content) => {
        const aiMessage = {
          id: Date.now() + Math.random(), // Ensure unique ID
          content,
          isUser: false,
          timestamp: new Date(),
        };
        
        set(
          (state) => ({
            messages: [...state.messages, aiMessage],
          }),
          false,
          'addAIMessage'
        );
        
        return aiMessage;
      },
      
      // Clear all messages
      clearMessages: () =>
        set(
          { messages: [] },
          false,
          'clearMessages'
        ),
      
      // Loading status actions
      setLoading: (loading) =>
        set(
          { isLoading: loading },
          false,
          'setLoading'
        ),
      
      // User input actions
      setUserInput: (input) =>
        set(
          { userInput: input },
          false,
          'setUserInput'
        ),
      
      clearUserInput: () =>
        set(
          { userInput: '' },
          false,
          'clearUserInput'
        ),
      
      // Error handling
      setError: (error) =>
        set(
          { error },
          false,
          'setError'
        ),
      
      clearError: () =>
        set(
          { error: null },
          false,
          'clearError'
        ),
      
      // Conversation management
      setConversationId: (id) =>
        set(
          { currentConversationId: id },
          false,
          'setConversationId'
        ),
      
      // Complex action: Send message (handles both user and AI response)
      sendMessage: async (messageContent, apiCall) => {
        const { addUserMessage, setLoading, addAIMessage, setError, clearError } = get();
        
        // Clear any previous errors
        clearError();
        
        // Add user message
        addUserMessage(messageContent);
        
        // Set loading state
        setLoading(true);
        
        try {
          // Call API (passed as parameter for flexibility)
          const aiResponse = await apiCall(messageContent);
          
          // Add AI response
          addAIMessage(aiResponse);
          
        } catch (error) {
          console.error('Error sending message:', error);
          setError(error.message || 'Failed to send message');
          
          // Add error message to chat
          addAIMessage("Sorry, I'm having trouble connecting right now. Please try again.");
          
        } finally {
          setLoading(false);
        }
      },
      
      // Computed values (selectors)
      getLastMessage: () => {
        const { messages } = get();
        return messages[messages.length - 1] || null;
      },
      
      getMessagesCount: () => {
        const { messages } = get();
        return messages.length;
      },
      
      getUserMessages: () => {
        const { messages } = get();
        return messages.filter(msg => msg.isUser);
      },
      
      getAIMessages: () => {
        const { messages } = get();
        return messages.filter(msg => !msg.isUser);
      },
    }),
    {
      name: 'chat-store', // unique name for devtools
    }
  )
);

export default useChatStore;