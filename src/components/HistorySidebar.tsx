import React from 'react';
import { Plus, MessageSquare, Trash2, X, Clock, AlertCircle } from 'lucide-react';
import { ChatSession } from '../types';

interface HistorySidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
  onClearAllHistory: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  sessions,
  activeSessionId,
  isOpen,
  onClose,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAllHistory
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        onClick={onClose}
      />

      {/* History Sidebar Panel */}
      <aside className="fixed md:static top-14 bottom-0 left-0 z-40 w-72 sm:w-80 bg-[#171717] border-r border-zinc-800 flex flex-col font-sans transition-all duration-300 shadow-2xl md:shadow-none">
        
        {/* Top Actions Bar */}
        <div className="p-3 border-b border-zinc-800/80 flex items-center justify-between gap-2 bg-[#121212]">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle discussion</span>
          </button>
          
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sessions List Header */}
        <div className="px-4 py-3 flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider bg-[#171717]">
          <span className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Historique ({sessions.length})</span>
          </span>
          {sessions.length > 0 && (
            <button
              onClick={onClearAllHistory}
              className="text-[11px] font-normal text-zinc-500 hover:text-red-400 transition flex items-center space-x-1"
              title="Effacer tout l'historique"
            >
              <Trash2 className="w-3 h-3" />
              <span>Effacer</span>
            </button>
          )}
        </div>

        {/* List of Previous Discussions */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 px-4 text-center text-zinc-500 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 stroke-[1.5] text-zinc-600 mb-1" />
              <p className="font-medium text-zinc-400">Aucun historique pour le moment</p>
              <p className="text-[11px] leading-relaxed">
                Vos échanges avec Talend AI apparaîtront automatiquement ici.
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const msgCount = session.messages.length;
              const dateStr = session.updatedAt || session.createdAt;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs font-sans transition border ${
                    isActive
                      ? 'bg-zinc-800/90 text-white border-zinc-700 shadow-sm'
                      : 'hover:bg-zinc-800/50 text-zinc-300 border-transparent hover:border-zinc-800'
                  }`}
                >
                  <div className="flex items-start space-x-2.5 min-w-0 pr-2">
                    <MessageSquare className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-200 group-hover:text-white leading-tight">
                        {session.title || "Nouvelle conversation"}
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] text-zinc-500 mt-1">
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{msgCount} message{msgCount > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delete Single Session Button */}
                  <button
                    onClick={(e) => onDeleteSession(session.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-700/60 transition"
                    title="Supprimer la discussion"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-zinc-800/80 bg-[#121212] text-[11px] text-zinc-500 flex items-center justify-between">
          <span>Talend Assistant</span>
          <span className="text-[10px] text-zinc-600 font-mono">Stockage local</span>
        </div>

      </aside>
    </>
  );
};
