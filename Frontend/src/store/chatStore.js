import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useChatStore = create(
  devtools(
    (set, get) => ({
      // Current conversation state
      messages: [],
      isLoading: false,
      userInput: '',
      error: null,
      currentConversationId: null,
      
      // Conversations management
      conversations: [], // Array of past conversations
      isSidebarOpen: true, // Sidebar visibility
      
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
          id: Date.now() + Math.random(),
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
      
      // Clear current conversation messages
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
      
      // Sidebar management
      toggleSidebar: () =>
        set(
          (state) => ({ isSidebarOpen: !state.isSidebarOpen }),
          false,
          'toggleSidebar'
        ),
      
      setSidebarOpen: (open) =>
        set(
          { isSidebarOpen: open },
          false,
          'setSidebarOpen'
        ),
      
      // Create new conversation
      createNewConversation: () => {
        const { messages, currentConversationId, saveCurrentConversation } = get();
        
        // Save current conversation if it has messages
        if (messages.length > 0 && currentConversationId) {
          saveCurrentConversation();
        }
        
        // Create new conversation
        const newConversationId = `conv_${Date.now()}`;
        
        set(
          {
            currentConversationId: newConversationId,
            messages: [],
            error: null,
          },
          false,
          'createNewConversation'
        );
        
        return newConversationId;
      },
      
      // Save current conversation to conversations list
      saveCurrentConversation: () => {
        const { messages, currentConversationId, conversations } = get();
        
        if (!currentConversationId || messages.length === 0) return;
        
        // Generate conversation title from first user message
        const firstUserMessage = messages.find(msg => msg.isUser);
        const title = firstUserMessage 
          ? firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
          : 'New Conversation';
        
        const conversationToSave = {
          id: currentConversationId,
          title,
          messages: [...messages],
          lastUpdated: new Date(),
          messageCount: messages.length,
        };
        
        // Update existing conversation or add new one
        const existingIndex = conversations.findIndex(conv => conv.id === currentConversationId);
        
        let updatedConversations;
        if (existingIndex >= 0) {
          updatedConversations = [...conversations];
          updatedConversations[existingIndex] = conversationToSave;
        } else {
          updatedConversations = [conversationToSave, ...conversations];
        }
        
        set(
          { conversations: updatedConversations },
          false,
          'saveCurrentConversation'
        );
      },
      
      // Load conversation from history
      loadConversation: (conversationId) => {
        const { conversations, saveCurrentConversation, currentConversationId, messages } = get();
        
        // Save current conversation before switching
        if (currentConversationId && messages.length > 0) {
          saveCurrentConversation();
        }
        
        const conversation = conversations.find(conv => conv.id === conversationId);
        
        if (conversation) {
          set(
            {
              currentConversationId: conversationId,
              messages: [...conversation.messages],
              error: null,
            },
            false,
            'loadConversation'
          );
        }
      },
      
      // Delete conversation
      deleteConversation: (conversationId) => {
        const { conversations, currentConversationId } = get();
        
        const updatedConversations = conversations.filter(conv => conv.id !== conversationId);
        
        // If deleting current conversation, create new one
        const updates = { conversations: updatedConversations };
        if (currentConversationId === conversationId) {
          updates.currentConversationId = null;
          updates.messages = [];
        }
        
        set(updates, false, 'deleteConversation');
      },
      
      // Complex action: Send message with conversation handling
      sendMessage: async (messageContent, apiCall) => {
        const { 
          addUserMessage, 
          setLoading, 
          addAIMessage, 
          setError, 
          clearError,
          currentConversationId,
          createNewConversation,
          saveCurrentConversation
        } = get();
        
        // Create new conversation if none exists
        if (!currentConversationId) {
          createNewConversation();
        }
        
        // Clear any previous errors
        clearError();
        
        // Add user message
        addUserMessage(messageContent);
        
        // Set loading state
        setLoading(true);
        
        try {
          // Call API
          const aiResponse = await apiCall(messageContent);
          
          // Add AI response
          addAIMessage(aiResponse);
          
          // Save conversation after successful exchange
          setTimeout(() => saveCurrentConversation(), 100);
          
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
      
      getConversationsCount: () => {
        const { conversations } = get();
        return conversations.length;
      },
      
      getCurrentConversation: () => {
        const { conversations, currentConversationId } = get();
        return conversations.find(conv => conv.id === currentConversationId) || null;
      },
    }),
    {
      name: 'chat-store',
    }
  )
);

export default useChatStore;