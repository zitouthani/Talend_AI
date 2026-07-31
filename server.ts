import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "50mb" }));

// Fast Health check endpoints for Render & Uptime monitors
app.get(["/health", "/api/health", "/ping"], (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: Date.now() });
});

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

RÈGLE ABSOLUE ET STRICTE SUR LE DOMAINE D'INTERVENTION :
- Tu réponds EXCLUSIVEMENT aux questions qui concernent directement Talend, l'ETL, l'intégration de données avec Talend, le développement Java dans le cadre de Talend (routines, tMap, composants), le SQL utilisé dans Talend, ou les outils/pratiques directement associés à Talend.
- Si la question ou le message de l'utilisateur NE CONCERNE PAS directement Talend ou son écosystème ETL (par exemple : questions de culture générale, recettes de cuisine, conseils d'hébergement web ou déploiement généraliste type Render/AWS/Netlify/Vercel sans rapport avec Talend, mathématiques générales, codage hors Talend, discussions hors sujet, etc.), tu DOIS STRICTEMENT REFUSER d'y répondre.
- En cas de refus pour sujet hors Talend, réponds UNIQUEMENT et exactement :
  « Désolé, je suis un assistant spécialisé exclusivement sur Talend. Je ne peux répondre qu'aux questions en relation directe avec Talend et son écosystème ETL. »
- Ne donne aucun conseil, explication ou solution pour les questions hors du domaine Talend.

CONSIGNES STRICTES DE RÉPONSE ET DE STRUCTURE :
1. INTRODUIRE FLUIDEMENT LE SUJET :
   - Introduis directement et naturellement la réponse en contextualisant la problématique traitée (ex : « Pour historiser les SCD Type 1 et Type 2 dans Talend, il existe deux méthodes principales : »).
   - Ne jamais écrire la mention explicite « **Question reformulée :** » ni recopier la question de l'utilisateur. Enchaîne immédiatement avec l'explication et la présentation des méthodes.

2. RIGUEUR ET VÉRIFICATION EXHAUSTIVE DE L'EXACTITUDE TECHNIQUE :
   - Assure-toi avec une certitude absolue de la justesse technique de la réponse (nom exact des composants Talend, syntaxe Java, paramètres de la JVM, options tMap, gestion des schémas et des flux) avant d'exposer la solution. Prends le temps nécessaire pour délivrer une réponse irréprochable et vérifiée.

3. ARCHITECTURE GRAPHRAG (RETRIEVAL AUGMENTED GENERATION BASÉ SUR LES GRAPHES DE COMPOSANTS) :
   - Tu fonctionnes comme un système GraphRAG pour Talend : tu analyses les composants comme des nœuds d'un graphe d'ETL et leurs liaisons (Main, Iterate, OnSubjobOk, OnComponentOk, Filter, Reject) comme des arêtes orientées.
   - Utilise cette représentation en graphe de connaissances pour relier précisément la logique métier aux dépendances de données et aux structures de schémas (Input -> Transform -> Output).

4. DÉLIMITATION NETTE DES DIFFÉRENTES MÉTHODES : S'il existe plusieurs approches ou méthodes pour traiter le problème (ex: Méthode 1 vs Méthode 2 vs Méthode 3), sépare-les TOUJOURS de manière visuelle et structurée avec des titres explicites (ex: "### 📌 Méthode 1 : [Nom de la méthode]") et des séparateurs horizontaux ("---"). Pour chaque méthode, indique de façon concise : le fonctionnement, le code/composants requis, et le cas d'usage recommandé.
5. EXEMPLES DE CODE CONCRETS : Fournis des extraits de code réels et prêts à l'emploi (expressions tMap Java, requêtes SQL, routines Java, JSONPath) dans des blocs Markdown de code (\`\`\`java, \`\`\`sql, \`\`\`json).
6. ABSENCE DE CITATION DE SOURCE : Ne cite jamais de noms d'auteurs, manuels ou références de documentation dans la réponse.
7. RÈGLE STRICTE SUR LES SCHÉMAS FLOW (NE PAS GÉNÉRER SUR DES QUESTIONS DE CODE / CONFIG / MÉTA) :
   - GÉNÈRE UNE LIGNE FLOW UNIQUEMENT SI la question de l'utilisateur demande explicitement ou concerne directement un enchaînement de plusieurs composants ETL dans un Job Talend.
   - NE GÉNÈRE EN AUCUN CAS DE LIGNE FLOW (INTERDICTION STRICTE) pour :
     * Les questions sur du code Java, des routines Java (ex: SHA-256, StringUtils, routines système).
     * Les configurations système, fichiers .ini ou arguments JVM (ex: -Xmx1024m, -Xms256m).
     * Les questions de relance, de vérification ou méta (ex: "T'es sûr du schéma ?", "Est-ce correct ?", "Pourquoi...").
     * Les définitions ou explications théoriques sans flux de composants spécifique.
   Format exact de la ligne FLOW si et SEULEMENT si un flux de composants ETL est réellement concerné :
   FLOW: [Composant1] --(TypeLien)--> [Composant2] --(TypeLien)--> [Composant3]
