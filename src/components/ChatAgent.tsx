import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, BookOpen, Upload, Code, Copy, Check, Sparkles, Layers, Image as ImageIcon, FileText, X } from 'lucide-react';
import { Book, CustomDocument, ChatMessage } from '../types';
import { JobFlowVisualizer } from './JobFlowVisualizer';

interface ChatAgentProps {
  books: Book[];
  activeBooks: string[];
  toggleBook: (id: string) => void;
  customDocs: CustomDocument[];
  onAddCustomDoc: (doc: CustomDocument) => void;
}

const renderFormattedText = (
  text: string,
  msgId: string,
  copiedId: string | null,
  handleCopy: (code: string, id: string) => void
) => {
  if (!text.includes('```')) {
    return <div className="leading-relaxed whitespace-pre-wrap">{text}</div>;
  }

  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3">
      {parts.map((part, idx) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          let lang = 'code';
          let codeContent = '';

          if (firstLineEnd !== -1) {
            lang = part.slice(3, firstLineEnd).trim() || 'code';
            codeContent = part.slice(firstLineEnd + 1, -3).trim();
          } else {
            codeContent = part.slice(3, -3).trim();
          }

          const blockId = `${msgId}-code-${idx}`;
          const isCopied = copiedId === blockId;

          return (
            <div key={idx} className="my-3 rounded-xl bg-slate-950 border border-slate-700/80 overflow-hidden font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-slate-300">
                <span className="flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-400">
                  <Code className="w-3.5 h-3.5" />
                  <span>{lang}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(codeContent, blockId)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700 transition"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">Copié !</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Copier le code</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 overflow-x-auto text-slate-200 text-xs leading-relaxed whitespace-pre font-mono">
                {codeContent}
              </pre>
            </div>
          );
        }

        return (
          <div key={idx} className="leading-relaxed whitespace-pre-wrap">
            {part}
          </div>
        );
      })}
    </div>
  );
};

