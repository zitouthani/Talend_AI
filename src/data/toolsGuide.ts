import { ToolOption } from "../types";

export const TOOLS_GUIDE_DATA: ToolOption[] = [
  {
    id: "notebooklm",
    name: "Google NotebookLM",
    provider: "Google Labs (Gemini 2.5 / 3.6 Multimodal)",
    badge: "Recommandé n°1 (Gratuit & Ultra-Performant)",
    iconName: "BookOpen",
    imageSupport: "Excellente analyse multimodale des schémas de jobs, diagrammes tMap et captures d'écran contenus dans le PDF.",
    codeSupport: "Extrait et explique parfaitement les routines Java, expressions tMap et requêtes SQL.",
    difficulty: "Facile (Sans Code)",
    cost: "Gratuit",
    description: "NotebookLM est l'outil parfait spécifiquement conçu par Google pour absorber des livres complets, manuels PDF et documents techniques (jusqu'à 50 sources et 500 000 mots par source). Il répond avec des citations exactes renvoyant aux pages du livre.",
    pros: [
      "Prise en charge native des fichiers PDF (texte + images/schémas)",
      "Citations de sources interactives (cliquez sur une note pour voir la page exacte du livre)",
      "Résumé automatique des chapitres Talend et création d'un guide d'étude",
      "Aucune compétence en programmation requise (glisser-déposer des 2 livres)"
    ],
    cons: [
      "L'export direct des images extraites en téléchargement nécessite parfois de demander la description textuelle des diagrammes.",
      "Réservé à un usage personnel ou d'équipe via le navigateur Web."
    ],
    stepsToBuild: [
      "1. Rendez-vous sur https://notebooklm.google.com",
      "2. Créez un nouveau Notebook intitulé 'Agent Talend - Livres de Référence'.",
      "3. Glissez-déposez vos 2 fichiers PDF de livres Talend dans la zone des sources.",
      "4. Attendez l'indexation multimodale automatique (quelques secondes).",
      "5. Posez des questions comme : 'Donne-moi un exemple de routine Java pour le hachage avec le schéma tMap issu du chapitre 2'."
    ],
    recommendedFor: "Développeurs et Data Engineers voulant interroger 2 livres Talend immédiatement sans coder."
  },
  {
    id: "custom-gemini-app",
    name: "Application Web Personnalisée avec SDK Gemini API (@google/genai)",
    provider: "Google AI Studio / Gemini 3.6 Flash & 3.1 Pro",
    badge: "Sur-Mesure (Développement Web)",
    iconName: "Code2",
    imageSupport: "Gestion totale des images via Gemini Vision API (base64/inlineData) et découpage de pages PDF en images HD.",
    codeSupport: "Contrôle total des blocs de code, coloration syntaxique, exécution ou validation de requêtes Talend.",
    difficulty: "Avancé (Développeur)",
    cost: "Pay-as-you-go très faible (ou niveau gratuit Google AI Studio)",
    description: "C'est la solution que nous avons créée dans cette application ! Vous déployez un serveur Express/React qui transmet les chapitres, schémas et extraits d'images directement au modèle Gemini via l'API officielle.",
    pros: [
      "Interface utilisateur 100% personnalisable adaptée à la charte de votre entreprise",
      "Possibilité d'afficher des diagrammes interactifs SVG/Mermaid pour chaque job Talend",
      "Intégration possible dans votre intranet, Slack ou Microsoft Teams",
      "Sécurité totale des données avec contrôle du contexte et des clés API côté serveur"
    ],
    cons: [
      "Nécessite de maintenir une application web (Node.js/React ou Python/Streamlit)."
    ],
    stepsToBuild: [
      "1. Récupérez une clé API sur Google AI Studio (https://aistudio.google.com).",
      "2. Installez le package officiel npm : npm install @google/genai express.",
      "3. Envoyez les pages du livre sous forme de texte ou d'images base64 avec le prompt d'analyse.",
      "4. Affichez les réponses enrichies de snippets de code et d'explications dans un composant Chat."
    ],
    recommendedFor: "Entreprises ou développeurs souhaitant intégrer un agent Talend dédié dans leurs propres outils métier."
  },
  {
    id: "vertex-ai-agent",
    name: "Google Cloud Vertex AI Search & Conversation",
    provider: "Google Cloud Platform",
    badge: "Solution Enterprise (Cloud)",
    iconName: "Cloud",
    imageSupport: "Analyse documentaire avancée avec OCR de haute précision et extraction d'images/figures.",
    codeSupport: "RAG d'entreprise sécurisé avec filtres et métadonnées sur le code source.",
    difficulty: "Intermédiaire",
    cost: "Pay-per-query (Crédits d'essai GCP disponibles)",
    description: "La plateforme d'IA d'entreprise de Google Cloud permettant de créer un Agent RAG conversationnel basé sur vos documents déposés dans un bucket Google Cloud Storage.",
    pros: [
      "Capacité de montée en charge industrielle (milliers de documents)",
      "Extraction OCR et mise en page sophistiquée conservant l'emplacement des schémas et tableaux",
      "Authentification IAM d'entreprise, conformité SOC2 / RGPD",
      "Widget de Chat prêt à être embarqué dans n'importe quel site intranet"
    ],
    cons: [
      "Nécessite un compte Google Cloud actif et la configuration d'une Data Store."
    ],
    stepsToBuild: [
      "1. Ouvrez Google Cloud Console > Vertex AI Agent Builder.",
      "2. Créez un Bucket GCS et téléversez les 2 livres Talend.",
      "3. Créez une 'Data Store' de type Unstructured Document avec OCR/Vision activé.",
      "4. Associez la Data Store à un nouvel Agent Search & Conversation et testez le dialogue."
    ],
    recommendedFor: "Équipes Data Enterprise qui ont besoin d'un agent Talend sécurisé GCP."
  },
  {
    id: "anything-llm",
    name: "AnythingLLM / Dify.ai",
    provider: "Open Source / Desktop & Auto-hébergé",
    badge: "Open-Source & Local",
    iconName: "Cpu",
    imageSupport: "Prise en charge des images selon le modèle LLM multimodal connecté (ex: Ollama LLaVA ou Gemini).",
    codeSupport: "Bonne détection des blocs de code dans les documents vectorisés.",
    difficulty: "Intermédiaire",
    cost: "Gratuit (Open Source)",
    description: "Une application de bureau ou serveur qui transforme n'importe quelle collection de livres/PDFs en un espace de travail conversationnel privé.",
    pros: [
      "Installation en un clic sur Mac/Windows/Linux avec interface intuitive",
      "100% privé : possibilité de faire tourner l'agent entièrement hors-ligne",
      "Bases vectorielles intégrées (LanceDB, ChromaDB)"
    ],
    cons: [
      "Nécessite une machine avec suffisamment de mémoire RAM si exécuté localement."
    ],
    stepsToBuild: [
      "1. Téléchargez AnythingLLM Desktop (https://anythingllm.com).",
      "2. Créez un 'Workspace' nommé Talend Books.",
      "3. Déposez les 2 livres au format PDF ou EPUB.",
      "4. Connectez votre clé Gemini API ou un modèle multimodal local."
    ],
    recommendedFor: "Utilisateurs voulant une solution desktop indépendante sans coder."
  },
  {
    id: "custom-gpts",
    name: "ChatGPT Custom GPTs",
    provider: "OpenAI (ChatGPT Plus / Team / Enterprise)",
    badge: "Populaire (Abonnement requis)",
    iconName: "MessageSquare",
    imageSupport: "Analyse les images et schémas du PDF via Code Interpreter / Vision.",
    codeSupport: "Analyse et génération de code Java / Talend très fluide.",
    difficulty: "Facile (Sans Code)",
    cost: "Abonnement ChatGPT Plus (~20$/mois)",
    description: "Permet de créer un GPT personnalisé dans l'interface ChatGPT en chargeant les 2 livres dans la section 'Knowledge'.",
    pros: [
      "Très rapide à configurer dans l'interface ChatGPT",
      "Code Interpreter capable de lire les tableaux et extraire le texte des PDF"
    ],
    cons: [
      "Nécessite un abonnement payant ChatGPT Plus",
      "Les images complexes issues des PDF peuvent parfois nécessiter une re-description textuelle"
    ],
    stepsToBuild: [
      "1. Dans ChatGPT, cliquez sur 'Explore GPTs' > 'Create'.",
      "2. Nommez le GPT 'Expert Talend Books'.",
      "3. Dans l'onglet Configure, téléversez les 2 livres Talend dans 'Knowledge'.",
      "4. Ajoutez les consignes pour citer les chapitres et fournir les exemples de code."
    ],
    recommendedFor: "Abonnés ChatGPT Plus cherchant une solution rapide."
  }
];
