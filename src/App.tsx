import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ChatAgent } from './components/ChatAgent';
import { BooksExplorer } from './components/BooksExplorer';
import { ToolsGuideView } from './components/ToolsGuideView';
import { Book, CustomDocument } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'books' | 'tools'>('chat');
  
  // Default Talend Books
  const [books, setBooks] = useState<Book[]>([
    {
      id: "book-1",
      title: "Livre 1 : Talend Open Studio ETL Fundamentals & Composants",
      author: "Guide d'Architecture Talend & Pratiques ETL",
      pages: 320,
      chapters: [
        {
          num: 1,
          title: "Introduction aux Jobs Talend & Architecture du Studio",
          content: `Chapitre 1: Architecture des Jobs Talend TOS. Un Job Talend est compilé en Java autonome. Composants clés: tPrejob/tPostjob, tLogRow, tFileInputDelimited. Triggers vs Main Data Flow.`
        },
        {
          num: 2,
          title: "Le Composant tMap : Expressions, Join, Catch Unmatched",
          content: `Chapitre 2: Le Composant Cœur tMap. Transformation, Inner Join vs Left Join, Expression Builder, Catch Unmatched Rows pour déduplication et rejet.`
        },
        {
          num: 3,
          title: "Gestion des Bases de Données (tDBInput, tDBOutput, TransactSQL)",
          content: `Chapitre 3: Composants Base de Données (tPostgreSQLInput, tOracleOutput, tDBOutput). Commit Size, Actions Insert/Update, Die on error.`
        }
      ]
    },
    {
      id: "book-2",
      title: "Livre 2 : Architecture Talend Avancée - API REST & Routines Java",
      author: "Expertise Enterprise Data Integration & Cloud",
      pages: 410,
      chapters: [
        {
          num: 1,
          title: "Web Services & REST APIs (tRESTRequest, tRESTResponse, tExtractJSONFields)",
          content: `Chapitre 1: API REST Talend ESB. tRESTRequest, tExtractJSONFields (JSONPath), tRESTResponse avec codes HTTP.`
        },
        {
          num: 2,
          title: "Routines Java Personnalisées & Composants tJava / tJavaRow / tJavaFlex",
          content: `Chapitre 2: Code Java Custom dans Talend. Routines Java dans le Repository (SecurityUtils.hashSHA256). tJava vs tJavaRow vs tJavaFlex.`
        },
        {
          num: 3,
          title: "Orchestration, Parallel Processing et Gestion des Erreurs",
          content: `Chapitre 3: Multi-threading avec tParallelize, tLogCatcher, tStatCatcher, Buffer Memory/Disk storage.`
        }
      ]
    }
  ]);

  const [activeBooks, setActiveBooks] = useState<string[]>(['book-1', 'book-2']);
  const [customDocs, setCustomDocs] = useState<CustomDocument[]>([]);

  // Fetch pre-loaded books from API if available
  useEffect(() => {
    fetch('/api/books')
      .then(res => res.json())
      .then(data => {
        if (data.books && Array.isArray(data.books)) {
          setBooks(data.books);
        }
      })
      .catch(err => console.log("Backend offline or booting:", err));
  }, []);

  const toggleBook = (id: string) => {
    setActiveBooks(prev =>
      prev.includes(id) ? prev.filter(bId => bId !== id) : [...prev, id]
    );
  };

  const handleAddCustomDoc = (doc: CustomDocument) => {
    setCustomDocs(prev => [...prev, doc]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeBooksCount={activeBooks.length}
      />

      {/* Main Screen Views */}
      <main className="pb-10">
        {activeTab === 'chat' && (
          <ChatAgent
            books={books}
            activeBooks={activeBooks}
            toggleBook={toggleBook}
            customDocs={customDocs}
            onAddCustomDoc={handleAddCustomDoc}
          />
        )}

        {activeTab === 'books' && (
          <BooksExplorer
            books={books}
            customDocs={customDocs}
          />
        )}

        {activeTab === 'tools' && (
          <ToolsGuideView />
        )}
      </main>
    </div>
  );
}