export const ChatAgent: React.FC<ChatAgentProps> = ({
  books,
  activeBooks,
  toggleBook,
  customDocs,
  onAddCustomDoc
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `Bonjour ! Je suis **TalendIA Agent**, votre assistant IA conversationnel spécialisé dans l'analyse de livres et documentations Talend.

J'ai actuellement en mémoire **${activeBooks.length} livre(s) Talend** (composants TOS ETL, expressions tMap, REST APIs, routines Java custom, et schémas d'architecture).

📌 **Que puis-je faire pour vous ?**
- Vous fournir les **exemples de code exacts** (ex: routines Java, requêtes SQL dynamiques, expressions tMap).
- Générer les **schémas et diagrammes de flux de jobs** associés.
- Vous citer **les chapitres et pages précises** des livres.

Posez une question ci-dessous ou sélectionnez une suggestion de recherche !`,
      bookCitations: ["Livre 1 : Talend Open Studio Data Integration", "Livre 2 : Architecture Talend Avancée"],
      diagrams: [
        {
          title: "Architecture type d'un Job Talend ETL avec tMap & Catch Reject",
          type: "tmap-etl",
          flow: ["tFileInputDelimited", "tMap (Join)", "tDBOutput", "tLogRow_Reject"]
        }
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Custom document upload modal state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadImageFile, setUploadImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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
          activeBooks,
          customDocuments: customDocs,
          history: messages.slice(-8).map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur réseau');
      }

      // Detect if we should render a visual diagram based on the query contents
      const textLower = query.toLowerCase();
      let diagramPreset: 'tmap-etl' | 'rest-api' | 'db-transaction' | 'java-routine' | undefined = undefined;

      if (textLower.includes('tmap') || textLower.includes('join') || textLower.includes('reject')) {
        diagramPreset = 'tmap-etl';
      } else if (textLower.includes('rest') || textLower.includes('api') || textLower.includes('json')) {
        diagramPreset = 'rest-api';
      } else if (textLower.includes('routine') || textLower.includes('java') || textLower.includes('sha256') || textLower.includes('hash')) {
        diagramPreset = 'java-routine';
      } else if (textLower.includes('prejob') || textLower.includes('transaction') || textLower.includes('commit')) {
        diagramPreset = 'db-transaction';
      }

      const agentMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        bookCitations: activeBooks.map(bId => {
          const b = books.find(item => item.id === bId);
          return b ? b.title : bId;
        }),
        diagrams: diagramPreset ? [{
          title: `Schéma de job généré pour : ${query}`,
          type: diagramPreset,
          flow: []
        }] : undefined
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: `⚠️ **Erreur de connexion** : ${error.message || "Impossible d'obtenir une réponse."}. Vérifiez la clé GEMINI_API_KEY dans les secrets.`,
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadName.trim()) return;

    let contentToStore = uploadText;

    if (uploadImageFile && imagePreview) {
      // Analyze with Gemini Vision endpoint first
      try {
        const base64Clean = imagePreview.split(',')[1];
        const res = await fetch('/api/analyze-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: uploadName,
            fileType: uploadImageFile.type,
            base64Data: base64Clean,
            textContent: uploadText
          })
        });
        const data = await res.json();
        if (data.extractedContent) {
          contentToStore += `\n[Analyse Gemini Vision de l'image de schéma]: ${data.extractedContent}`;
        }
      } catch (err) {
        console.error("Erreur vision:", err);
      }
    }

    const newDoc: CustomDocument = {
      id: Date.now().toString(),
      name: uploadName,
      content: contentToStore,
      type: uploadImageFile ? 'image' : 'text',
      uploadedAt: new Date().toLocaleDateString()
    };

    onAddCustomDoc(newDoc);
    setUploadName('');
    setUploadText('');
    setUploadImageFile(null);
    setImagePreview(null);
    setIsUploading(false);
  };

  const SAMPLE_QUERIES = [
    { label: "📍 tMap Inner Join & Reject", query: "Donne-moi un exemple complet de configuration tMap avec Inner Join, expressions de transformation Java et capture des lignes rejetées (Catch Unmatched)." },
    { label: "🔒 Routine Java SHA-256", query: "Fournis la routine Java complète pour le hachage SHA-256 et montre comment l'appeler dans un composant tMap." },
    { label: "🌐 API REST avec tRESTRequest", query: "Explique l'architecture d'un job API REST Talend avec tRESTRequest, tExtractJSONFields et tRESTResponse avec un exemple de code." },
    { label: "⚡ tJava vs tJavaRow vs tJavaFlex", query: "Quelles sont les différences entre tJava, tJavaRow et tJavaFlex d'après le livre 2 ? Donne un exemple d'utilisation pour chacun." }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-7xl mx-auto px-2 sm:px-4 py-3">
      
      {/* Scope Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wide">
            Livres Actifs en Mémoire :
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {books.map(book => {
            const isSelected = activeBooks.includes(book.id);
            return (
              <button
                key={book.id}
                onClick={() => toggleBook(book.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs transition-all border ${
                  isSelected
                    ? 'bg-sky-500/10 text-sky-300 border-sky-500/40 font-medium'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-sky-400' : 'bg-slate-600'}`} />
                <span className="truncate max-w-[200px]">{book.title}</span>
              </button>
            );
          })}

          {customDocs.length > 0 && (
            <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full text-xs font-medium">
              +{customDocs.length} document(s) perso
            </span>
          )}

          <button
            onClick={() => setIsUploading(true)}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-full text-xs font-medium transition"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Ajouter un livre / extrait</span>
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
        <span className="text-[11px] text-slate-400 whitespace-nowrap font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Exemples du livre :
        </span>
        {SAMPLE_QUERIES.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(sq.query)}
            disabled={isLoading}
            className="text-xs whitespace-nowrap px-3 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700/60 transition shadow-sm hover:border-sky-500/50"
          >
            {sq.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-inner">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-[10px] text-slate-400 font-medium">
                {msg.sender === 'user' ? 'Vous' : 'TalendIA Agent'} • {msg.timestamp}
              </span>
            </div>

            <div
              className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-4 shadow-md ${
                msg.sender === 'user'
                  ? 'bg-sky-600 text-white rounded-tr-none'
                  : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-none'
              }`}
            >
              {/* Message Body rendering */}
              <div className="text-xs sm:text-sm leading-relaxed">
                {renderFormattedText(msg.text, msg.id, copiedId, handleCopy)}
              </div>

              {/* Diagrams Rendering */}
              {msg.diagrams && msg.diagrams.map((diag, dIdx) => (
                <JobFlowVisualizer key={dIdx} title={diag.title} preset={diag.type as any} />
              ))}

              {/* Book Citations Chips */}
              {msg.bookCitations && msg.bookCitations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-700/50 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-sky-400" /> Source de référence :
                  </span>
                  {msg.bookCitations.map((cite, cIdx) => (
                    <span
                      key={cIdx}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900/80 text-sky-300 border border-sky-500/30 font-mono"
                    >
                      {cite}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-3 p-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-300 text-xs w-fit">
            <Bot className="w-5 h-5 text-sky-400 animate-spin" />
            <span>TalendIA Agent analyse les chapitres et extrait les schémas...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="mt-3 flex items-center space-x-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Posez une question sur Talend (ex: Comment mapper deux tables dans tMap ?)..."
            disabled={isLoading}
            className="w-full bg-slate-900 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading || !inputMessage.trim()}
          className="bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white p-3 rounded-xl shadow-md transition flex items-center justify-center font-medium"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Modal for adding custom book/doc excerpts */}
      {isUploading && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Ajouter un Extrait / Livre Talend
                </h3>
              </div>
              <button
                onClick={() => setIsUploading(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Titre du document ou manuel
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Manuel Talend ESB 7.3 - Chapitre REST"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Image du Schéma de Job (Optionnel - Gemini Vision)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
                />
                {imagePreview && (
                  <div className="mt-2 relative w-32 h-20 rounded border border-slate-700 overflow-hidden">
                    <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Contenu textuel / Copier-coller du chapitre ou code
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Collez ici le texte d'un chapitre, des composants ou du code Java..."
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-xs font-semibold shadow-md"
                >
                  Indexer dans l'Agent IA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
