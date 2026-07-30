import React, { useState } from 'react';
import { Book, CustomDocument } from '../types';
import { BookOpen, Search, FileText, Layers, Code, CheckCircle, Database } from 'lucide-react';
import { JobFlowVisualizer } from './JobFlowVisualizer';

interface BooksExplorerProps {
  books: Book[];
  customDocs: CustomDocument[];
}

export const BooksExplorer: React.FC<BooksExplorerProps> = ({ books, customDocs }) => {
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id || 'book-1');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const selectedBook = books.find(b => b.id === selectedBookId);

  const filteredChapters = selectedBook?.chapters.filter(ch =>
    ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Header section */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
          <BookOpen className="w-6 h-6 text-sky-400" />
          <span>Bibliothèque des Livres & Manuels Talend Indexés</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Explorez le contenu des livres de référence Talend chargés en mémoire pour l'Agent IA.
        </p>
      </div>

      {/* Book Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        
        {/* Book Selectors */}
        <div className="flex flex-wrap gap-2">
          {books.map(book => (
            <button
              key={book.id}
              onClick={() => setSelectedBookId(book.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition border ${
                selectedBookId === book.id
                  ? 'bg-sky-500 text-white border-sky-400 shadow-lg shadow-sky-500/20'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{book.title}</span>
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher un composant (tMap, REST, Routine Java)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

      </div>

      {/* Main Book Content Section */}
      {selectedBook && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chapter Outline Sidebar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm lg:col-span-1">
            <div className="pb-3 mb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sommaire du Livre ({selectedBook.chapters.length} Chapitres)
              </span>
              <h3 className="text-sm font-bold text-slate-100 mt-1">{selectedBook.title}</h3>
              <span className="text-[11px] text-slate-400">{selectedBook.author} • {selectedBook.pages} pages</span>
            </div>

            <div className="space-y-2">
              {filteredChapters.map(ch => (
                <div
                  key={ch.num}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-sky-500/40 transition"
                >
                  <span className="text-[10px] font-mono font-bold text-sky-400 uppercase">
                    Chapitre {ch.num}
                  </span>
                  <h4 className="text-xs font-semibold text-slate-200 mt-0.5">{ch.title}</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Chapters Details & Visual Examples */}
          <div className="lg:col-span-2 space-y-6">
            {filteredChapters.map(ch => (
              <div
                key={ch.num}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-800">
                  <span className="px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/30 font-mono text-xs font-bold">
                    Chapitre {ch.num}
                  </span>
                  <h3 className="text-base font-bold text-slate-100">{ch.title}</h3>
                </div>

                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 mb-4 font-mono">
                  {ch.content}
                </div>

                {/* Render visual Job Flow Diagram depending on Chapter topic */}
                {ch.title.includes('tMap') && (
                  <JobFlowVisualizer
                    title="Schéma d'Exemple tMap : Inner Join + Catch Output Reject"
                    description="Extrait du Chapitre 2 : Routage des données valides vers tDBOutput et enregistrement des clés manquantes dans tLogRow_Reject."
                    preset="tmap-etl"
                  />
                )}

                {ch.title.includes('REST') && (
                  <JobFlowVisualizer
                    title="Schéma d'Exemple API REST : tRESTRequest + tExtractJSONFields"
                    description="Extrait du Chapitre 1 (Livre 2) : Exposition d'un endpoint HTTP et parsing du payload JSON."
                    preset="rest-api"
                  />
                )}

                {ch.title.includes('Bases de Données') && (
                  <JobFlowVisualizer
                    title="Orchestration & Transactions DB : tPrejob -> tDBConnection -> tMap -> tPostjob"
                    description="Extrait du Chapitre 3 (Livre 1) : Gestion de la transaction de base de données."
                    preset="db-transaction"
                  />
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* User Custom Uploaded Documents section */}
      {customDocs.length > 0 && (
        <div className="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-purple-400" />
            <span>Vos Extraits & Documents Importés ({customDocs.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customDocs.map(doc => (
              <div key={doc.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-purple-300">{doc.name}</span>
                  <span className="text-[10px] text-slate-500">{doc.uploadedAt}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-3 font-mono">{doc.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
