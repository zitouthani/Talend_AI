import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Sparkles, Copy, Check, Code, Database, GitBranch, Layers, Cpu } from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage } from '../types';
import { JobFlowVisualizer } from './JobFlowVisualizer';

interface ChatAgentProps {}

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
        components={{
          h1: ({ children }) => <h1 className="text-base sm:text-lg font-bold text-white mt-4 mb-2 font-sans tracking-tight">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm sm:text-base font-semibold text-zinc-100 mt-3 mb-1.5 font-sans tracking-tight">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs sm:text-sm font-semibold text-zinc-200 mt-2.5 mb-1 font-sans">{children}</h3>,
          p: ({ children }) => <p className="mb-3 leading-relaxed text-zinc-200">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-cyan-400">{children}</strong>,
          ul: ({ children }) => <ul className="list-disc list-outside space-y-1.5 my-2.5 text-zinc-200 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside space-y-1.5 my-2.5 text-zinc-200 pl-5">{children}</ol>,
          li: ({ children }) => <li className="text-zinc-200 pl-1">{children}</li>,
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

export const ChatAgent: React.FC<ChatAgentProps> = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-8).map(m => ({ sender: m.sender, text: m.text }))
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

      // Check if response contains an ASCII flow string or FLOW: line
      const asciiFlowMatch = data.text.match(/(?:FLOW:\s*)?(\[[^\]]+\](?:\s*--\([^)]+\)-->\s*\[[^\]]+\])+)/i);
      let extractedFlowString: string | undefined = undefined;
      if (asciiFlowMatch) {
        extractedFlowString = asciiFlowMatch[1].trim();
      }

      // Only create diagrams array if a valid flow string was explicitly generated and verified
      let diagramsList: any[] | undefined = undefined;
      if (extractedFlowString && extractedFlowString.length > 5) {
        diagramsList = [
          {
            title: `Schéma Visuel du Job : ${query}`,
            type: diagramPreset,
            flow: [extractedFlowString]
          }
        ];
      }

      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        diagrams: diagramsList
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `Erreur : ${error.message || "Impossible de traiter la demande"}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
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
      title: "Dimensions SCD (tDBSCD)",
      desc: "Gérer l'historisation des données Type 1 et Type 2",
      icon: <Database className="w-5 h-5 text-cyan-400" />,
      query: "Gérer les dimensions à évolution lente SCD dans Talend avec le composant tDBSCD."
    },
    {
      title: "tMap & Catch Rejects",
      desc: "Inner Join, expressions Java et traitement des erreurs",
      icon: <GitBranch className="w-5 h-5 text-cyan-400" />,
      query: "Explique le composant tMap avec Inner Join, expressions et capture des rejets Catch Unmatched."
    },
    {
      title: "Parallélisme (tParallelize)",
      desc: "Exécuter des subjobs en parallèle sur plusieurs threads",
      icon: <Layers className="w-5 h-5 text-cyan-400" />,
      query: "Comment utiliser tParallelize pour exécuter plusieurs subjobs en parallèle ?"
    },
    {
      title: "Routine Java SHA256 & JVM",
      desc: "Code Java personnalisé et allocation mémoire -Xmx",
      icon: <Cpu className="w-5 h-5 text-cyan-400" />,
      query: "Code d'une routine Java de hachage SHA-256 et configuration mémoire JVM (-Xmx1024m)."
    }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] relative font-sans text-zinc-100">
      
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pb-36 pt-6 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* ChatGPT Empty Welcome State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center my-auto px-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-100 mb-8 font-sans tracking-tight">
                En quoi puis-je vous aider sur Talend aujourd'hui ?
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.query)}
                    className="p-4 rounded-2xl bg-[#2f2f2f]/60 hover:bg-[#2f2f2f] border border-zinc-700/50 text-left transition flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-zinc-200 group-hover:text-cyan-400 transition">
                        {item.title}
                      </span>
                      {item.icon}
                    </div>
                    <p className="text-xs text-zinc-400 font-normal leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ChatGPT Conversation Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'user' ? (
                /* User Message Bubble */
                <div className="bg-[#2f2f2f] text-zinc-100 px-4 py-3 rounded-[22px] max-w-[85%] text-sm sm:text-[15px] leading-relaxed font-sans shadow-sm border border-zinc-700/40">
                  {msg.text}
                </div>
              ) : (
                /* Assistant Response Block */
                <div className="flex space-x-3 max-w-full w-full">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    
                    {/* Render Visual Diagram in ChatGPT output block if verified */}
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
                    <div className="flex items-center justify-start pt-1">
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

                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex space-x-3 max-w-full items-center">
              <div className="w-8 h-8 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              </div>
              <div className="flex items-center space-x-2 text-zinc-400 text-sm font-sans">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Génération du schéma et de la réponse...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* ChatGPT Floating Input Box */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#212121] via-[#212121]/95 to-transparent pt-6 pb-4 px-4 z-40">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative flex items-center bg-[#2f2f2f] border border-zinc-700/60 focus-within:border-zinc-500 rounded-[26px] p-2 transition shadow-xl"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Envoyer un message à Talend AI..."
              disabled={isLoading}
              className="w-full bg-transparent text-white placeholder-zinc-400 px-4 py-2.5 text-sm sm:text-base focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="w-8 h-8 rounded-full bg-white text-black hover:bg-zinc-200 disabled:opacity-30 disabled:bg-zinc-700 disabled:text-zinc-500 flex items-center justify-center transition shrink-0 ml-2"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
          <p className="text-[11px] text-zinc-500 text-center mt-2.5 font-sans">
            Talend AI peut faire des erreurs. Pensez à vérifier les informations importantes.
          </p>
        </div>
      </div>

    </div>
  );
};

