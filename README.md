# Talend.AI Book Agent & Architecture Explorer

Application web full-stack d'Agent IA conversationnel conçue pour absorber, analyser et interroger les livres et manuels de référence **Talend Open Studio (TOS) ETL & Enterprise Architecture**.

![Talend AI Agent](https://img.shields.io/badge/Gemini-3.6%20Flash-sky)
![React](https://img.shields.io/badge/React-19-indigo)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)

---

## 🌟 Fonctionnalités Principales

- 🤖 **Agent Conversationnel RAG Multimodal** : Interrogation en langage naturel des livres Talend chargés en mémoire.
- 📜 **Citations de Sources Précises** : Renvois vers les chapitres et pages des manuels Talend.
- 💻 **Extraction & Coloration de Code** : Routines Java custom (`SecurityUtils.hashSHA256`), requêtes SQL dynamiques et expressions `tMap` prêtes à être copiées.
- 📊 **Schémas de Flux de Jobs Interactifs** : Génération visuelle de diagrammes de jobs (`tMap Inner Join & Catch Reject`, `tRESTRequest API`, `tPrejob -> tDBConnection`).
- 📁 **Import d'Extraits & Documents Personnalisés** : Indexation d'extraits textuels et analyse d'images de diagrammes de jobs via **Gemini Vision**.
- 🛠️ **Guide Comparatif Intégré** : Explication détaillée des outils (NotebookLM, Gemini API, Vertex AI, AnythingLLM, GPTs) pour répondre au besoin d'absorber 2 livres Talend.

---

## 🚀 Structure du Projet

```text
.
├── server.ts                       # Serveur Express & Intégration Gemini 3.6 Flash API (@google/genai)
├── src/
│   ├── App.tsx                     # Composant principal & Navigation par onglets
│   ├── components/
│   │   ├── ChatAgent.tsx           # Interface de dialogue Agent IA avec formatage de code & citations
│   │   ├── BooksExplorer.tsx       # Explorateur des 2 livres & chapitres Talend
│   │   ├── JobFlowVisualizer.tsx   # Générateur graphique de schémas de jobs Talend
│   │   ├── ToolsGuideView.tsx      # Guide comparatif des outils pour Agent Talend
│   │   └── Navbar.tsx              # Barre de navigation responsive
│   ├── data/
│   │   └── toolsGuide.ts           # Données comparatives des outils Agent IA
│   └── types.ts                    # Interfaces et types TypeScript
├── .env.example                    # Modèle des variables d'environnement
├── metadata.json                   # Métadonnées d'application AI Studio
├── package.json                    # Dépendances et scripts de build
└── vite.config.ts                  # Configuration Vite & Tailwind CSS v4
```

---

## 🛠️ Exporter vers GitHub (Exportation depuis AI Studio)

Pour exporter cette application vers votre compte **GitHub** depuis Google AI Studio :

1. Cliquez sur le **Menu d'options / Paramètres** (icône d'engrenage ⚙️ ou le menu haut droit).
2. Sélectionnez **"Export to GitHub"** (ou *Exporter vers GitHub* / *Download ZIP*).
3. Connectez votre compte GitHub et choisissez le nom du dépôt destination.
4. AI Studio poussera automatiquement la totalité du code source propre avec l'historique de commits.

---

## 💻 Installation & Exécution en Local

### Prerequisites
- Node.js (v18+ ou v20+)
- Une clé API Google Gemini (gratuite sur [Google AI Studio](https://aistudio.google.com))

### 1. Cloner le dépôt et installer les dépendances

```bash
git clone https://github.com/votre-compte/talend-ai-book-agent.git
cd talend-ai-book-agent
npm install
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` à la racine :

```bash
cp .env.example .env
```

Éditez `.env` pour ajouter votre clé API Gemini :

```env
GEMINI_API_KEY="VOTRE_CLE_API_GEMINI"
```

### 3. Lancer en Mode Développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`.

### 4. Compiler pour la Production

```bash
npm run build
npm start
```

---

## 🧪 Verification & Qualité du Code

Pour vérifier l'absence d'erreurs TypeScript et valider la compilation :

```bash
npm run lint
npm run build
```

---

## 📄 Licence

MIT License - Libre pour réutilisation et adaptation.