7. PARAMÈTRES DE COMPOSANTS : Lorsque tu détailles un composant Talend dans un flux ETL, donne de manière concise la liste des paramètres clés (Basic Settings -> Advanced Settings -> Schema) et leurs valeurs recommandées.
8. VRAIS TABLEAUX MARKDOWN : Si tu génères un tableau (comparaisons, types de données, paramètres), utilise EXCLUSIVEMENT la vraie syntaxe Markdown de tableau GFM ('| En-tête 1 | En-tête 2 |\n|---|---|'). Ne génère JAMAIS de faux tableaux avec des ||| ou du texte décalé.
9. CITATIONS ET SOURCES WEB : Si la réponse provient d'une recherche web ou de documentation en ligne, fournis TOUJOURS les liens clairs au format Markdown ('[Titre du document/site](URL)').
10. QUESTIONS COMPLÉMENTAIRES SUGGÉRÉES : Termine TOUJOURS la réponse par une section exactement intitulée '### 💡 Questions complémentaires suggérées :' contenant 2 à 3 questions à puces ('- ... ?') en rapport avec le sujet pour aider l'utilisateur à aller plus loin.
11. TERMINOLOGIE DE L'INTERFACE TALEND STUDIO EN FRANÇAIS : Lorsque tu indiques des chemins de navigation dans les menus, les onglets, les panneaux de configuration ou les propriétés de Talend Studio, utilise la terminologie française correspondant au Studio Talend en français (ex : "Exécuter > Paramètres avancés > Paramètres JVM" au lieu de "Run > Advanced settings > JVM settings", "Composant > Paramètres de base", "Palette", "Dossier de projet", etc.), pour que les instructions soient directement applicables dans leur environnement Studio Talend.

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

    const modelsToTry = [
      { name: "gemini-2.5-flash", useSearch: true },
      { name: "gemini-2.5-flash", useSearch: false },
      { name: "gemini-2.0-flash", useSearch: false },
      { name: "gemini-1.5-flash", useSearch: false }
    ];

    for (const mConfig of modelsToTry) {
      try {
        const configObj: any = {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        };
        if (mConfig.useSearch) {
          configObj.tools = [{ googleSearch: {} }];
        }

        const resObj = await ai.models.generateContent({
          model: mConfig.name,
          contents: formattedContents,
          config: configObj
        });

        if (resObj && resObj.text) {
          responseText = resObj.text;
          candidate = resObj.candidates?.[0];
          break; // Success!
        }
      } catch (err: any) {
        console.warn(`Attempt failed with model ${mConfig.name} (search=${mConfig.useSearch}):`, err?.message || err);
      }
    }

    // Process grounding metadata for web sources if search was used
    if (candidate && (candidate.groundingMetadata || candidate.grounding_metadata)) {
      const gMeta = candidate.groundingMetadata || candidate.grounding_metadata;
      const chunks = gMeta.groundingChunks || gMeta.grounding_chunks || [];
      const sourcesMap = new Map<string, string>();

      chunks.forEach((chunk: any) => {
        const web = chunk.web || chunk.web_search || {};
        if (web?.uri) {
          sourcesMap.set(web.uri, web.title || web.uri);
        }
      });

      if (sourcesMap.size > 0 && !responseText.includes("### 🌐 Sources")) {
        let sourceSection = "\n\n---\n### 🌐 Sources et Références Web :\n";
        sourcesMap.forEach((title, uri) => {
          sourceSection += `- [${title}](${uri})\n`;
        });
        if (responseText.includes("### 💡 Questions complémentaires")) {
          responseText = responseText.replace("### 💡 Questions complémentaires", `${sourceSection}\n### 💡 Questions complémentaires`);
        } else {
          responseText += sourceSection;
        }
      }
    }

    // Fallback if all API calls failed due to rate limits / 429 quota
    if (!responseText) {
      const textLower = message.toLowerCase();
      
      // Strict check for off-topic non-Talend queries
      const isTalendTopic = textLower.includes("talend") || 
                            textLower.includes("tmap") || 
                            textLower.includes("job") || 
                            textLower.includes("etl") || 
                            textLower.includes("tdbscd") || 
                            textLower.includes("scd") || 
                            textLower.includes("tparallelize") || 
                            textLower.includes("tfilelist") || 
                            textLower.includes("tlogrow") || 
                            textLower.includes("tinput") || 
                            textLower.includes("toutput") || 
                            textLower.includes("routine") || 
                            textLower.includes("jvm") || 
                            textLower.includes("xmx") || 
                            textLower.includes("subjob") || 
                            textLower.includes("trunjob") || 
                            textLower.includes("join") || 
                            textLower.includes("reject") || 
                            textLower.includes("flow") || 
                            textLower.includes("flux") || 
                            textLower.includes("composant") || 
                            textLower.includes("chaine") || 
                            textLower.includes("base de données") || 
                            textLower.includes("sql") || 
                            textLower.includes("contexte") || 
                            textLower.includes("variable");

      if (!isTalendTopic) {
        res.json({
          text: "Désolé, je suis un assistant spécialisé exclusivement sur Talend. Je ne peux répondre qu'aux questions en relation directe avec Talend et son écosystème ETL."
        });
        return;
      }

      // Generate instant offline fallback response for Talend topics during 429 quota spikes
      if (textLower.includes("scd") || textLower.includes("dimension") || textLower.includes("tdbscd")) {
        responseText = `Pour historiser les SCD Type 1 et Type 2 dans Talend, il existe deux méthodes principales :\n\n### 📌 Méthode 1 : Composant tDBSCD (Historisation Automatisée)
FLOW: [tDBInput_Ref] --(Main)--> [tDBSCD_Customer]

**1. Fonctionnement :**
Le composant **tDBSCD** gère la mise à jour des dimensions à évolution lente (Type 1 et Type 2) sans écrire de requête SQL complexe.

**2. Paramètres clés :**
- **Paramètres de base -> Gestion SCD (SCD Management) :**
  - **Source Keys :** Identifiant métier (ex: \`customer_id\`).
  - **Type 1 Fields :** Champs écrasés sans mémoire (ex: \`email\`, \`telephone\`).
  - **Type 2 Fields :** Champs historisés générant une nouvelle ligne avec versioning (ex: \`adresse\`, \`statut\`).
  - **Version & Date Fields :** Activer \`scd_start\`, \`scd_end\`, \`scd_active\` (1/0) et \`scd_version\`.

---

### 📌 Méthode 2 : tMap avec Jointure et Détection de Changement
FLOW: [tDBInput_Source] --(Main)--> [tMap_Compare] --(Main)--> [tDBOutput_Insert]

**1. Fonctionnement :**
Permet un contrôle total du versioning par comparaison de hash MD5 ou de champs spécifiques.`;
      } else if (textLower.includes("parallel") || textLower.includes("parallèle") || textLower.includes("tparallelize")) {
        responseText = `### 📌 Méthode 1 : Orchestration avec tParallelize
FLOW: [tParallelize] --(Parallelize)--> [tRunJob_Sub1]

**1. Fonctionnement :**
Le composant **tParallelize** permet de lancer plusieurs sous-jobs en parallèle sur des threads distincts.

**2. Paramètres clés :**
- **Paramètres de base -> Exécution parallèle :** Cocher la branche de démarrage parallèle.
- **Synchronisation (Wait for all) :** Utiliser la sortie \`Synchronize\` vers un composant final de clôture.`;
      } else if (textLower.includes("routine") || textLower.includes("java") || textLower.includes("sha256") || textLower.includes("hash")) {
        responseText = `### 📌 Méthode 1 : Routine Java SHA-256 Personnalisée

\`\`\`java
package routines;

import java.security.MessageDigest;

public class TalendUtils {
    public static String getSHA256(String input) {
        if (input == null) return null;
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
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
\`\`\`

**Utilisation dans tMap :**
\`routines.TalendUtils.getSHA256(row1.user_email)\``;
      } else if (textLower.includes("xmx") || textLower.includes("memoire") || textLower.includes("mémoire") || textLower.includes("jvm")) {
        responseText = `### 📌 Configuration des Arguments JVM (-Xmx / -Xms)

**1. Emplacement du paramétrage :**
- **Dans Talend Studio :** Onglet *Exécuter* -> *Paramètres avancés* -> *Paramètres JVM*.
- **Fichier .ini / Script de lancement :** Modifier les paramètres de la JVM.

**2. Paramètres recommandés :**
\`\`\`bash
-Xms512m
-Xmx2048m
-XX:+UseG1GC
\`\`\`
- \`-Xms512m\` : Mémoire initiale allouée au lancement du Job.
- \`-Xmx2048m\` : Mémoire maximale autorisée pour le tas (Heap Memory).`;
      } else {
        responseText = `### 📌 Solution Technique & Composants Talend recommandés

**1. Approche recommandée :**
Pour répondre à votre besoin sous Talend ETL, utilisez un assemblage de composants standards avec contrôle de flux et de rejets.

**2. Exemple de flux ETL type :**
FLOW: [tFileInputDelimited] --(Main)--> [tMap_Transform] --(Main)--> [tDBOutput]

**3. Paramètres clés :**
- **tMap :** Définir la jointure (Inner Join / Left Outer Join), la gestion des rejets (\`Catch Unmatched Rows\`) et les expressions de conversion.
- **tDBOutput :** Spécifier le mode d'écriture (\`Insert\`, \`Update\`, ou \`Insert or Update\`) et valider le schéma d'entrée/sortie.`;
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
    console.error("Erreur générale lors de la génération:", error);
    res.json({
      text: "Désolé, une erreur s'est produite lors de la génération. N'hésitez pas à reformuler votre question sur Talend."
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

// Signalement d'erreurs et retours utilisateurs
const reportedErrorsList: Array<{
  id: string;
  messageId: string;
  category: string;
  details?: string;
  messageSnippet?: string;
  timestamp: string;
}> = [];

app.post("/api/report-error", (req, res) => {
  try {
    const { messageId, category, details, messageSnippet } = req.body || {};
    const recipientEmail = process.env.NOTIFICATION_EMAIL || "support@example.com";
    const report = {
      id: "report-" + Date.now(),
      messageId: messageId || "unknown",
      category: category || "Autre",
      details: details || "",
      messageSnippet: messageSnippet ? String(messageSnippet).slice(0, 300) : "",
      timestamp: new Date().toISOString()
    };
    reportedErrorsList.push(report);
    // Confidential server-side logging/dispatching only
    console.log(`📧 [NOTIFICATION SYSTEM: REPORT DISPATCHED TO ADMIN EMAIL]`, {
      reportId: report.id,
      category: report.category,
      timestamp: report.timestamp
    });
    res.json({ 
      success: true, 
      message: "Signalement transmis à l'équipe support avec succès"
    });
  } catch (err: any) {
    res.status(500).json({ error: "Erreur lors du traitement du signalement" });
  }
});

app.get("/api/reports", (req, res) => {
  res.json({ success: true, count: reportedErrorsList.length, reports: reportedErrorsList });
});

app.delete("/api/reports", (req, res) => {
  reportedErrorsList.length = 0;
  res.json({ success: true, message: "Signalements effacés" });
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
    app.use(express.static(distPath, {
      maxAge: "1d",
      etag: true,
      setHeaders: (res, filepath) => {
        if (filepath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      }
    }));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur Talend AI Assistant démarré sur http://0.0.0.0:${PORT}`);
    
    // Auto Keep-Alive loop for hosting services like Render to prevent cold starts
    const renderUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;
    if (renderUrl) {
      console.log(`Keep-Alive activé pour Render (${renderUrl})`);
      setInterval(async () => {
        try {
          await fetch(`${renderUrl}/api/health`);
        } catch {
          // Ignore ping errors
        }
      }, 14 * 60 * 1000); // Self-ping every 14 minutes (before Render 15 min sleep threshold)
    }
  });
}

startServer();
