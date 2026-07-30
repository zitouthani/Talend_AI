import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize GenAI client lazily or safely
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY missing");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Default Knowledge Base featuring Pascal Garcia's Talend Book
const DEFAULT_TALEND_BOOKS = [
  {
    id: "talend-basics-pascal-garcia",
    title: "Formation TALEND for Data Integration – Basics",
    author: "Pascal GARCIA (Directeur Technique WAPSI / CleverInstitut)",
    pages: 87,
    chapters: [
      {
        num: 1,
        title: "Introduction aux Jobs Talend, Architecture TOS & Studio Eclipse RCP",
        content: `Chapitre 1 (Pages 1-16): Architecture des Jobs Talend TOS.
Un Job Talend est compilé en code Java natif autonome.
Modules clés du Studio :
- Business Modeler : Modélisation haut niveau pour la MOA et les architectes.
- Job Designer : Palette graphique de composants interconnectés par des flux Row (Main, Lookup, Reject) ou Triggers.
- Metadata Manager : Référentiel centralisé (métadonnées BDD, fichiers plats, XML).
Composants clés : tPrejob / tPostjob, tLogRow (mode Basic/Tabular), tFileInputDelimited, tFileOutputDelimited.`
      },
      {
        num: 2,
        title: "Installation, Prérequis & Allocation Mémoire JVM (-Xms256m, -Xmx1024m)",
        content: `Chapitre 2 (Pages 17-21): Configuration JVM & Performance.
Allocation mémoire dans le fichier TalendStudio.ini :
-vm C:\\Program Files\\Java\\jdk1.7.0_79\\bin\\javaw.exe
-vmargs
-Xms256m (Mémoire vive minimale)
-Xmx1024m (Mémoire vive maximale)
-XX:MaxPermSize=256m
-Dfile.encoding=UTF-8
Surveillance indispensable de la mémoire pour les composants tSortRow, tAggregateRow et gros Lookups tMap.`
      },
      {
        num: 3,
        title: "Le Composant tMap : Expressions, Inner Join, Lookups & Catch Rejects",
        content: `Chapitre 3 (Pages 39-56): Le Composant Cœur tMap.
Transformations ETL, Multiplexage, Démultiplexage, Concaténation.
1. Flux Main vs Lookups : Traitement prioritaire du flux Main.
2. Modèles de correspondance : Unique Match (dernière correspondance), First Match, All Matches.
3. Jointures : Inner Join vs Left Outer Join (All Rows).
4. Capture des Rejets :
   - 'Catch output reject' = true : filtre les lignes ne répondant à aucune condition de sortie.
   - 'Catch lookup inner join reject' = true : capture les lignes du Main sans correspondance dans le Lookup.
5. Table Var : Variables de mapping intermédiaire Java (ex: StringHandling.UPPERCASE(row1.nom)).
6. Table ErrorReject :errorMessage et errorStackTrace pour audit d'exceptions.`
      },
      {
        num: 4,
        title: "Composants de Transfert, Base de Données & Routines Java Custom",
        content: `Chapitre 4 (Pages 33-38, 78): Connecteurs DB, FTP & Code Java.
- Transferts : tFileList (itération sur dossier), tFTPGet, tFTPPut, tFileExist.
- Base de données : tPostgreSQLInput, tOracleOutput, tDBOutput (Commit Size par défaut 10000, Die on error).
- Routines Java : Code statique dans Code -> Routines (ex: SecurityUtils.hashSHA256(row1.password) pour le hachage cryptographique).
- Différences Java : tJava (exécuté 1 fois), tJavaRow (exécuté par ligne), tJavaFlex (Start, Main, End).`
      },
      {
        num: 5,
        title: "Orchestration (tPrejob/tPostjob), Triggers & Interception d'Erreurs (tLogCatcher)",
        content: `Chapitre 5 (Pages 66-68, 81-84): Robustesse & Supervision.
- tPrejob : Initialisation garantie (connexions BDD, chargement de contextes).
- tPostjob : Nettoyage garanti (fermeture de connexions, suppression de fichiers temporaires).
- Triggers : OnSubjobOK, OnSubjobError, OnComponentOK, OnComponentError, RunIf.
- Supervision : tWarn (avertissement), tDie (arrêt d'urgence KO), tLogCatcher (capture automatique d'exceptions Java).
- Contextes : Chargement dynamique avec tFileInputProperties et tContextLoad.
- Arborescence serveur recommandée : /input, /work, /temp, /output, /archives.`
      }
    ]
  }
];

