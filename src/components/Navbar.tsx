import React from 'react';
import { Bot, BookOpen, Wrench, Sparkles, Server } from 'lucide-react';

interface NavbarProps {
  activeTab: 'chat' | 'books' | 'tools';
  setActiveTab: (tab: 'chat' | 'books' | 'tools') => void;
  activeBooksCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, activeBooksCount }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 p-0.5 shadow-md">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                  Talend<span className="text-sky-400">.AI</span> Book Agent
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Server className="w-3 h-3 mr-1 text-emerald-400" />
                  Gemini 3.6 Flash Server
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Agent IA conversationnel avec extraction d'exemples & schémas de vos livres Talend
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Agent Chat</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-sky-950 text-sky-200 rounded-full border border-sky-400/30">
                {activeBooksCount} livre(s)
              </span>
            </button>

            <button
              onClick={() => setActiveTab('books')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'books'
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Livres & Contenu</span>
            </button>

            <button
              onClick={() => setActiveTab('tools')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'tools'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>Guide des Outils</span>
              <span className="hidden md:inline-block px-1.5 py-0.5 text-[10px] bg-amber-400/20 text-amber-300 rounded-full border border-amber-400/40">
                Réponse à votre question
              </span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
};
