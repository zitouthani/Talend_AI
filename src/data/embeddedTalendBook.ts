export interface BookChapter {
  num: number;
  title: string;
  pages: string;
  summary: string;
  diagramPreset: string;
  topics: string[];
  content: string;
}

export interface EmbeddedTalendBook {
  id: string;
  title: string;
  author: string;
  organization: string;
  version: string;
  date: string;
  totalPages: number;
  coverBadge: string;
  description: string;
  chapters: BookChapter[];
}

export const PASCAL_GARCIA_TALEND_BOOK: EmbeddedTalendBook = {
  id: "talend-basics-pascal-garcia",
  title: "Formation TALEND for Data Integration – Basics",
  author: "Pascal GARCIA",
  organization: "Directeur Technique WAPSI / CleverInstitut",
  version: "IR : 1.0",
  date: "2020-02-04",
  totalPages: 87,
  coverBadge: "LIVRE EMBEDDED DANS LE CODE SOURCE",
  description: "Manuel de référence complet couvrant l'architecture des jobs Talend TOS, le composant tMap (Inner Join, Catch Rejects), la gestion de mémoire JVM (-Xms256m / -Xmx1024m), l'orchestration tPrejob/tPostjob, les routines Java, et le déploiement serveur.",
  chapters: [
    {
      num: 1,
      title: "Préambule & Présentation de Talend Open Studio (TOS)",
      pages: "1 - 10",
      diagramPreset: "tmap-etl",
      topics: ["Architectures ETL", "Data Integration", "TOS vs TIS (Talend Integration Suite)", "Eclipse RCP"],
      summary: "Introduction aux concepts ETL (Extract-Transform-Load), comparaison entre intégration opérationnelle et décisionnelle. Présentation des modules Business Modeler, Job Designer et Metadata Manager.",
      content: `1. Préambule & Architecture Talend
Talend for Data Integration est une plateforme open-source basée sur Eclipse RCP (Rich Client Platform) générant du code Java natif optimisé.
- Business Modeler : Modélisation haut niveau pour la maîtrise d'ouvrage (MOA / DBA).
- Job Designer : Palette graphique de composants interconnectés par des flux de données (Row Main, Lookup, Reject) ou des triggers.
- Metadata Manager : Référentiel centralisé de métadonnées (schémas DB, fichiers plats, Web Services).`
    },
    {
      num: 2,
      title: "Installation, Prérequis Techniques & Allocation Mémoire JVM",
      pages: "17 - 21",
      diagramPreset: "db-transaction",
      topics: ["Memory Allocation", "-Xms256m -Xmx1024m", "Compatibilité Java 8/11", "Console TAC"],
      summary: "Spécification de l'allocation mémoire dans le fichier TalendStudio.ini (-Xms256m, -Xmx1024m, -XX:MaxPermSize=256m) et répartition mémoire pour l'exécution des jobs.",
      content: `5 & 7. Configuration & Allocation de Mémoire JVM
Pour garantir les performances du Studio et des traitements lourds :
Paramètres .ini recommandés :
-vm C:\\Program Files\\Java\\jdk1.7.0_79\\bin\\javaw.exe
-vmargs
-Xms256m (Mémoire vive minimale attribuée)
-Xmx1024m (Mémoire vive maximale attribuée)
-XX:MaxPermSize=256m
-Dfile.encoding=UTF-8

Remarque : Les sous-jobs très consommateurs de mémoire (tSortRow, tAggregateRow) doivent être surveillés ou déportés sur disque.`
    },
    {
      num: 3,
      title: "Composants Graphiques Entrée / Sortie & Transferts (tFileInputDelimited, tFTP, tLogRow)",
      pages: "33 - 38",
      diagramPreset: "rest-api",
      topics: ["tFileInputDelimited", "tFileOutputDelimited", "tRowGenerator", "tFileList", "tFTPGet", "tLogRow"],
      summary: "Familles de composants pour la lecture/écriture de fichiers délimités, Excel, XML, MySQL, PostgreSQL, Oracle et gestion du transfert distant via FTP/SFTP.",
      content: `13. Les Principaux Composants Talend
- Entrée/Sortie Fichiers : tFileInputDelimited, tFileOutputDelimited (lecture/écriture ligne par ligne avec séparateur).
- Entrée/Sortie DB : tMysqlInput, tPostgresqlOutput, tOracleInput.
- Génération : tRowGenerator (jeux de données de test), tFixedFlowInput.
- Transfert Fichiers : tFileList (itération sur répertoire), tFTPGet, tFTPPut, tFileExist.`
    },
    {
      num: 4,
      title: "Le Composant Cœur de Mappage : tMap (Inner Join, Lookups & Catch Rejects)",
      pages: "39 - 56",
      diagramPreset: "tmap-etl",
      topics: ["tMap Editor", "Inner Join vs Left Join", "Unique Match / First Match / All Matches", "Catch Output Reject", "Catch Lookup Inner Join Reject", "Table Var"],
      summary: "Explication détaillée de l'éditeur tMap : jointures explicites, correspondances (Unique/First/All Match), tables de variables intermediate, et gestion avancée des rejets.",
      content: `14. Le Mappage de Données : tMap
Le tMap est le composant ETL par excellence :
1. Flux Principal (Main Row) & Lookups : Le flux Main est traité en priorité.
2. Modèles de Match : Unique Match (dernière correspondance), First Match, All Matches (produit cartésien si filtré).
3. Types de Jointures : Inner Join vs Left Outer Join (All Rows).
4. Capture des Rejets :
   - 'Catch output reject' = true : isole les données ne respectant aucun filtre de sortie.
   - 'Catch lookup inner join reject' = true : isole les lignes du flux Main dont la clé de correspondance n'existe pas dans la table Lookup.
5. Table Var : Déclaration de variables de mapping Java réutilisables (ex: StringHandling.UPPERCASE(row1.nom)).`
    },
    {
      num: 5,
      title: "Orchestration, Triggers (tPrejob / tPostjob) & Gestion des Erreurs (tLogCatcher)",
      pages: "66 - 68",
      diagramPreset: "java-routine",
      topics: ["tPrejob", "tPostjob", "tWarn / tDie", "tLogCatcher", "Triggers OnSubjobOK / OnComponentOK"],
      summary: "Initialisation et nettoyage des jobs via tPrejob/tPostjob. Capture d'exceptions Java centralisée avec tLogCatcher, tDie et tWarn.",
      content: `18. Orchestration & Gestion des Erreurs
- tPrejob : Garantit l'exécution inconditionnelle des tâches d'initialisation (ouverture de connexions DB, chargement de contextes).
- tPostjob : Garantit la fermeture des ressources et nettoyage des fichiers temporaires, même en cas d'échec du subjob principal.
- Triggers : OnSubjobOK, OnSubjobError, OnComponentOK, OnComponentError, RunIf.
- Rejets & Exceptions : tWarn (avertissement non bloquant), tDie (arrêt immédiat avec statut KO), tLogCatcher (intercepteur global d'exceptions Java).`
    },
    {
      num: 6,
      title: "Contextes, Passage de Variables & Routines Java Custom",
      pages: "63 - 65, 78",
      diagramPreset: "java-routine",
      topics: ["Context Groups", "tFileInputProperties", "tContextLoad", "tRunJob", "SecurityUtils.hashSHA256"],
      summary: "Gestion dynamique des environnements (DEV, TEST, PROD) via les groupes de contextes et intégration de code Java sur mesure via les Routines du Repository.",
      content: `17 & 21. Contextes & Routines Java
- Variables de Contexte : Déclarées en mode Built-in ou centralisées dans le Repository. Chargées dynamiquement via tFileInputProperties et tContextLoad.
- Transmission de Contexte : Option 'Transmettre tout le contexte' cochée sur tRunJob.
- Routines Java Custom : Code statique dans Code -> Routines (ex: SecurityUtils.hashSHA256(String input) pour le hachage sécurisé de données sensibles).`
    },
    {
      num: 7,
      title: "Déploiement Serveur, Bâtir le Job & Bonnes Pratiques d'Architecture",
      pages: "70 - 86",
      diagramPreset: "db-transaction",
      topics: ["Construire le Job (Standalone Zip)", "Exécution .bat / .sh", "Structure /input /work /temp /output /archives", "Multi-thread Execution"],
      summary: "Génération de l'archive autonome (Standalone Job), déploiement sur serveur avec scripts d'exécution .bat/.sh, et structuration recommandée des répertoires de données.",
      content: `20 & 21. Déploiement & Bonnes Pratiques
- Standalone Job : Exportation au format archive ZIP contenant le .jar compilé, les bibliothèques /lib et les scripts de lancement .bat (Windows) / .sh (Unix).
- Arborescence recommandée sur serveur :
  /input    : Réception des fichiers entrants
  /work     : Traitements intermédiaires avec persistance
  /temp     : Fichiers temporaires non persistés
  /output   : Fichiers finaux générés prêts pour transfert
  /archives : Horodatage et stockage des fichiers traités`
    }
  ]
};
