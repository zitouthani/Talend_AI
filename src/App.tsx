import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChatAgent } from './components/ChatAgent';
import { AuthModal } from './components/AuthModal';
import { auth, onAuthStateChanged } from './lib/firebase';
import { User } from 'firebase/auth';

export default function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [newChatTrigger, setNewChatTrigger] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

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
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />
      <main className="flex-1 flex overflow-hidden relative">
        <ChatAgent 
          isHistoryOpen={isHistoryOpen}
          setIsHistoryOpen={setIsHistoryOpen}
          newChatTrigger={newChatTrigger}
        />
      </main>

      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
      />
    </div>
  );
}


