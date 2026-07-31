import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Sparkles, Copy, Check, Database, GitBranch, Layers, Cpu, Shuffle, ExternalLink, HelpCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage, ChatSession } from '../types';
import { JobFlowVisualizer } from './JobFlowVisualizer';
import { HistorySidebar } from './HistorySidebar';

const RANDOM_TALEND_QUESTIONS = [
  "Comment gérer l'historisation des données Type 1 et Type 2 avec tDBSCD dans Talend ?",
  "Explique le fonctionnement d'un tMap avec Inner Join et la capture des rejets Catch Unmatched.",
  "Comment utiliser tParallelize pour exécuter plusieurs subjobs en parallèle ?",
  "Quelle est la méthode pour passer des variables de contexte dynamiquement à un tRunJob ?",
  "Comment optimiser la mémoire de la JVM avec les arguments -Xms et -Xmx dans Talend ?",
  "Comment traiter les erreurs et les exceptions avec tLogCatcher et tDie ?",
  "Comment lire un fichier JSON imbriqué avec tExtractJSONFields dans un Job Talend ?",
  "Quelle est la différence entre tHashOutput / tHashInput et l'écriture dans des fichiers temporaires ?",
  "Comment réaliser un Change Data Capture (CDC) pour capturer les modifications dans Talend ?",
  "Comment écrire et utiliser une routine Java personnalisée dans un tMap ?",
  "Comment faire un appel d'API REST sécurisé avec tRESTClient dans un flux Talend ?",
  "Comment boucler sur une liste de fichiers avec tFileList et tIterateToFlow ?"
];

const extractFollowUpQuestions = (text: string): string[] => {
  const marker = "### 💡 Questions complémentaires suggérées :";
  const idx = text.indexOf(marker);
  if (idx === -1) return [];
  const followUpPart = text.slice(idx + marker.length);
  const lines = followUpPart.split('\n');
  const questions: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
      const q = trimmed.replace(/^[-*]\s*/, '').trim();
      if (q.length > 5) {
        questions.push(q);
      }
    }
  }
  return questions.slice(0, 3);
};

interface ChatAgentProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  newChatTrigger: number;
}

const STORAGE_KEY = 'talend_ai_chat_sessions_v2';

const loadSessionsFromStorage = (): ChatSession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error("Erreur de chargement du stockage local:", err);
    return [];
  }
};

const saveSessionsToStorage = (sessions: ChatSession[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error("Erreur d'écriture du stockage local:", err);
  }
};

const renderFormattedText = (
  text: string,
  msgId: string,
  copiedId: string | null,
  handleCopy: (code: string, id: string) => void
) => {
  // Strip raw FLOW lines or ASCII diagram text and orphaned connectors completely from message display
  const cleanedText = text
    .replace(/^.*FLOW:.*$/gm, '')
    .replace(/(?:\[[^\]]+\]\s*--\([^)]*\)-->\s*)+\[[^\]]+\]/gi, '')
    .replace(/--\([^)]*\)-->/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return (
    <div className="markdown-body text-sm sm:text-[15px] leading-relaxed text-zinc-200">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-base sm:text-lg font-bold text-white mt-4 mb-2 font-sans tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm sm:text-base font-bold text-cyan-300 mt-4 mb-2 font-sans tracking-tight border-b border-zinc-800 pb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs sm:text-sm font-semibold text-zinc-100 mt-3 mb-1.5 font-sans flex items-center">{children}</h3>,
          hr: () => <hr className="my-4 border-zinc-800" />,
          blockquote: ({ children }) => <blockquote className="my-3 pl-3.5 border-l-2 border-cyan-500/80 bg-zinc-900/60 py-2 pr-3 rounded-r-lg text-zinc-300 text-xs sm:text-sm">{children}</blockquote>,
          p: ({ children }) => <p className="mb-2.5 leading-relaxed text-zinc-200">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-cyan-400">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc list-outside space-y-1.5 my-2.5 text-zinc-200 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside space-y-1.5 my-2.5 text-zinc-200 pl-5">{children}</ol>,
          li: ({ children }) => <li className="text-zinc-200 pl-1">{children}</li>,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-zinc-700/80 bg-[#161616] shadow-lg">
              <table className="w-full min-w-full text-left text-xs sm:text-sm text-zinc-200 divide-y divide-zinc-700/80 font-sans border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#222222] text-cyan-300 font-semibold uppercase text-[11px] sm:text-xs tracking-wider border-b border-zinc-700/80">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-zinc-800/80 bg-zinc-900/40">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-zinc-800/60 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 sm:px-4 py-2.5 font-semibold text-cyan-300 border-r border-zinc-800/80 last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 sm:px-4 py-2.5 text-zinc-200 border-r border-zinc-800/60 last:border-r-0 leading-relaxed">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition font-medium inline-flex items-center gap-1"
            >
              {children}
              <ExternalLink className="w-3 h-3 inline shrink-0 ml-0.5" />
            </a>
          ),
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            if (!inline && codeString.includes('\n')) {
              const blockId = `${msgId}-code-${Math.random()}`;
              const isCopied = copiedId === blockId;
              const lang = match ? match[1] : 'code';
              return (
                <div className="my-4 rounded-xl bg-[#0d0d0d] border border-zinc-800/90 overflow-hidden font-mono text-xs sm:text-sm shadow-md">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-zinc-800 text-zinc-400 text-xs font-sans">
                    <span className="font-mono text-zinc-300 text-xs lowercase">{lang}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(codeString, blockId)}
                      className="flex items-center space-x-1.5 hover:text-white transition text-xs font-sans text-zinc-400"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-medium">Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier le code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-zinc-100 leading-relaxed font-mono bg-[#0d0d0d]">
                    {codeString}
                  </pre>
                </div>
              );
            }
            return (
              <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-100 font-mono text-xs border border-zinc-700/50" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {cleanedText}
      </Markdown>
    </div>
  );
};

