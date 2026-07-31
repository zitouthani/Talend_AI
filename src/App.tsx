import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ChatAgent } from './components/ChatAgent';

export default function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [newChatTrigger, setNewChatTrigger] = useState(0);

  const handleNewChat = () => {
    setNewChatTrigger(prev => prev + 1);
  };

  const handleToggleHistory = () => {
    setIsHistoryOpen(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-[#212121] text-zinc-100 font-sans antialiased selection:bg-zinc-700 selection:text-white flex flex-col h-screen overflow-hidden">
      <Navbar 
        onNewChat={handleNewChat}
        onToggleHistory={handleToggleHistory}
        isHistoryOpen={isHistoryOpen}
      />
      <main className="flex-1 flex overflow-hidden relative">
        <ChatAgent 
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={setIsHistoryOpen}
          newChatTrigger={newChatTrigger}
        />
      </main>
    </div>
  );
}

