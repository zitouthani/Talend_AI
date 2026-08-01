import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChatAgent } from './components/ChatAgent';
import { AuthModal } from './components/AuthModal';
import { auth, onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink, syncUserProfile } from './lib/firebase';
import { User } from 'firebase/auth';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [newChatTrigger, setNewChatTrigger] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authBanner, setAuthBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // User Activation & Rate Limit State (Partie 2)
  const [userEmail, setUserEmail] = useState<string>('demo-reader@talend.book');
  const [isActivated, setIsActivated] = useState<boolean>(true);
  const [activationCode, setActivationCode] = useState<string>('PASCAL-TALEND-2026');
  const [remainingQuota, setRemainingQuota] = useState<number>(40);
  const [dailyQuota, setDailyQuota] = useState<number>(40);

  // Fetch status on load
  useEffect(() => {
    fetchStatus(userEmail);
  }, [userEmail]);

  const fetchStatus = async (email: string) => {
    try {
      const res = await fetch(`/api/user/status?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setIsActivated(data.isActivated);
        if (data.activationCode) setActivationCode(data.activationCode);
        setDailyQuota(data.dailyQuota || 40);
        setRemainingQuota(data.remainingQuota !== undefined ? data.remainingQuota : 40);
      }
    } catch {
      // Ignore initial network errors
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user?.email) {
        setUserEmail(user.email);
      }
    });

    // Check if the user arrived via Firebase Email Link (Passwordless)
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let storedEmail = window.localStorage.getItem('emailForSignIn');
      if (!storedEmail) {
        storedEmail = window.prompt('Veuillez entrer votre adresse e-mail pour confirmer la connexion sans mot de passe :');
      }
      if (storedEmail) {
        signInWithEmailLink(auth, storedEmail, window.location.href)
          .then(async (result) => {
            window.localStorage.removeItem('emailForSignIn');
            await syncUserProfile(result.user, 'email-link');
            setAuthBanner({
              type: 'success',
              message: `Connexion réussie sans mot de passe ! Bienvenue ${result.user.email}.`
            });
            if (result.user.email) {
              setUserEmail(result.user.email);
            }
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((error: any) => {
            console.error('Erreur de connexion par lien e-mail :', error);
            setAuthBanner({
              type: 'error',
              message: `Impossible d'effectuer la connexion par lien : ${error.message || 'Lien invalide ou expiré.'}`
            });
          });
      }
    }

    return () => unsubscribe();
  }, []);

  const handleNewChat = () => {
    setNewChatTrigger(prev => prev + 1);
  };

  const handleToggleHistory = () => {
    setIsHistoryOpen(prev => !prev);
  };

  const handleActivateSuccess = (email: string, code: string) => {
    setUserEmail(email);
    setIsActivated(true);
    setActivationCode(code);
    fetchStatus(email);
  };

  return (
    <div className="min-h-screen bg-[#212121] text-zinc-100 font-sans antialiased selection:bg-zinc-700 selection:text-white flex flex-col h-screen overflow-hidden">
      <Navbar 
        onNewChat={handleNewChat}
        onToggleHistory={handleToggleHistory}
        isHistoryOpen={isHistoryOpen}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        isActivated={isActivated}
      />

      {authBanner && (
        <div className={`px-4 py-2.5 flex items-center justify-between text-xs font-medium border-b ${
          authBanner.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
            : 'bg-red-500/10 border-red-500/20 text-red-300'
        }`}>
          <div className="flex items-center space-x-2 mx-auto">
            {authBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{authBanner.message}</span>
          </div>
          <button 
            onClick={() => setAuthBanner(null)}
            className="text-zinc-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

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
        userEmail={userEmail}
        setUserEmail={setUserEmail}
        isActivated={isActivated}
        activationCode={activationCode}
        remainingQuota={remainingQuota}
        dailyQuota={dailyQuota}
        onActivateSuccess={handleActivateSuccess}
      />
    </div>
  );
}


