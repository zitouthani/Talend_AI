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

// Default Knowledge Base featuring complete Talend training modules & textbooks
const DEFAULT_TALEND_BOOKS = [
  {
    id: "talend-basics-pascal-garcia",
    title: "Formation TALEND for Data Integration – Basics & Advanced",
    author: "Pascal GARCIA CAPILLA (Directeur Technique WAPSI / CleverInstitut)",
    pages: 117,
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
-vm C:\\Program Files\\Java\\jdk-18.0.1.1\\bin\\javaw.exe
-vmargs
-Xms256m (Mémoire vive minimale)
-Xmx1024m (Mémoire vive maximale)
-XX:MaxPermSize=256m
-Dfile.encoding=UTF-8
Variables d'environnement requises : JAVA_HOME, JDK_HOME, CLASSPATH (jrt-fs.jar).
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
6. Table ErrorReject : errorMessage et errorStackTrace pour audit d'exceptions.`
      },
      {
        num: 4,
        title: "Envoi de Mails, Traitements XML, Bulk Loading & Synchronisation",
        content: `Chapitre 4 (Pages 1-30 TOS DI Advanced):
- tSendMail : Envoi de courriels textuels ou HTML. Support des templates HTML via tFileInputRaw -> tJavaRow (remplacement __NOMVARIABLE__).
- Flux XML : tFileInputXML, tXMLMap (arborescences, boucles, attributs), tAdvancedFileOutputXML.
- Bulk Loading : tOracleOutputBulk, tOracleOutputBulkExec (chargement massif direct/indirect).
- Variables Globales : tSetGlobalVar, globalMap.put("key", val), ((String)globalMap.get("key")).
- Synchronisation : tWaitForFile, tWaitForSocket, tWaitForSQLData.`
      },
      {
        num: 5,
        title: "Orchestration, Triggers (tPrejob/tPostjob) & Interception d'Erreurs (tLogCatcher)",
        content: `Chapitre 5 (Pages 66-68, 81-84): Robustesse & Supervision.
- tPrejob : Initialisation garantie (connexions BDD, chargement de contextes).
- tPostjob : Nettoyage garanti (fermeture de connexions, suppression de fichiers temporaires).
- Triggers : OnSubjobOK, OnSubjobError, OnComponentOK, OnComponentError, RunIf.
- Supervision : tWarn (avertissement), tDie (arrêt d'urgence KO), tLogCatcher (capture automatique d'exceptions Java).
- Contextes : Chargement dynamique avec tFileInputProperties et tContextLoad.
- Arborescence serveur recommandée : /input, /work, /temp, /output, /archives.`
      }
    ]
  },
  {
    id: "talend-pratique-et-ateliers",
    title: "Talend par la Pratique – Ateliers Pratiques Jobs 0 à 23",
    author: "Talend Expert Training Series",
    pages: 76,
    chapters: [
      {
        num: 1,
        title: "Ateliers Jobs 0 à 3 : Flux CSV, XML, Schémas & Déclencheurs",
        content: `Jobs 0 à 3 (Pages 1-22):
- Job 0 : Création de job, workspaces et référentiel local.
- Job 1 : Conversion CSV vers XML avec tFileInputDelimited -> tFileOutputXML.
- Schémas : Schéma Built-In vs Schéma Générique dans Métadonnées.
- Job 2 : Déclencheurs conditionnels Run If entre tFileExist et tJava (affichage "présent" / "absent").
- Job 3 : Conversion automatique de types avec tConvertType (Double vers Integer, String vers Date, etc.).`
      },
      {
        num: 2,
        title: "Ateliers Jobs 5 à 8 : Échantillonnage, Agrégation, Tri & Rejets",
        content: `Jobs 5 à 8 (Pages 23-30):
- Job 5 : Échantillonnage tSampleRow (ex: lignes 1, 5, 10-20).
- Job 6 : Agrégation tAggregateRow (Group by STATE, MAX_SALARY, MIN_SALARY, AVG_SALARY) et tri tSortRow / tAggregateSortedRow.
- Job 7 : Filtrage de colonnes avec tFilterColumns.
- Job 8 : Filtrage de lignes tFilterRow (opérateur ET, LastName="Adams", Salary > 6000) et redirection du flux Reject vers tFileOutputDelimited_2.`
      },
      {
        num: 3,
        title: "Ateliers Jobs 9 à 13 : Variables Globales, Copie de Fichiers & Contextes Implicites",
        content: `Jobs 9 à 13 (Pages 30-48):
- Job 9 : Utilisation des variables globales (globalMap.get / put) dans tJava.
- Job 10 : Création de variables globales avec tSetGlobalVar.
- Job 11 : Listing tFileList et copie tFileCopy avec gestion OnSubjobError, OnComponentError et tMsgBox.
- Contexte Implicite : Propriétés du projet -> Chargement implicite d'un contexte depuis fichier .txt / properties.
- Job 13 : Chargement dynamique de contextes avec tContextLoad.`
      },
      {
        num: 4,
        title: "Ateliers Jobs 14 à 23 : Supervision, Regex, Levenshtein, tJavaFlex & XML Complexe",
        content: `Jobs 14 à 23 (Pages 49-76):
- Job 14 : Supervision avec tWarn, tLoop, tFileExist, tDie et tLogCatcher.
- Job 15 : Orchestration de jobs via tRunJob et lien OnSubjobOk.
- Job 16 : Chronométrage de jobs avec tPrejob, tPostjob, tChronometerStart et tChronometerStop.
- Job 17 : Validation d'emails par regex via tLibraryLoad (jakarta-oro-2.0.8.jar) et tJava.
- Job 18 : Calcul de distance de Levenshtein entre mots avec tFuzzyMatch.
- Job 19 : Traitement de flux en 3 sections (Begin, Main, End) avec tJavaFlex.
- Job 20 : Détection automatique de catégories par poids de véhicules avec tIntervalMatch.
- Job 21 : Lecture et découpage de fichiers positionnels avec tFileInputPositional.
- Job 22 : Extraction par expressions régulières complexes avec tFileRegex.
- Job 23 : Génération XML arborescente complexe avec tAdvancedFileOutputXML.`
      }
    ]
  },
  {
    id: "tmap-java-routines",
    title: "tMap & Fonctions Java dans Talend",
    author: "Talend Core Architecture Guide",
    pages: 43,
    chapters: [
      {
        num: 1,
        title: "Notions Java Incontournables & Routines Système",
        content: `Chapitre 3 (Pages 1-13):
- Opérateurs Java : ==, !=, =, test ternaire (condition ? vrai : faux).
- Nullité : Relational.isNull(var), var == null, var != null.
- String : "toto".equals(var), var.isEmpty(), var.startsWith("x"), var.contains("x").
- Routines Système :
  * Numeric : sequence(), resetSequence(), removeSequence(), random().
  * Relational : ISNULL(), NOT(), isNull().
  * StringHandling : ALPHA(), CHANGE(), COUNT(), UPCASE(), DOWNCASE(), TRIM(), LTRIM(), RTRIM(), SUBSTR(), LPAD(), RPAD().
  * TalendDataGenerator : getFirstName(), getLastName(), getUsCity(), getUsStreet().
  * TalendDate : addDate(), compareDate(), diffDate(), formatDate(), parseDate(), getCurrentDate().
  * TalendString : replaceSpecialCharForXML(), removeAccents(), getAsciiRandomString().`
      },
      {
        num: 2,
        title: "Jointures tMap (Left, Right, Inner, Full Outer) & Routines Custom",
        content: `Chapitre 3 (Pages 14-36):
- Job 28 : Jointures auto-référencées Employees / Managers dans tMap.
- Job 29 : Tri et routage multi-flux conditionnels dans tMap (USA, FRANCE, GERMANY).
- Job 30 : Expressions Java avancées dans tMap (concaténation, mise en majuscule, augmentation salaire conditionnelle).
- Job 31 : Left Outer Join vs Right Outer Join (inversion des flux Main et Lookup).
- Job 32 & 33 : Inner Join multi-tables (Products, Suppliers, Categories) avec capture de rejets (Catch output reject / Catch lookup inner join reject).
- Job 34 : Jointure rapide avec tJoin.
- Job 35 : Full Outer Join combinant 2 tMap et un composant tUnite.
- Job 36 : Routines Java personnalisées dans Repository (ex: routine gestion_stock).`
      },
      {
        num: 3,
        title: "Résolution d'Erreurs Fréquentes & Extraits Java de Production",
        content: `Chapitre 3 (Pages 36-43):
- Erreurs fréquentes :
  * Data Truncation : dépassement de la longueur définie dans le schéma.
  * java.lang.NullPointerException : évaluation de valeur nulle dans un test ternaire sans protection.
  * java.lang.NumberFormatException:null : conversion échouée ou division par zéro.
  * For input string : mauvais format de nombre ou présence d'en-tête texte dans un champ int.
- Extraits Java réutilisables :
  * Comptage de lignes CSV via BufferedReader ou Regex.
  * Conversion de codes pays ISO 3166-1 alpha-3 vers alpha-2 (via HashMap Java).
  * Formatage de dates avec TalendDate.formatDate("dd/MM/yyyy", row1.date_col).
  * Remplacement de texte et sauts de ligne avec tReplace ou routine custom removeLineBreaks().`
      }
    ]
  },
  {
    id: "sql-and-databases",
    title: "Talend & les Bases de Données SQL",
    author: "Database Integration Manual",
    pages: 25,
    chapters: [
      {
        num: 1,
        title: "Généralités SQL & Modèles SQL Système Talend",
        content: `Chapitre 4 (Pages 1-12):
- Commandes SQL : DML (SELECT, INSERT, UPDATE, DELETE), DDL (CREATE, ALTER, DROP), DCL (GRANT, REVOKE), TCL (COMMIT, ROLLBACK).
- Synthaxe : SELECT, Projection, Commentaires (-- et /* */), Filtres AND/OR/IN/LIKE/BETWEEN/IS/CASE, Jointures (INNER, CROSS, LEFT, RIGHT, FULL, SELF, NATURAL), Agrégations (SUM, AVG, COUNT, MAX, MIN, STD), ORDER BY, UNION vs UNION ALL, ANY, ALL.
- Modèles SQL Système Talend : Modèles réutilisables pour Delta Lake, Generic (ODBC), Hive, MySQL, Netezza, Oracle, ParAccel, Snowflake, Teradata, Vertica.`
      },
      {
        num: 2,
        title: "Ateliers DB Pratiques & Chargement Massif (Bulk Loading)",
        content: `Chapitre 4 (Pages 13-25):
- Job 37 : Connexion à une base de données dans le Référentiel.
- Job 38 : Importation et récupération de schémas de tables BDD.
- Job 39 : Jointure entre fichier Excel et table BDD via tMap.
- Job 40 (BDD_EXTRACTION) : Extraction MySQL avec tMysqlConnection, tMysqlInput et tMysqlClose.
- Job 41 (CONNECT_AND_CHARGE) : Alimentation parallèle Oracle et MySQL avec tFileInputDelimited et tMysqlOutput / tOracleOutput.
- Job 42 (JOIN_MULTI_BASE) : Jointures entre bases de données hétérogènes (Oracle + MySQL).
- Chargement Bulk :
  * Indirect : tOracleInput -> tMap -> tOracleOutputBulk -> tDBBulkExec (génération de fichier bulk puis insertion par paquets).
  * Direct : tDBOutputBulkExec (construction du fichier bulk et chargement massif combinés).`
      }
    ]
  },
  {
    id: "examen-pratique-dwh",
    title: "Examen Pratique Entrepôt de Données (DWH) & Certification 100 Q&A",
    author: "Talend Certification Board",
    pages: 44,
    chapters: [
      {
        num: 1,
        title: "Spécifications & Architecture de l'Atelier DWH 3 Tiers",
        content: `Chapitre 5 (Pages 1-21):
- Architecture 3 Tiers : Sources (SRC) -> Staging (STG) -> Cibles (DWH, Refus, Alertes).
- Tables Sources : Données de référence Client, Offre, Direction, Distance, Produit & Fait Appels.
- Phase 1 (SRC vers STG) : Nettoyage, filtres d'intégrité, règles nvl(), passage en majuscules UPPER(), détection d'alertes (format numéro de téléphone) et rejets (IDs manquants).
- Phase 2 (STG vers DWH) : Enrichissement, calcul du trimestre (YYYYTT), calcul du réseau (FIXE/GSM), agrégations mensuelles DWH_AGG_APPEL_PRD et DWH_AGG_APPEL_DISTANCE.`
      },
      {
        num: 2,
        title: "Les 100 Questions de Certification & Entretiens Techniques",
        content: `Chapitre 5 Bis (Pages 1-23):
Questions-clés de l'examen Talend Data Integration Certified Developer :
- Version gratuite : Talend Open Studio (TOS). Lancement en Octobre 2006 en Java.
- Référentiel vs Workspace vs Projet : Référentiel = stockage central ; Workspace = dossier physique ; Projet = ensemble d'éléments (Jobs, Contextes, Code, Metadata).
- ETL vs ELT : ETL fait les transformations dans un moteur dédié ; ELT délègue les transformations au SGBD cible.
- Liens Row : Main, Lookup, Rejects, Output, Uniques, Duplicates, Iterate.
- Triggers : OnSubjobOK, OnSubjobError, OnComponentOK, OnComponentError, RunIf.
- tPrejob / tPostjob : Exécution inconditionnelle garantie avant/après le job principal.
- tMap vs tJoin : tMap permet des expressions complexes, filtres et sorties multiples ; tJoin est une jointure binaire simple.
- tAggregateRow vs tAggregateSortedRow : tAggregateSortedRow nécessite un flux préalablement trié (tSortRow) pour économiser la mémoire.`
      }
    ]
  },
  {
    id: "travail-collaboratif-et-bonnes-pratiques",
    title: "Travail Collaboratif (Git, SSH, Linux, PowerShell) & Bonnes Pratiques",
    author: "DevOps & Best Practices Guide",
    pages: 28,
    chapters: [
      {
        num: 1,
        title: "Outils Collaboratifs : Git, SSH, PuTTY, Linux & PowerShell",
        content: `Chapitres 7 (Pages 1-21):
- SSH & PuTTY : Connexion distante sécurisée, tunnels SSH (port 5901 pour interface graphique).
- Linux : ls -al, cd, pwd, mkdir, rm -rf, cp -r, mv, chmod (777, 755, 644, 600), grep -r, locate, ping, wget, ps aux, top, kill, tar czf / xzf.
- Git : git init, clone, add, commit -m, diff, reset, rm, log, status, branch, checkout, merge, push, pull.
- PowerShell : -eq, -ne, -gt, -ge, -lt, -in, -contains, -replace, -and, -or, -xor, variables ($var), verbes (Get, Set, New), boucles foreach, switch.`
      },
      {
        num: 2,
        title: "Bonnes Pratiques & Conventions Officielles de Développement Talend",
        content: `Chapitre 8 (Pages 1-7):
- Disposition graphique des Jobs :
  * Flux de données horizontaux (de gauche à droite).
  * Lookups verticaux pointant vers le haut du tMap.
  * Rejets verticaux vers le bas.
  * Triggers OnSubjobOK / ComponentOK verticaux (de haut en bas).
- Performance :
  * Utiliser des connexions séparées pour Input et Output.
  * Privilégier Extended Insert et Bulk Insert pour les fortes volumétries.
  * Ne JAMAIS exécuter SELECT * dans les tMySQLInput / tOracleInput.
  * Activer l'option enableStream pour les gros volumes.
- Normes de Nommage :
  * Répertoires métier : DWH06_Scolarite
  * Répertoires application : DWH06b_APOGEE
  * Jobs : RH01_STATUTAIRES
  * Contextes : CNX_ (connexions), VCOM_ (commun), VAR_ (domaines).`
      }
    ]
  },
  {
    id: "plsql-oracle-integration",
    title: "Integration PL/SQL Oracle & Dictionnaire Complet des Composants",
    author: "Oracle PL/SQL & Talend Component Reference",
    pages: 150,
    chapters: [
      {
        num: 1,
        title: "Langage PL/SQL Oracle : Blocs, Curseurs, Bulk Collect & TP Corrélés",
        content: `Chapitre 09 (Pages 1-42 PL/SQL):
- Structure de Bloc PL/SQL : DECLARE (optionnel), BEGIN (exécutable), EXCEPTION (erreurs), END;.
- Types & Variables : %ROWTYPE, %TYPE, CONSTANT, VARRAY, SUBTYPE.
- Affichage : SET SERVEROUTPUT ON; DBMS_OUTPUT.PUT_LINE('texte ' || variable);.
- Curseur & Boucles : CURSOR cur_name IS SELECT ..., OPEN, FETCH bulk collect into, CLOSE, %ISOPEN, %FOUND, %NOTFOUND, %ROWCOUNT, FOR loop.
- Instructions : UPDATE avec RETURNING variable, Boucle WHILE, Tableaux associatifs (index-by tables).
- Travaux Pratiques résolus : Fonctions nbr_cmd_cl, sal_annuel(NVL(comission,0)), sum_sal(), détection d'alertes de stock articles, procédures d'augmentation salariale.`
      },
      {
        num: 2,
        title: "Guide Exhaustif des Composants Talend par Catégories",
        content: `Chapitre 10 (Pages 1-108 Composants):
Catalogue complet de la palette Talend :
- Big Data : tBigQuery*, tGSBucket*, tGSCopy, tGSPut, tHiveConnection, tHiveRow.
- Business & CRM : tBonita*, tJIRA*, tLDAP*, tMarketo*, tMicrosoftCrm*, tNetsuite*, tSalesforce*, tServiceNow*.
- Business Intelligence & Cloud : tSplunkEventCollector, tBarChart, t*SCD, tAmazonAurora*, tAzureStorage*, tAzureSynapse*, tDropbox*, tGoogleDrive*, tRedshift*, tSnowflake*.
- Custom Code & Scripts : tGroovy, tJava (exécuté 1 fois), tJavaRow (par ligne), tJavaFlex (Begin/Main/End), tLibraryLoad, tSetGlobalVar.
- Base de données : Connecteurs Access, AS400, DB2, Firebird, Greenplum, Informix, JDBC, MSSql, MySQL, Oracle, PostgreSQL, SQLite, Sybase, Teradata, Vertica.
- Processing & Transformations : tAggregateRow, tAggregateSortedRow, tConvertType, tDenormalize, tExtractJSONFields, tExtractXMLField, tFilterColumns, tFilterRow, tJoin, tMap, tNormalize, tReplace, tReplicate, tSampleRow, tSortRow, tSplitRow, tUniqRow, tUnite.`
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

CONSIGNES STRICTES DE RÉPONSE ET DE STRUCTURE :
1. RÉPONSES SUCCINCTES ET CIBLÉES : Va immédiatement à l'essentiel. Bannis toute formule d'introduction ou de politesse inutile ainsi que les bavardages ou conclusions superflues. Sois extrêmement concis, précis et directement axé sur la solution technique exacte.
2. DÉLIMITATION NETTE DES DIFFÉRENTES MÉTHODES : S'il existe plusieurs approches ou méthodes pour traiter le problème (ex: Méthode 1 vs Méthode 2 vs Méthode 3), sépare-les TOUJOURS de manière visuelle et structurée avec des titres explicites (ex: "### 📌 Méthode 1 : [Nom de la méthode]") et des séparateurs horizontaux ("---"). Pour chaque méthode, indique de façon concise : le fonctionnement, le code/composants requis, et le cas d'usage recommandé.
3. EXEMPLES DE CODE CONCRETS : Fournis des extraits de code réels et prêts à l'emploi (expressions tMap Java, requêtes SQL, routines Java, JSONPath) dans des blocs Markdown de code (\`\`\`java, \`\`\`sql, \`\`\`json).
4. ABSENCE DE CITATION DE SOURCE : Ne cite jamais de noms d'auteurs, manuels ou références de documentation dans la réponse.
5. RÈGLE STRICTE SUR LES SCHÉMAS FLOW (NE PAS GÉNÉRER SUR DES QUESTIONS DE CODE / CONFIG / MÉTA) :
   - GÉNÈRE UNE LIGNE FLOW UNIQUEMENT SI la question de l'utilisateur demande explicitement ou concerne directement un enchaînement de plusieurs composants ETL dans un Job Talend.
   - NE GÉNÈRE EN AUCUN CAS DE LIGNE FLOW (INTERDICTION STRICTE) pour :
     * Les questions sur du code Java, des routines Java (ex: SHA-256, StringUtils, routines système).
     * Les configurations système, fichiers .ini ou arguments JVM (ex: -Xmx1024m, -Xms256m).
     * Les questions de relance, de vérification ou méta (ex: "T'es sûr du schéma ?", "Est-ce correct ?", "Pourquoi...").
     * Les définitions ou explications théoriques sans flux de composants spécifique.
   Format exact de la ligne FLOW si et SEULEMENT si un flux de composants ETL est réellement concerné :
   FLOW: [Composant1] --(TypeLien)--> [Composant2] --(TypeLien)--> [Composant3]
6. PARAMÈTRES DE COMPOSANTS : Lorsque tu détailles un composant Talend dans un flux ETL, donne de manière concise la liste des paramètres clés (Basic Settings -> Advanced Settings -> Schema) et leurs valeurs recommandées.

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
      console.log("Search grounding call notice: falling back to standard generation.");
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
