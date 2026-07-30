import React from 'react';
import { Plus, ChevronDown, Sparkles } from 'lucide-react';

interface NavbarProps {
  onResetChat: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onResetChat }) => {
  return (
    <header className="bg-[#171717] border-b border-zinc-800/80 text-zinc-100 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          
          {/* ChatGPT Style Model Selector */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-zinc-200 transition font-sans font-medium text-sm"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-semibold text-white">Talend AI</span>
              <span className="text-xs bg-zinc-800 border border-zinc-700 text-cyan-400 px-1.5 py-0.5 rounded font-mono font-medium">4.0</span>
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={onResetChat}
            title="Nouvelle discussion"
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvelle discussion</span>
          </button>

        </div>
      </div>
    </header>
  );
};

