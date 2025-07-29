import React, { useState } from 'react';
import apiService from '../services/apiService';

const TestPage = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    try {
      addLog('🧪 Starting API Service Tests...', 'info');
      
      // Test 1: Authentication
      addLog('1. Testing authentication...', 'info');
      const authResult = await apiService.authenticate('lancelord', 'Hype123@'); // Replace with your credentials
      addLog('✅ Authentication successful!', 'success');
      addLog(`Access Token: ${authResult.accessToken ? '✓' : '✗'}`, 'info');
      addLog(`Refresh Token: ${authResult.refreshToken ? '✓' : '✗'}`, 'info');
      
      // Test 2: Send message
      addLog('2. Testing chat message...', 'info');
      const chatResult = await apiService.sendChatMessage('Hello, this is a test message from React!');
      addLog('✅ Chat message sent successfully!', 'success');
      addLog(`Conversation ID: ${chatResult.conversationId}`, 'info');
      addLog(`User Message ID: ${chatResult.userMessage.id}`, 'info');
      addLog(`AI Message ID: ${chatResult.aiMessage.id}`, 'info');
      addLog(`AI Response: "${chatResult.aiMessage.content.substring(0, 100)}..."`, 'info');
      
      addLog('🎉 All tests completed successfully!', 'success');
      
    } catch (error) {
      addLog(`❌ Test failed: ${error.message}`, 'error');
      console.error('Full error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return '#28a745';
      case 'error': return '#dc3545';
      case 'info': return '#17a2b8';
      default: return '#495057';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 API Service Tester</h1>
      <p>Test your backend integration before using it in the chat app.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runTests} 
          disabled={isLoading}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isLoading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isLoading ? '🔄 Running Tests...' : '▶️ Run API Tests'}
        </button>
        
        <button 
          onClick={clearLogs}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🗑️ Clear Logs
        </button>
      </div>

      <div style={{
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '20px',
        minHeight: '300px',
        maxHeight: '500px',
        overflowY: 'auto',
        backgroundColor: '#f8f9fa',
        fontFamily: 'Consolas, monospace',
        fontSize: '14px'
      }}>
        {testResults.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6c757d', fontStyle: 'italic' }}>
            No test results yet. Click "Run API Tests" to start.
          </div>
        ) : (
          testResults.map((log, index) => (
            <div 
              key={index} 
              style={{
                marginBottom: '8px',
                padding: '4px 0',
                borderBottom: index < testResults.length - 1 ? '1px solid #e9ecef' : 'none'
              }}
            >
              <span style={{ color: '#6c757d', fontSize: '12px' }}>
                [{log.timestamp}]
              </span>{' '}
              <span style={{ color: getLogColor(log.type) }}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TestPage;