export const ChatAgent: React.FC<ChatAgentProps> = ({
  isHistoryOpen,
  setIsHistoryOpen,
  newChatTrigger
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessionsFromStorage());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Floating selection context menu state
  const [selectionMenu, setSelectionMenu] = useState<{
    text: string;
    top: number;
    left: number;
  } | null>(null);
  const [copiedSelected, setCopiedSelected] = useState(false);

  const latestAgentMsgRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Derive current messages from active session
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  // Handle text selection in assistant messages
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectionMenu(null);
      return;
    }
    const text = selection.toString().trim();
    if (text.length < 2) {
      setSelectionMenu(null);
      return;
    }
    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      setSelectionMenu({
        text,
        top: Math.max(10, rect.top - 8),
        left: Math.max(130, Math.min(window.innerWidth - 130, rect.left + rect.width / 2)),
      });
    } catch (e) {
      setSelectionMenu(null);
    }
  };

  const handleAskSelected = (text: string) => {
    setInputMessage(`Expliquez-moi cette partie : "${text}"`);
    setSelectionMenu(null);
    window.getSelection()?.removeAllRanges();
    const inputEl = document.querySelector('input[type="text"]') as HTMLInputElement;
    if (inputEl) inputEl.focus();
  };

  const handleCopySelected = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSelected(true);
    setTimeout(() => {
      setCopiedSelected(false);
      setSelectionMenu(null);
      window.getSelection()?.removeAllRanges();
    }, 1200);
  };

  // Handle New Chat Trigger from navbar
  useEffect(() => {
    if (newChatTrigger > 0) {
      handleNewChat();
    }
  }, [newChatTrigger]);

  useEffect(() => {
    if (isLoading) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'agent' && latestAgentMsgRef.current) {
        latestAgentMsgRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [messages, isLoading]);

  const handleNewChat = () => {
    setActiveSessionId(null);
    setInputMessage('');
  };

  const handleRandomQuestion = () => {
    const filtered = RANDOM_TALEND_QUESTIONS.filter(q => q !== inputMessage);
    const randomIndex = Math.floor(Math.random() * filtered.length);
    setInputMessage(filtered[randomIndex]);
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    saveSessionsToStorage(updated);
    if (activeSessionId === sessionId) {
      setActiveSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const handleClearAllHistory = () => {
    if (window.confirm("Êtes-vous sûr de vouloir effacer tout l'historique des conversations ?")) {
      setSessions([]);
      setActiveSessionId(null);
      saveSessionsToStorage([]);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    let currentSessionId = activeSessionId;
    let updatedSessions = [...sessions];

    // Create session if none exists or activeSessionId is null
    if (!currentSessionId || !updatedSessions.some(s => s.id === currentSessionId)) {
      currentSessionId = Date.now().toString();
      const newTitle = query.trim().length > 32 
        ? query.trim().substring(0, 32) + '...' 
        : query.trim();
      const timeNow = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
      
      const newSession: ChatSession = {
        id: currentSessionId,
        title: newTitle,
        createdAt: timeNow,
        updatedAt: timeNow,
        messages: [userMsg]
      };

      updatedSessions = [newSession, ...updatedSessions];
      setActiveSessionId(currentSessionId);
    } else {
      // Append user message to existing active session
      updatedSessions = updatedSessions.map(s => {
        if (s.id === currentSessionId) {
          const timeNow = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
          return {
            ...s,
            updatedAt: timeNow,
            messages: [...s.messages, userMsg]
          };
        }
        return s;
      });
    }

    setSessions(updatedSessions);
    saveSessionsToStorage(updatedSessions);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const currentMessages = updatedSessions.find(s => s.id === currentSessionId)?.messages || [userMsg];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: currentMessages.slice(-8).map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur système');
      }

      const textLower = query.toLowerCase();
      let diagramPreset: 'tmap-etl' | 'scd-dim' | 'cdc-stream' | 'parallel-job' | 'file-processing' | 'subjob-run' | 'rest-api' | 'db-transaction' | 'java-routine' | 'loop-rest' | 'jvm-memory' = 'tmap-etl';

      if (textLower.includes('scd') || textLower.includes('dimension') || textLower.includes('évolution lente') || textLower.includes('evolution lente') || textLower.includes('tdbscd') || textLower.includes('type 1') || textLower.includes('type 2') || textLower.includes('historisation')) {
        diagramPreset = 'scd-dim';
      } else if (textLower.includes('cdc') || textLower.includes('change data capture') || textLower.includes('changement')) {
        diagramPreset = 'cdc-stream';
      } else if (textLower.includes('parallel') || textLower.includes('parallèle') || textLower.includes('thread') || textLower.includes('tparallelize')) {
        diagramPreset = 'parallel-job';
      } else if (textLower.includes('filelist') || textLower.includes('repertoire') || textLower.includes('dossier') || textLower.includes('fichiers') || textLower.includes('tfilelist')) {
        diagramPreset = 'file-processing';
      } else if (textLower.includes('trunjob') || textLower.includes('subjob') || textLower.includes('orchestr')) {
        diagramPreset = 'subjob-run';
      } else if (textLower.includes('memoire') || textLower.includes('mémoire') || textLower.includes('xmx') || textLower.includes('jvm') || textLower.includes('heap') || textLower.includes('xms')) {
        diagramPreset = 'jvm-memory';
      } else if (textLower.includes('loop') || textLower.includes('boucle') || textLower.includes('iterate')) {
        diagramPreset = 'loop-rest';
      } else if (textLower.includes('rest') || textLower.includes('api') || textLower.includes('json')) {
        diagramPreset = 'rest-api';
      } else if (textLower.includes('routine') || textLower.includes('java') || textLower.includes('sha256') || textLower.includes('hash')) {
        diagramPreset = 'java-routine';
      } else if (textLower.includes('prejob') || textLower.includes('postjob') || textLower.includes('transaction')) {
        diagramPreset = 'db-transaction';
      }

      // Check if response contains an explicit FLOW: line
      const asciiFlowMatch = data.text.match(/(?:^|\n)FLOW:\s*(\[[^\]]+\](?:\s*--\([^)]+\)-->\s*\[[^\]]+\])+)/i);
      let extractedFlowString: string | undefined = undefined;
      if (asciiFlowMatch) {
        extractedFlowString = asciiFlowMatch[1].trim();
      }

      // Detect meta-questions, follow-ups or confirmation questions
      const isMetaQuestion = textLower.includes("t'es sur") || 
                             textLower.includes("es-tu sur") || 
                             textLower.includes("es tu sur") || 
                             textLower.includes("etes-vous sur") || 
                             textLower.includes("êtes-vous sûr");

      let diagramsList: any[] | undefined = undefined;
      if (extractedFlowString && !isMetaQuestion) {
        const compMatches = extractedFlowString.match(/\[[^\]]+\]/g);
        if (compMatches && compMatches.length >= 2) {
          diagramsList = [
            {
              title: `Schéma éventuel du Job`,
              type: diagramPreset,
              flow: [extractedFlowString]
            }
          ];
        }
      }

      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        diagrams: diagramsList
      };

      // Append agent message to current session
      setSessions(prev => {
        const next = prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: [...s.messages, agentMsg]
            };
          }
          return s;
        });
        saveSessionsToStorage(next);
        return next;
      });

    } catch (error: any) {
      console.error(error);
      const errAgentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: `Erreur : ${error.message || "Impossible de traiter la demande"}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSessions(prev => {
        const next = prev.map(s => {
          if (s.id === currentSessionId) {
            return {
              ...s,
              messages: [...s.messages, errAgentMsg]
            };
          }
          return s;
        });
        saveSessionsToStorage(next);
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const SUGGESTIONS = [
    {
      title: "tMap & Catch Rejects",
      desc: "Inner Join, expressions Java et traitement des erreurs",
      icon: <GitBranch className="w-5 h-5 text-cyan-400" />,
      query: "Comment configurer le tMap avec Inner Join, des expressions Java et la capture des rejets Catch Unmatched ?"
    },
    {
      title: "Parallélisme (tParallelize)",
      desc: "Exécuter des subjobs en parallèle sur plusieurs threads",
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      query: "Comment utiliser tParallelize pour exécuter des subjobs en parallèle sur plusieurs threads ?"
    },
    {
      title: "Historisation SCD Type 1 & 2 (tDBSCD)",
      desc: "Gestion des dimensions à évolution lente et suivi des clés historisées",
      icon: <Database className="w-5 h-5 text-cyan-400" />,
      query: "Comment mettre en place la gestion de la dimension SCD Type 1 et Type 2 avec tDBSCD ?"
    },
    {
      title: "Routines Java & Mémoire JVM",
      desc: "Créer une routine de hachage et optimiser la mémoire -Xmx",
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      query: "Comment écrire une routine Java personnalisée et ajuster la mémoire de la JVM (-Xmx2048m) ?"
    }
  ];

  return (
    <div className="flex flex-1 w-full h-[calc(100vh-3.5rem)] relative font-sans text-zinc-100 overflow-hidden">
      
      {/* History Sidebar Panel */}
      <HistorySidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onClearAllHistory={handleClearAllHistory}
      />

      {/* Main Chat Conversation View */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 bg-[#212121]">
        
        {/* Messages Scroll Area */}
        <div
          onMouseUp={handleTextSelection}
          className="flex-1 overflow-y-auto pb-36 pt-6 px-3 sm:px-4"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            
            {/* ChatGPT Empty Welcome State */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center min-h-[55vh] text-center my-auto px-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-cyan-400 tracking-wider uppercase mb-3 font-sans">
                  Talend AI
                </span>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-100 mb-8 font-sans tracking-tight">
                  En quoi puis-je vous aider sur Talend aujourd'hui ?
                </h1>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                  {SUGGESTIONS.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.query)}
                      className="p-3.5 sm:p-4 rounded-2xl bg-[#2f2f2f]/60 hover:bg-[#2f2f2f] border border-zinc-700/50 text-left transition flex flex-col justify-between group active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-xs sm:text-sm text-zinc-200 group-hover:text-cyan-400 transition">
                          {item.title}
                        </span>
                        {item.icon}
                      </div>
                      <p className="text-[11px] sm:text-xs text-zinc-400 font-normal leading-relaxed">
                        {item.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ChatGPT Conversation Messages */}
            {messages.map((msg, index) => {
              const isLatestAgent = msg.sender === 'agent' && index === messages.length - 1;
              const followUps = msg.sender === 'agent' ? extractFollowUpQuestions(msg.text) : [];

              return (
                <div
                  key={msg.id}
                  ref={isLatestAgent ? latestAgentMsgRef : undefined}
                  className={`flex w-full scroll-mt-6 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                {msg.sender === 'user' ? (
                  /* User Message Bubble */
                  <div className="bg-[#2f2f2f] text-zinc-100 px-4 py-3 rounded-[22px] max-w-[88%] sm:max-w-[82%] text-sm sm:text-[15px] leading-relaxed font-sans shadow-sm border border-zinc-700/40">
                    {msg.text}
                  </div>
                ) : (
                  /* Assistant Response Block */
                  <div className="flex space-x-2.5 sm:space-x-3 max-w-full w-full">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1 space-y-3 min-w-0">
                      
                      {/* Render Visual Diagram in output block if available */}
                      {msg.diagrams && msg.diagrams.map((diag, dIdx) => (
                        <div key={dIdx} className="my-2">
                          <JobFlowVisualizer
                            title={diag.title}
                            preset={diag.type as any}
                            flowString={diag.flow && diag.flow.length > 0 ? diag.flow[0] : undefined}
                          />
                        </div>
                      ))}

                      {/* Text Body */}
                      {renderFormattedText(msg.text, msg.id, copiedId, handleCopy)}

                      {/* Message Copy Button */}
                      <div className="flex flex-col space-y-3 pt-1">
                        <div className="flex items-center justify-start">
                          <button
                            type="button"
                            onClick={() => {
                              const cleanText = msg.text
                                .replace(/^.*FLOW:.*$/gm, '')
                                .replace(/(?:\[[^\]]+\]\s*--\([^)]*\)-->\s*)+\[[^\]]+\]/gi, '')
                                .replace(/--\([^)]*\)-->/g, '')
                                .trim();
                              handleCopy(cleanText, `msg-${msg.id}`);
                            }}
                            className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-cyan-400 transition font-sans px-2.5 py-1 rounded-lg hover:bg-zinc-800 border border-transparent hover:border-zinc-700/80"
                          >
                            {copiedId === `msg-${msg.id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-cyan-400 font-medium">Réponse copiée !</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                                <span>Copier la réponse</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Interactive Suggested Follow-up Questions Pills */}
                        {followUps.length > 0 && (
                          <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                            <div className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-400 font-sans">
                              <HelpCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>Questions complémentaires suggérées :</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {followUps.map((q, qIdx) => (
                                <button
                                  key={qIdx}
                                  type="button"
                                  onClick={() => {
                                    handleSendMessage(q);
                                  }}
                                  disabled={isLoading}
                                  className="text-xs text-zinc-300 hover:text-cyan-200 bg-[#282828] hover:bg-[#303030] border border-zinc-700/70 hover:border-cyan-500/60 rounded-xl px-3 py-1.5 transition text-left flex items-center space-x-1.5 shadow-sm group font-sans active:scale-[0.98] disabled:opacity-50"
                                >
                                  <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform font-bold text-sm">→</span>
                                  <span>{q}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex space-x-3 max-w-full items-center">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-spin" />
                </div>
                <div className="flex items-center space-x-2 text-zinc-400 text-xs sm:text-sm font-sans">
                  <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span>Vérification approfondie et génération de la réponse...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Floating Context Selection Menu */}
        {selectionMenu && (
          <div
            style={{
              position: 'fixed',
              top: `${selectionMenu.top}px`,
              left: `${selectionMenu.left}px`,
              transform: 'translate(-50%, -100%)',
            }}
            className="z-50 mb-2 flex items-center bg-[#1c1c1c] border border-cyan-500/50 rounded-xl shadow-2xl px-2.5 py-1.5 space-x-1 backdrop-blur-md animate-in fade-in zoom-in duration-150"
          >
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleAskSelected(selectionMenu.text);
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold text-cyan-300 hover:text-cyan-100 hover:bg-zinc-800 rounded-lg transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="whitespace-nowrap">Demander à Talend AI</span>
            </button>

            {/* Real visual separator line */}
            <div className="w-px h-4 bg-zinc-700/90 shrink-0 mx-1.5" />

            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleCopySelected(selectionMenu.text);
              }}
              className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition"
            >
              {copiedSelected ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 font-medium whitespace-nowrap">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="whitespace-nowrap">Copier</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ChatGPT Floating Input Box */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#212121] via-[#212121]/95 to-transparent pt-4 sm:pt-6 pb-3 sm:pb-4 px-2.5 sm:px-4 z-30">
          <div className="max-w-3xl mx-auto w-full">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center bg-[#2f2f2f] border border-zinc-700/60 focus-within:border-zinc-500 rounded-[26px] px-2 sm:px-3 py-1.5 sm:py-2 transition shadow-xl w-full"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Envoyer un message à Talend AI..."
                disabled={isLoading}
                className="flex-1 min-w-0 bg-transparent text-white placeholder-zinc-400 px-2 sm:px-3 py-1.5 text-sm sm:text-base focus:outline-none"
              />
              <button
                type="button"
                onClick={handleRandomQuestion}
                disabled={isLoading}
                title="Générer une question aléatoire sur Talend"
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-cyan-400 hover:text-cyan-300 border border-zinc-700/80 disabled:opacity-40 flex items-center justify-center transition shrink-0 ml-1 sm:ml-1.5 active:scale-95 group"
              >
                <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 group-hover:rotate-180 transition-transform duration-300" />
              </button>
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="w-8 h-8 rounded-full bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:bg-zinc-700 disabled:text-zinc-500 flex items-center justify-center transition shrink-0 ml-1 sm:ml-1.5"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
            <p className="text-[10px] sm:text-[11px] text-zinc-500 text-center mt-2 font-sans px-2">
              Talend AI peut faire des erreurs. Pensez à vérifier les informations importantes.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
