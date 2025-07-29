import React from 'react';
// import TestPage from './pages/TestPage';
import ChatWindow from './components/ChatWindow';
import './App.css';

function App() {
  return (
    <div className="App">
      {/* Show test page first */}
      {/*<TestPage />*/}
      
      {/* Uncomment this when tests pass */}
      <ChatWindow />
    </div>
  );
}

export default App;