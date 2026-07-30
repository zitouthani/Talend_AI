import React, { useState } from 'react';
import { TOOLS_GUIDE_DATA } from '../data/toolsGuide';
import { BookOpen, Code2, Cloud, Cpu, MessageSquare, Check, AlertCircle, ArrowRight, Sparkles, Layers, Image as ImageIcon, ShieldCheck } from 'lucide-react';

export const ToolsGuideView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'nocode' | 'dev' | 'enterprise'>('all');
  const [activeToolId, setActiveToolId] = useState<string>('notebooklm');

  const filteredTools = TOOLS_GUIDE_DATA.filter(t => {
    if (filter === 'nocode') return t.difficulty.includes('Sans Code');
    if (filter === 'dev') return t.difficulty.includes('Développeur');
    if (filter === 'enterprise') return t.badge.includes('Enterprise') || t.badge.includes('GCP');
    return true;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return <BookOpen className="w-6 h-6 text-sky-400" />;
      case 'Code2': return <Code2 className="w-6 h-6 text-indigo-400" />;
      case 'Cloud': return <Cloud className="w-6 h-6 text-emerald-400" />;
      case 'Cpu': return <Cpu className="w-6 h-6 text-amber-400" />;
      case 'MessageSquare': return <MessageSquare className="w-6 h-6 text-purple-400" />;
      default: return <Sparkles className="w-6 h-6 text-sky-400" />;
    }
  };

  const selectedTool = TOOLS_GUIDE_DATA.find(t => t.id === activeToolId) || TOOLS_GUIDE_DATA[0];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      
      {/* Executive Direct Answer Box */}
      <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-indigo-950/80 border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4" />
          <span>Réponse directe à votre demande</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
          Quel est le meilleur outil pour créer un Agent IA basé sur 2 livres Talend (Texte + Exemples + Images) ?
        </h2>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Pour créer un Agent IA conversationnel nourri par vos <strong className="text-sky-300">2 livres Talend</strong> capable de restituer les <strong className="text-amber-300">exemples de code</strong> et les <strong className="text-emerald-300">schémas/images</strong>, vous avez <strong>3 approches principales</strong> selon votre niveau technique :
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-slate-900/90 border border-emerald-500/40 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 uppercase tracking-wide">
              Option n°1 (La plus rapide & Gratuite)
            </span>
            <h3 className="text-base font-bold text-white mt-2 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" /> Google NotebookLM
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Vous déposez vos 2 fichiers PDF Talend. L'agent analyse nativement le texte et les diagrammes, puis répond avec des citations exactes renvoyant aux pages.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-sky-500/40 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase tracking-wide">
              Option n°2 (Sur-Mesure / Web App)
            </span>
            <h3 className="text-base font-bold text-white mt-2 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-sky-400" /> API Gemini (Cette App !)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Développement d'une web app en Node/React avec la bibliothèque <code className="text-sky-300">@google/genai</code>. Permet de générer des diagrammes de jobs interactifs.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-purple-500/40 p-4 rounded-2xl shadow-sm">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 uppercase tracking-wide">
              Option n°3 (Entreprise & Cloud)
            </span>
            <h3 className="text-base font-bold text-white mt-2 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-purple-400" /> Vertex AI Agent Builder
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Indexation RAG d'entreprise dans Google Cloud Storage avec OCR multimodal pour préserver l'emplacement exact des images et figures.
            </p>
          </div>

        </div>
      </div>

      {/* RAG Multimodal Architecture Schematic */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>Fonctionnement d'un Agent Multimodal RAG pour Livres Talend</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center">
          
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center mb-2 font-bold">1</div>
            <h4 className="text-xs font-bold text-slate-200">Livres Talend (PDF)</h4>
            <p className="text-[11px] text-slate-400 mt-1">2 Livres : Manuels TOS ETL, routines Java, schémas tMap & APIs.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2 font-bold">2</div>
            <h4 className="text-xs font-bold text-slate-200">Analyse Multimodale</h4>
            <p className="text-[11px] text-slate-400 mt-1">Extraction du texte, du code Java/SQL et vision des schémas/images.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2 font-bold">3</div>
            <h4 className="text-xs font-bold text-slate-200">Indexation & Prompt</h4>
            <p className="text-[11px] text-slate-400 mt-1">Ancrage RAG (Grounding) pour forcer les réponses strictes sur le livre.</p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 font-bold">4</div>
            <h4 className="text-xs font-bold text-slate-200">Réponse de l'Agent</h4>
            <p className="text-[11px] text-slate-400 mt-1">Code couleur, citations de pages et schémas de jobs restitués.</p>
          </div>

        </div>
      </div>

      {/* Filter Tabs & Detailed Comparison */}
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-100">
            Comparatif des Outils pour créer votre Agent
          </h3>

          <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'all' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tous ({TOOLS_GUIDE_DATA.length})
            </button>
            <button
              onClick={() => setFilter('nocode')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'nocode' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sans Code
            </button>
            <button
              onClick={() => setFilter('dev')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'dev' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Développeur / API
            </button>
            <button
              onClick={() => setFilter('enterprise')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filter === 'enterprise' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Enterprise
            </button>
          </div>
        </div>

        {/* Tool selection grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredTools.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveToolId(t.id)}
              className={`text-left p-5 rounded-2xl border transition-all ${
                activeToolId === t.id
                  ? 'bg-slate-900 border-sky-400 shadow-xl ring-2 ring-sky-500/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  {getIcon(t.iconName)}
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30">
                  {t.badge}
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-100 mb-1">{t.name}</h4>
              <p className="text-xs text-slate-400 font-medium">{t.provider}</p>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Difficulté: <strong className="text-slate-200">{t.difficulty}</strong></span>
                <span>Coût: <strong className="text-emerald-400">{t.cost}</strong></span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Tool Details View */}
        {selectedTool && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  {getIcon(selectedTool.iconName)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedTool.name}</h3>
                  <p className="text-xs text-slate-400">{selectedTool.provider} • Coût : {selectedTool.cost}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/30">
                  {selectedTool.badge}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed mb-6 font-sans">
              {selectedTool.description}
            </p>

            {/* Support Metrics for Images & Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 mb-1">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Gestion des Images & Schémas du Livre :</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{selectedTool.imageSupport}</p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-200 mb-1">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span>Gestion du Code (Routines Java & SQL) :</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{selectedTool.codeSupport}</p>
              </div>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Avantages Clés
                </h4>
                <ul className="space-y-2">
                  {selectedTool.pros.map((pro, pIdx) => (
                    <li key={pIdx} className="text-xs text-slate-300 flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Points de Vigilance
                </h4>
                <ul className="space-y-2">
                  {selectedTool.cons.map((con, cIdx) => (
                    <li key={cIdx} className="text-xs text-slate-300 flex items-start space-x-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Step by Step Guide to Build */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <ArrowRight className="w-4 h-4" /> Étapes de Mise en Œuvre Pratique
              </h4>
              <div className="space-y-2 font-mono text-xs text-slate-300">
                {selectedTool.stepsToBuild.map((step, sIdx) => (
                  <div key={sIdx} className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                    {step}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
