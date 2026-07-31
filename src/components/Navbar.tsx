import React from 'react';
import { Plus, Sparkles, History, PanelLeft } from 'lucide-react';

interface NavbarProps {
  onNewChat: () => void;
  onToggleHistory: () => void;
  isHistoryOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onNewChat, onToggleHistory, isHistoryOpen }) => {
  return (
    <header className="bg-[#171717] border-b border-zinc-800/80 text-zinc-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="relative flex items-center justify-between h-14">
          
          {/* Left: History toggle */}
          <div className="flex items-center z-10">
            <button
              type="button"
              onClick={onToggleHistory}
              title={isHistoryOpen ? "Masquer l'historique" : "Afficher l'historique"}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border transition text-xs font-medium font-sans ${
                isHistoryOpen
                  ? 'bg-zinc-800 text-cyan-400 border-zinc-700'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
            >
              <PanelLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Historique</span>
            </button>
          </div>

          {/* Center: Brand Logo & Title (Centered in mobile & desktop) */}
          <div className="absolute left-1/2 -translate-x-1/2 -ml-[12px] flex items-center space-x-2 px-2 py-1.5 font-sans font-medium">
            <Sparkles className="w-4.5 h-4.5 text-cyan-400 shrink-0" />
            <span className="font-semibold text-white tracking-tight text-sm sm:text-base">Talend AI</span>
          </div>

          {/* Right: New Chat Button */}
          <div className="flex items-center z-10">
            <button
              onClick={onNewChat}
              title="Nouvelle discussion"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition active:scale-95"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Nouvelle discussion</span>
              <span className="sm:hidden">Nouveau</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