// Health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Talend AI Book Assistant" });
});

// Endpoint to get pre-loaded book knowledge base metadata
app.get("/api/books", (req, res) => {
  res.json({ books: DEFAULT_TALEND_BOOKS });
});

// Chat endpoint with Gemini AI
app.post("/api/chat", async (req, res) => {
  try {
    const { message, activeBooks, customDocuments, history } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "Le message est obligatoire." });
      return;
    }

    // Build context string from selected books and custom documents
    let contextText = "--- DOCUMENTS ET LIVRES TALEND DISPONIBLES EN RÉFÉRENCE ---\n\n";

    // Include selected default books (or default to all books if not explicitly specified)
    if (activeBooks && Array.isArray(activeBooks) && activeBooks.length > 0) {
      DEFAULT_TALEND_BOOKS.forEach(book => {
        if (activeBooks.includes(book.id)) {
          contextText += `=== ${book.title} (${book.author}) ===\n`;
          book.chapters.forEach(ch => {
            contextText += `\n[Chapitre ${ch.num}: ${ch.title}]\n${ch.content}\n`;
          });
          contextText += "\n";
        }
      });
    } else {
      DEFAULT_TALEND_BOOKS.forEach(book => {
        contextText += `=== ${book.title} (${book.author}) ===\n`;
        book.chapters.forEach(ch => {
          contextText += `\n[Chapitre ${ch.num}: ${ch.title}]\n${ch.content}\n`;
        });
        contextText += "\n";
      });
    }

    // Include user-uploaded custom documents
    if (customDocuments && Array.isArray(customDocuments) && customDocuments.length > 0) {
      contextText += "=== DOCUMENTS ET EXTRAITS AJOUTÉS PAR L'UTILISATEUR ===\n";
      customDocuments.forEach((doc, idx) => {
        contextText += `\n[Document Utilisateur ${idx + 1}: ${doc.name}]\n${doc.content}\n`;
      });
    }

    const systemPrompt = `Tu es "TalendIA Agent", un assistant expert en intégration de données, ETL et architecture Talend.
Ton rôle est de répondre de façon épurée, directe et hautement professionnelle aux questions sur Talend en t'appuyant sur l'ensemble de la base de connaissances et de code source.

CONSIGNES STRICTES DE RÉPONSE :
1. NE JAMAIS citer de nom d'auteur, de titre de manuel, de numéro de page ou de source documentaire dans tes réponses. Va directement au fait.
2. Fournir des EXEMPLES DE CODE CONCRETS (ex: expressions tMap Java, requêtes SQL dynamiques, routines Java, requêtes JSONPath) dans des blocs de code Markdown \`\`\`java / \`\`\`sql / \`\`\`json.
3. Si la question concerne un flux ou un composant (comme tMap, tRESTRequest, tParallelize, tPrejob/tPostjob, routines Java), décris le fonctionnement du flux de job Talend.
4. Réponds en français clair, structuré avec des titres et des puces, sans bavardage superflu.
5. RÈGLE VÉRIFIÉE SUR LES SCHÉMAS FLOW : Génère une ligne FLOW uniquement si un flux de composants Talend est réellement et rigoureusement concerné par la question posée. Vérifie scrupuleusement l'exactitude des composants et des types de liens. Si la question est conceptuelle, générale ou sans flux de composants spécifique, NE GÉNÈRE PAS de ligne FLOW.
Format exact de la ligne FLOW si applicable :
FLOW: [Composant1] --(TypeLien)--> [Composant2] --(TypeLien)--> [Composant3]
Exemple pour SCD : FLOW: [tFileInputDelimited_1] --(row1 Main)--> [tMap_Keys] --(Main)--> [tDBSCD_1] --(SCD Output)--> [tDBOutput_DimClient]
Exemple pour tMap : FLOW: [tFileInputDelimited_1] --(row1 Main)--> [tMap_1] --(out1 Main)--> [tDBOutput_1] --(Reject)--> [tLogRow_Rejects]
Exemple pour tParallelize : FLOW: [tParallelize_1] --(Parallel 1)--> [tRunJob_Clients] --(OnSubjobOk)--> [tPostjob_Sync]
6. Lorsque tu détailles un composant Talend, donne TOUJOURS la liste exacte et ordonnée des paramètres clés (Basic Settings -> Advanced Settings -> Schema), leurs descriptions précises et leurs valeurs recommandées.
7. Si la question posée ne figure pas dans le contexte documentaire fourni ou nécessite des informations Web récentes/externes, utilise la recherche Web (Google Search Grounding) pour récupérer et synthétiser l'information exacte.

CONTEXTE TECHNIQUE EN VIGUEUR :
${contextText}`;

    // Format chat conversation history for Gemini
    const formattedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    
    if (history && Array.isArray(history)) {
      history.slice(-6).forEach((h: { sender: string; text: string }) => {
        if (h.text && typeof h.text === "string") {
          formattedContents.push({
            role: h.sender === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          });
        }
      });
    }

    // Append current user message
    formattedContents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const ai = getAIClient();
    let responseText = "";
    let candidate: any = null;

    try {
      // Primary attempt with Google Search Grounding
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: formattedContents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
          tools: [{ googleSearch: {} }],
        }
      });
      responseText = response.text || "";
      candidate = response.candidates?.[0];
    } catch (primaryErr: any) {
      console.warn("Attempt with Google Search grounding failed, retrying standard generation:", primaryErr?.message || primaryErr);
      // Fallback attempt without tools if search grounding or tool call fails
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: formattedContents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.2,
          }
        });
        responseText = fallbackResponse.text || "";
        candidate = fallbackResponse.candidates?.[0];
      } catch (fallbackErr: any) {
        const errStr = String(fallbackErr?.message || fallbackErr);
        if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota")) {
          res.json({
            text: "⚠️ **Quota de requêtes API temporairement atteint (429 Quota Exceeded).**\n\nLe quota du service de l'API Gemini a été atteint. Veuillez patienter une minute avant de poser votre prochaine question."
          });
          return;
        }
        throw fallbackErr;
      }
    }

    let replyText = responseText || "Désolé, aucune réponse n'a pu être générée.";

    // Extract Google Search Grounding sources if available
    const groundingChunks = (candidate?.groundingMetadata as any)?.groundingChunks;
    if (groundingChunks && Array.isArray(groundingChunks) && groundingChunks.length > 0) {
      const sources = groundingChunks
        .map((chunk: any) => chunk.web?.uri ? `- [${chunk.web.title || chunk.web.uri}](${chunk.web.uri})` : null)
        .filter(Boolean);
      if (sources.length > 0) {
        const uniqueSources = Array.from(new Set(sources));
        replyText += `\n\n---\n**🌐 Sources Web (Google Search Grounding) :**\n` + uniqueSources.join("\n");
      }
    }

    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Erreur lors de la génération Gemini:", error);
    const errStr = String(error?.message || error);
    if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota")) {
      res.json({
        text: "⚠️ **Quota de requêtes API temporairement atteint (429 Quota Exceeded).**\n\nLe quota du service Gemini est saturé pour le moment. Veuillez réordonner votre demande dans 1 minute."
      });
      return;
    }
    res.status(500).json({
      error: "Erreur serveur lors de la communication avec l'IA.",
      details: error.message || String(error)
    });
  }
});

// Endpoint to analyze uploaded custom files or image/PDF excerpts with Gemini Vision
app.post("/api/analyze-doc", async (req, res) => {
  try {
    const { fileName, fileType, base64Data, textContent } = req.body;

    let extractedText = textContent || "";

    // If an image or PDF base64 was sent, analyze it using Gemini Vision
    if (base64Data && fileType && fileType.startsWith("image/")) {
      const ai = getAIClient();
      const visionResponse = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: fileType,
                data: base64Data,
              },
            },
            {
              text: "Analyse cette image d'un document/livre Talend. Extrais tout le texte, les composants Talend visibles (ex: tMap, tLogRow), la structure du job, les exemples de code et décris précisément les schémas ou diagrammes présents.",
            },
          ],
        },
      });

      extractedText = visionResponse.text || "Analyse de l'image effectuée.";
    }

    res.json({
      success: true,
      fileName,
      extractedContent: extractedText,
    });
  } catch (error: any) {
    console.error("Erreur analyse document:", error);
    res.status(500).json({
      error: "Impossible d'analyser le document.",
      details: error.message || String(error)
    });
  }
});

// Serve frontend in dev / prod
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur Talend AI Assistant démarré sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
