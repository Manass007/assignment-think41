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
      currentConversationId: null, // Now maps to backend conversation_id
      
      // Conversations management
      conversations: [], // Array of past conversations
      isSidebarOpen: true, // Sidebar visibility
      
      // Authentication state (if you want to manage it in store)
      isAuthenticated: false,
      user: null,
      
      // Actions for message management
      addMessage: (message) =>
        set(
          (state) => ({
            messages: [...state.messages, message],
          }),
          false,
          'addMessage'
        ),
      
      // Updated to handle backend message format
      addUserMessage: (content, messageId = null) => {
        const userMessage = {
          id: messageId || `user_${Date.now()}`,
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
      
      // Updated to handle backend message format
      addAIMessage: (content, messageId = null) => {
        const aiMessage = {
          id: messageId || `ai_${Date.now()}_${Math.random()}`,
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
      
      // Add both user and AI messages from API response
      addMessagePair: (userMessage, aiMessage) => {
        const userMsg = {
          id: userMessage.id,
          content: userMessage.content,
          isUser: true,
          timestamp: new Date(userMessage.timestamp),
        };
        
        const aiMsg = {
          id: aiMessage.id,
          content: aiMessage.content,
          isUser: false,
          timestamp: new Date(aiMessage.timestamp),
        };
        
        set(
          (state) => ({
            messages: [...state.messages, userMsg, aiMsg],
          }),
          false,
          'addMessagePair'
        );
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
      
      // Conversation management - updated for backend integration
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
      
      // Authentication actions
      setAuthenticated: (authenticated) =>
        set(
          { isAuthenticated: authenticated },
          false,
          'setAuthenticated'
        ),
      
      setUser: (user) =>
        set(
          { user },
          false,
          'setUser'
        ),
      
      logout: () =>
        set(
          {
            isAuthenticated: false,
            user: null,
            currentConversationId: null,
            messages: [],
            conversations: [],
            error: null,
          },
          false,
          'logout'
        ),
      
      // Create new conversation - simplified since backend handles this
      createNewConversation: () => {
        const { messages, currentConversationId, saveCurrentConversation } = get();
        
        // Save current conversation if it has messages
        if (messages.length > 0 && currentConversationId) {
          saveCurrentConversation();
        }
        
        // Clear current state - backend will assign new conversation ID on first message
        set(
          {
            currentConversationId: null,
            messages: [],
            error: null,
          },
          false,
          'createNewConversation'
        );
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
        
        // Persist to localStorage if available
        try {
          if (typeof Storage !== 'undefined' && localStorage) {
            localStorage.setItem('chat_conversations', JSON.stringify(updatedConversations));
          }
        } catch (error) {
          console.warn('Could not save conversations to localStorage:', error);
        }
      },
      
      // Load conversations from localStorage
      loadSavedConversations: () => {
        try {
          if (typeof Storage !== 'undefined' && localStorage) {
            const saved = localStorage.getItem('chat_conversations');
            if (saved) {
              const conversations = JSON.parse(saved);
              set({ conversations }, false, 'loadSavedConversations');
            }
          }
        } catch (error) {
          console.warn('Could not load conversations from localStorage:', error);
        }
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
        
        // Update localStorage
        try {
          if (typeof Storage !== 'undefined' && localStorage) {
            localStorage.setItem('chat_conversations', JSON.stringify(updatedConversations));
          }
        } catch (error) {
          console.warn('Could not update localStorage:', error);
        }
      },
      
      // Enhanced sendMessage function for backend integration
      sendMessage: async (messageContent, apiCall) => {
        const { 
          addUserMessage, 
          setLoading, 
          addAIMessage, 
          setError, 
          clearError,
          currentConversationId,
          setConversationId,
          saveCurrentConversation
        } = get();
        
        // Clear any previous errors
        clearError();
        
        // Add user message immediately for better UX
        const tempUserMessage = addUserMessage(messageContent);
        
        // Set loading state
        setLoading(true);
        
        try {
          // Call the API - this should return the backend response format
          const response = await apiCall(messageContent);
          
          // Handle different response formats
          if (response.conversationId && response.userMessage && response.aiMessage) {
            // Full backend response format
            
            // Update conversation ID if it's new
            if (response.conversationId !== currentConversationId) {
              setConversationId(response.conversationId);
            }
            
            // Replace the temporary user message with the real one from backend
            set(
              (state) => ({
                messages: [
                  ...state.messages.filter(msg => msg.id !== tempUserMessage.id),
                  {
                    id: response.userMessage.id,
                    content: response.userMessage.content,
                    isUser: true,
                    timestamp: response.userMessage.timestamp,
                  },
                  {
                    id: response.aiMessage.id,
                    content: response.aiMessage.content,
                    isUser: false,
                    timestamp: response.aiMessage.timestamp,
                  }
                ],
              }),
              false,
              'updateMessagesFromAPI'
            );
          } else if (typeof response === 'string') {
            // Simple string response (fallback)
            addAIMessage(response);
          } else {
            // Unknown response format
            addAIMessage("I received your message but couldn't process the response properly.");
          }
          
          // Save conversation after successful exchange
          setTimeout(() => saveCurrentConversation(), 100);
          
        } catch (error) {
          console.error('Error sending message:', error);
          
          // Remove the temporary user message on error
          set(
            (state) => ({
              messages: state.messages.filter(msg => msg.id !== tempUserMessage.id),
            }),
            false,
            'removeFailedMessage'
          );
          
          setError(error.message || 'Failed to send message');
          
          // Add error message to chat
          addAIMessage("Sorry, I'm having trouble connecting right now. Please try again.");
          
        } finally {
          setLoading(false);
        }
      },
      
      // Simpler version for when you just want to add messages manually
      addManualMessages: (userContent, aiContent, conversationId = null) => {
        const { setConversationId, currentConversationId } = get();
        
        if (conversationId && conversationId !== currentConversationId) {
          setConversationId(conversationId);
        }
        
        const userMessage = {
          id: `manual_user_${Date.now()}`,
          content: userContent,
          isUser: true,
          timestamp: new Date(),
        };
        
        const aiMessage = {
          id: `manual_ai_${Date.now()}_${Math.random()}`,
          content: aiContent,
          isUser: false,
          timestamp: new Date(),
        };
        
        set(
          (state) => ({
            messages: [...state.messages, userMessage, aiMessage],
          }),
          false,
          'addManualMessages'
        );
      },
      
      // Helper function to format backend messages for display
      formatBackendMessage: (backendMessage) => ({
        id: backendMessage.id,
        content: backendMessage.text,
        isUser: backendMessage.sender === 'user',
        timestamp: new Date(backendMessage.timestamp),
      }),
      
      // Load conversation history from backend (if you implement this endpoint)
      loadConversationFromBackend: async (conversationId, apiCall) => {
        const { setLoading, setError, clearError, setConversationId } = get();
        
        setLoading(true);
        clearError();
        
        try {
          const conversationData = await apiCall(conversationId);
          
          // Assuming backend returns { id, messages: [...] }
          const formattedMessages = conversationData.messages.map(msg => ({
            id: msg.id,
            content: msg.text,
            isUser: msg.sender === 'user',
            timestamp: new Date(msg.timestamp),
          }));
          
          set(
            {
              currentConversationId: conversationId,
              messages: formattedMessages,
            },
            false,
            'loadConversationFromBackend'
          );
          
        } catch (error) {
          console.error('Error loading conversation:', error);
          setError('Failed to load conversation');
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
      
      // Debug helpers
      getState: () => get(),
      
      resetStore: () => {
        set(
          {
            messages: [],
            isLoading: false,
            userInput: '',
            error: null,
            currentConversationId: null,
            conversations: [],
            isSidebarOpen: true,
            isAuthenticated: false,
            user: null,
          },
          false,
          'resetStore'
        );
      },
    }),
    {
      name: 'chat-store',
    }
  )
);

export default useChatStore;