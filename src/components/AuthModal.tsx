import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  KeyRound, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  LogOut,
  UserCheck
} from 'lucide-react';
import { User } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  userEmail?: string;
  setUserEmail?: (email: string) => void;
  isActivated?: boolean;
  activationCode?: string;
  remainingQuota?: number;
  dailyQuota?: number;
  onActivateSuccess?: (email: string, code: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser,
  userEmail = 'demo-reader@talend.book',
  setUserEmail,
  isActivated = false,
  activationCode = '',
  remainingQuota = 40,
  dailyQuota = 40,
  onActivateSuccess
}) => {
  const [emailInput, setEmailInput] = useState(userEmail || '');
  const [codeInput, setCodeInput] = useState(activationCode || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!emailInput.trim()) {
      setErrorMsg("Veuillez saisir votre adresse e-mail.");
      return;
    }

    if (!codeInput.trim()) {
      setErrorMsg("Veuillez saisir le code d'activation imprimé dans votre livre.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          code: codeInput.trim(),
          authMethod: 'book-code',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Code invalide ou déjà utilisé.");
      } else {
        setSuccessMsg("Connexion réussie ! Vos accès sont activés.");
        if (setUserEmail) setUserEmail(emailInput.trim());
        if (onActivateSuccess) onActivateSuccess(emailInput.trim(), codeInput.trim());
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setErrorMsg("Erreur lors de la connexion. Veuillez vérifier votre réseau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="relative bg-[#141824] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Decorative ambient background glow */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header / Banner */}
        <div className="p-6 pb-4 text-center border-b border-zinc-800/80 bg-gradient-to-b from-cyan-950/20 to-transparent">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/5">
            <BookOpen className="w-7 h-7 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Espace Lecteur Talend
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Connectez-vous simplement avec votre email et votre code livre
          </p>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5">
          {isActivated ? (
            /* Connected / Activated Status */
            <div className="space-y-4 text-center">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <UserCheck className="w-5 h-5 shrink-0" />
                  <span>Compte Lecteur Actif</span>
                </div>
                <div className="text-xs text-zinc-300 space-y-1 pt-1 border-t border-emerald-500/20">
                  <p><span className="text-zinc-400">Email :</span> <strong className="text-white">{userEmail}</strong></p>
                  <p><span className="text-zinc-400">Code actif :</span> <code className="text-cyan-300 font-mono font-bold">{activationCode || 'TALEND-BOOK-2026'}</code></p>
                  <p><span className="text-zinc-400">Quota quotidien :</span> <strong className="text-emerald-400">{remainingQuota} / {dailyQuota} requêtes RAG</strong></p>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold text-xs transition"
                >
                  Continuer vers l'assistant
                </button>
              </div>
            </div>
          ) : (
            /* Login Form: Email + Book Activation Code */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="votre.email@exemple.fr"
                    className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Code d'activation du livre</span>
                  <span className="text-[11px] text-cyan-400">Imprimé dans le livre</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="Ex: TALEND-BOOK-2026-001"
                    className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-cyan-300 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
                  />
                </div>

              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs transition shadow-lg shadow-cyan-500/20 active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-cyan-200" />
                <span>{loading ? 'Vérification...' : 'Se connecter'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-zinc-800/80 bg-zinc-900/40 text-center text-[11px] text-zinc-400">
          Un code unique est fourni dans chaque exemplaire du livre Talend ETL.
        </div>
      </div>
    </div>
  );
};
