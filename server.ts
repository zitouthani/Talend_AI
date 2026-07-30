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

// Default Knowledge Base of 2 Talend Books
const DEFAULT_TALEND_BOOKS = [
  {
    id: "book-1",
    title: "Livre 1 : Talend Open Studio Data Integration - Maîtrise des Composants et ETL",
    author: "Guide d'Architecture Talend & Pratiques ETL",
    pages: 320,
    chapters: [
      {
        num: 1,
        title: "Introduction aux Jobs Talend & Architecture du Studio",
        content: `Chapitre 1: Architecture des Jobs Talend TOS.
Un Job Talend est compilé en un fichier Java autonome.
Composants clés:
- tPrejob / tPostjob : Exécution inconditionnelle avant/après le job principal.
- tLogRow : Console d'affichage (mode Tabular ou Basic).
- tFileInputDelimited : Lecture de fichiers CSV/TXT avec gestion des séparateurs (;, ,, tab).
Schéma d'interconnexion:
Trigger (OnSubjobOk, OnComponentOk, RunIf) vs Main Data Flow (Row -> Main).
Variables de contexte : context.myVariable, alimentées via tContextLoad ou fichiers .properties.`
      },
      {
        num: 2,
        title: "Le Composant tMap : Expressions, Join, Catch Unmatched",
        content: `Chapitre 2: Le Composant Cœur tMap.
Le composant tMap est le centre névralgique de transformation dans Talend.
Fonctionnalités:
1. Inner Join vs Left Outer Join vs Unique Match / First Match / All Matches.
2. Expression Builder : Routines Java standards (Numeric.sequence, Var.myVar, StringHandling.UPPERCASE).
3. Catch Unmatched Rows : Routage des lignes rejetées vers une sortie dédiée pour déduplication ou audit.
Exemple d'expression tMap pour nettoyage de date:
TalendDataGenerator.getFirstName() + " " + StringHandling.UPPER(row1.nom)
Exemple Catch Reject: Activer "Catch output reject" sur la table de sortie pour capter les clés non trouvées lors du Inner Join.`
      },
      {
        num: 3,
        title: "Gestion des Bases de Données (tDBInput, tDBOutput, TransactSQL)",
        content: `Chapitre 3: Composants Base de Données (tPostgreSQLInput, tOracleOutput, tDBOutput).
Optimisation des flux DB:
- Commit Size : Nombre de lignes par lot (par défaut 10000).
- Action sur les données : Insert, Update, Insert or Update, Delete.
- Die on error : Si coché, stoppe le subjob en cas d'erreur SQL.
Exemple SQL avec variable de contexte:
"SELECT id, code_client, montant FROM transactions WHERE date_transaction >= '" + context.date_debut + "'"
Gestion des transactions : tDBConnection, tDBCommit, tDBRollback.`
      }
    ]
  },
  {
    id: "book-2",
    title: "Livre 2 : Architecture Talend Avancée - API REST, JSON & Routines Java Custom",
    author: "Expertise Enterprise Data Integration & Cloud",
    pages: 410,
    chapters: [
      {
        num: 1,
        title: "Web Services & REST APIs (tRESTRequest, tRESTResponse, tExtractJSONFields)",
        content: `Chapitre 1: Création d'API REST avec Talend ESB.
Composants API:
- tRESTRequest : Expose un endpoint HTTP REST (GET /api/v1/customers/{id}, POST /api/v1/orders).
- tExtractJSONFields : Parse un flux JSON complexe via JSONPath ou XPath (ex: $.data.users[*].email).
- tRESTResponse : Renvoie le status HTTP (200 OK, 400 Bad Request, 500 Error) et le body JSON/XML.
Exemple d'extraction JSON:
Query Loop: "$.customers[*]"
Field Mapping: id -> "id", email -> "attributes.email", city -> "address.city".`
      },
      {
        num: 2,
        title: "Routines Java Personnalisées & Composants tJava / tJavaRow / tJavaFlex",
        content: `Chapitre 2: Code Java Custom dans Talend.
Routines Java dans le Repository:
Code statique réutilisable dans tout le projet (Code -> Routines).
Exemple de Routine Java personnalisé pour hachage SHA-256:
public class SecurityUtils {
    public static String hashSHA256(String input) {
        if (input == null) return null;
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return null;
        }
    }
}
Utilisation dans tMap: SecurityUtils.hashSHA256(row1.password)
Différence tJava vs tJavaRow vs tJavaFlex:
- tJava : Code exécuté 1 seule fois.
- tJavaRow : Code exécuté pour CHAQUE ligne du flux (input_row.col -> output_row.col).
- tJavaFlex : Possède 3 sections (Start, Main pour chaque ligne, End).`
      },
      {
        num: 3,
        title: "Orchestration, Parallel Processing et Gestion des Erreurs",
        content: `Chapitre 3: Robustesse & Multi-threading.
- tParallelize : Exécution simultanée de subjobs indépendants.
- tLogCatcher / tStatCatcher / tFlowMeterCatcher : Capture automatique des exceptions Java et métriques.
- Buffer / MultiThread Execution dans l'onglet Context/Job Settings.
Gestion du Cache tMap : Disk storage vs Memory pour les gros volumes de données lookup.`
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

    // Include selected default books
    if (activeBooks && Array.isArray(activeBooks)) {
      DEFAULT_TALEND_BOOKS.forEach(book => {
        if (activeBooks.includes(book.id)) {
          contextText += `=== ${book.title} (${book.author}) ===\n`;
          book.chapters.forEach(ch => {
            contextText += `\n[Chapitre ${ch.num}: ${ch.title}]\n${ch.content}\n`;
          });
          contextText += "\n";
        }
      });
    }

    // Include user-uploaded custom documents
    if (customDocuments && Array.isArray(customDocuments) && customDocuments.length > 0) {
      contextText += "=== DOCUMENTS ET EXTRAITS AJOUTÉS PAR L'UTILISATEUR ===\n";
      customDocuments.forEach((doc, idx) => {
        contextText += `\n[Document Utilisateur ${idx + 1}: ${doc.name}]\n${doc.content}\n`;
      });
    }

    const systemPrompt = `Tu es "TalendIA Agent", un assistant expert en intégration de données, ETL et architecture Talend Open Studio / Talend Data Fabric / ESB.
Ton rôle est de répondre aux questions de l'utilisateur en te basant EN PRIORITÉ sur les 2 livres Talend de référence fournis ci-dessous et les documents personnalisés.

CONSIGNES STRICTES DE RÉPONSE :
1. Citer explicitement la source et la page/chapitre (ex: "[Livre 1 - Chapitre 2 : tMap]" ou "[Livre 2 - Chapitre 2 : Routines Java]").
2. Fournir des EXEMPLES DE CODE CONCRETS (ex: expressions tMap Java, requêtes SQL dynamiques, routines Java, requêtes JSONPath) dans des blocs de code Markdown \`\`\`java / \`\`\`sql / \`\`\`json.
3. Si la question concerne un flux ou un composant (comme tMap, tRESTRequest, tParallelize, tPrejob/tPostjob, routines Java), génère une description visuelle d'un schéma/diagramme de flux de job Talend.
4. Réponds en français clair, structuré avec des titres, des puces et un ton professionnel et pédagogique.

CONTEXTE DOCUMENTAIRE EN VIGUEUR :
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
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.2, // Low temperature for factual precision against book sources
      }
    });

    const replyText = response.text || "Désolé, aucune réponse n'a pu être générée.";

    res.json({ text: replyText });
  } catch (error: any) {
    console.error("Erreur lors de la génération Gemini:", error);
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
