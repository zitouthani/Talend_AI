import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ChatAgent } from './components/ChatAgent';

export default function App() {
  const [resetKey, setResetChatKey] = useState(0);

  const handleResetChat = () => {
    setResetChatKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#212121] text-zinc-100 font-sans antialiased selection:bg-zinc-700 selection:text-white">
      <Navbar onResetChat={handleResetChat} />
      <main>
        <ChatAgent key={resetKey} />
      </main>
    </div>
  );
}

