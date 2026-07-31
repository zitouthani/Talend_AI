import React, { useState } from 'react';
import { ArrowRight, Database, FileText, Cpu, CheckCircle2, AlertTriangle, Layers, Globe, Maximize2, RefreshCw, Server } from 'lucide-react';

export interface Node {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: React.ReactNode;
  details?: string;
}

export interface Link {
  from: string;
  to: string;
  label: string;
  type: 'main' | 'lookup' | 'reject' | 'trigger' | 'iterate';
}

interface JobFlowProps {
  title: string;
  description?: string;
  nodes?: Node[];
  links?: Link[];
  flowString?: string;
  preset?: 'tmap-etl' | 'scd-dim' | 'cdc-stream' | 'parallel-job' | 'file-processing' | 'subjob-run' | 'rest-api' | 'db-transaction' | 'java-routine' | 'loop-rest' | 'jvm-memory';
}

function getNodeIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('scd')) return <Database className="w-4 h-4 text-fuchsia-400" />;
  if (lower.includes('parallel')) return <Layers className="w-4 h-4 text-amber-400" />;
  if (lower.includes('file') || lower.includes('csv')) return <FileText className="w-4 h-4 text-emerald-400" />;
  if (lower.includes('db') || lower.includes('sql') || lower.includes('oracle') || lower.includes('mysql') || lower.includes('postgres') || lower.includes('buffer')) return <Database className="w-4 h-4 text-cyan-400" />;
  if (lower.includes('map')) return <Layers className="w-4 h-4 text-purple-400" />;
  if (lower.includes('rest') || lower.includes('http') || lower.includes('api')) return <Globe className="w-4 h-4 text-sky-400" />;
  if (lower.includes('loop') || lower.includes('iterate') || lower.includes('cdc')) return <RefreshCw className="w-4 h-4 text-amber-400" />;
  if (lower.includes('json') || lower.includes('xml') || lower.includes('aggregate') || lower.includes('filter')) return <Cpu className="w-4 h-4 text-teal-400" />;
  if (lower.includes('log') || lower.includes('reject')) return <AlertTriangle className="w-4 h-4 text-amber-400" />;
  if (lower.includes('runjob') || lower.includes('job')) return <Server className="w-4 h-4 text-indigo-400" />;
  return <Server className="w-4 h-4 text-indigo-400" />;
}

function parseAsciiFlow(flowStr: string): { nodes: Node[]; links: Link[] } {
  const pattern = /\[([^\]]+)\]/g;
  const matches = [...flowStr.matchAll(pattern)];
  
  if (matches.length < 2) return { nodes: [], links: [] };

  const linkTypes = [...flowStr.matchAll(/--\(([^)]+)\)-->/g)].map(m => m[1]);

  const parsedNodes: Node[] = matches.map((m, idx) => {
    const compName = m[1].trim();
    const compLower = compName.toLowerCase();

    let details = `Étape ${idx + 1}`;
    if (compLower.includes('scd')) details = 'Gestion Dimension SCD (Type 1 / Type 2)';
    else if (compLower.includes('parallel')) details = 'Orchestration Multi-threads';
    else if (compLower.includes('map')) details = 'Transformation & Mappage';
    else if (compLower.includes('file')) details = 'Lecture / Écriture Fichier';
    else if (compLower.includes('db')) details = 'Opération Base de Données';

    const color = compLower.includes('scd') ? 'border-fuchsia-500/40 bg-fuchsia-950/30 text-fuchsia-300' :
                  compLower.includes('parallel') ? 'border-amber-500/40 bg-amber-950/30 text-amber-300' :
                  compLower.includes('map') ? 'border-purple-500/40 bg-purple-950/30 text-purple-300' :
                  compLower.includes('rest') || compLower.includes('loop') ? 'border-sky-500/40 bg-sky-950/30 text-sky-300' :
                  compLower.includes('reject') || compLower.includes('log') ? 'border-amber-500/40 bg-amber-950/30 text-amber-300' :
                  compLower.includes('file') ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300' :
                  'border-cyan-500/40 bg-cyan-950/30 text-cyan-300';

    return {
      id: `parsed-${idx}`,
      name: compName,
      type: compName.startsWith('t') ? `Composant ${compName}` : compName,
      color,
      icon: getNodeIcon(compName),
      details
    };
  });

  const parsedLinks: Link[] = [];
  for (let i = 0; i < parsedNodes.length - 1; i++) {
    const rawLabel = linkTypes[i] || 'Main';
    const lowerLabel = rawLabel.toLowerCase();
    let linkType: 'main' | 'lookup' | 'reject' | 'trigger' | 'iterate' = 'main';
    if (lowerLabel.includes('iterate')) linkType = 'iterate';
    else if (lowerLabel.includes('lookup')) linkType = 'lookup';
    else if (lowerLabel.includes('reject')) linkType = 'reject';
    else if (lowerLabel.includes('trigger') || lowerLabel.includes('ok') || lowerLabel.includes('error')) linkType = 'trigger';

    parsedLinks.push({
      from: parsedNodes[i].id,
      to: parsedNodes[i + 1].id,
      label: rawLabel,
      type: linkType
    });
  }

  return { nodes: parsedNodes, links: parsedLinks };
}

export const JobFlowVisualizer: React.FC<JobFlowProps> = ({
  title,
  description,
  preset = 'tmap-etl',
  nodes: customNodes,
  links: customLinks,
  flowString
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeNode, setActiveNode] = useState<Node | null>(null);

  let nodes: Node[] = customNodes || [];
  let links: Link[] = customLinks || [];

  if (flowString) {
    const parsed = parseAsciiFlow(flowString);
    if (parsed.nodes.length > 0) {
      nodes = parsed.nodes;
      links = parsed.links;
    } else {
      return null;
    }
  }

  if (nodes.length === 0) {
    return null;
  }

  if (!customNodes && !flowString) {
    if (preset === 'tmap-etl') {
      nodes = [
        { id: '1', name: 'tFileInputDelimited_1', type: 'Lecture CSV (Main Row)', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300', details: 'Séparateur ;', icon: <FileText className="w-4 h-4 text-emerald-400" /> },
        { id: '2', name: 'tPostgreSQLInput_1', type: 'Lookup DB', color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300', details: 'Unique Match', icon: <Database className="w-4 h-4 text-cyan-400" /> },
        { id: '3', name: 'tMap_1', type: 'Inner Join & Mappage', color: 'border-purple-500/40 bg-purple-950/20 text-purple-300', details: 'Catch Rejects = true', icon: <Layers className="w-4 h-4 text-purple-400" /> },
        { id: '4', name: 'tDBOutput_1', type: 'Insertion DB', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300', details: 'Batch 10000', icon: <Database className="w-4 h-4 text-emerald-400" /> },
        { id: '5', name: 'tLogRow_Reject', type: 'Rejets Inner Join', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300', details: 'Console Rejets', icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> }
      ];
      links = [
        { from: '1', to: '3', label: 'row1 (Main)', type: 'main' },
        { from: '2', to: '3', label: 'row2 (Lookup)', type: 'lookup' },
        { from: '3', to: '4', label: 'out_valides', type: 'main' },
        { from: '3', to: '5', label: 'out_reject', type: 'reject' }
      ];
    } else if (preset === 'scd-dim') {
      nodes = [
        { id: '1', name: 'tFileInputDelimited_1', type: 'Source Opérationnelle (Input)', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300', details: 'Fichier Clients / Ventes', icon: <FileText className="w-4 h-4 text-emerald-400" /> },
        { id: '2', name: 'tMap_Keys', type: 'Mappage & Extraction Clé Métier', color: 'border-purple-500/40 bg-purple-950/20 text-purple-300', details: 'Cle Business (ex: client_id)', icon: <Layers className="w-4 h-4 text-purple-400" /> },
        { id: '3', name: 'tDBSCD_1', type: 'Gestion SCD (Type 1 & Type 2)', color: 'border-fuchsia-500/40 bg-fuchsia-950/20 text-fuchsia-300', details: 'Type 1: Overwrite | Type 2: Versioning', icon: <Database className="w-4 h-4 text-fuchsia-400" /> },
        { id: '4', name: 'tDBOutput_DimClient', type: 'Table Dimension DWH Target', color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300', details: 'Fields: scd_start, scd_end, scd_active', icon: <Database className="w-4 h-4 text-cyan-400" /> },
        { id: '5', name: 'tLogRow_Audit', type: 'Audit & Journalisation', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300', details: 'Console Historique SCD', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> }
      ];
      links = [
        { from: '1', to: '2', label: 'row1 (Main)', type: 'main' },
        { from: '2', to: '3', label: 'row2 (Main)', type: 'main' },
        { from: '3', to: '4', label: 'SCD Output', type: 'main' },
        { from: '4', to: '5', label: 'OnSubjobOk', type: 'trigger' }
      ];
    } else if (preset === 'cdc-stream') {
      nodes = [
        { id: '1', name: 'tOracleCDC_1', type: 'Capture des Changements (CDC)', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300', details: 'Redo Logs / Triggers CDC', icon: <RefreshCw className="w-4 h-4 text-amber-400" /> },
        { id: '2', name: 'tMap_FilterCDC', type: 'Filtrage Opérations (I/U/D)', color: 'border-purple-500/40 bg-purple-950/20 text-purple-300', details: 'TALEND_CDC_TYPE', icon: <Layers className="w-4 h-4 text-purple-400" /> },
        { id: '3', name: 'tDBOutput_Staging', type: 'Insertion Staging DWH', color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300', details: 'Upsert Temps Réel', icon: <Database className="w-4 h-4 text-cyan-400" /> }
      ];
      links = [
        { from: '1', to: '2', label: 'cdc_row (Main)', type: 'main' },
        { from: '2', to: '3', label: 'filtered (Main)', type: 'main' }
      ];
    } else if (preset === 'parallel-job') {
      nodes = [
        { id: '1', name: 'tParallelize_1', type: 'Orchestrateur Parallèle', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300', details: 'Multi-threading (Parallel Exec)', icon: <Layers className="w-4 h-4 text-amber-400" /> },
        { id: '2', name: 'tRunJob_Clients', type: 'Subjob Chargement Clients', color: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-300', details: 'Thread 1', icon: <Server className="w-4 h-4 text-indigo-400" /> },
        { id: '3', name: 'tRunJob_Ventes', type: 'Subjob Chargement Ventes', color: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-300', details: 'Thread 2', icon: <Server className="w-4 h-4 text-indigo-400" /> },
        { id: '4', name: 'tPostjob_Sync', type: 'Synchronisation Finale', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300', details: 'OnParallelizeComplete', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> }
      ];
      links = [
        { from: '1', to: '2', label: 'Parallel 1', type: 'trigger' },
        { from: '1', to: '3', label: 'Parallel 2', type: 'trigger' },
        { from: '2', to: '4', label: 'OnSubjobOk', type: 'trigger' }
      ];
    } else if (preset === 'file-processing') {
      nodes = [
        { id: '1', name: 'tFileList_1', type: 'Iterateur Répertoire (*.csv)', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300', details: 'Directory Loop', icon: <RefreshCw className="w-4 h-4 text-amber-400" /> },
        { id: '2', name: 'tFileInputDelimited_1', type: 'Lecture Fichier Courant', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300', details: '((String)globalMap.get("tFileList_1_CURRENT_FILEPATH"))', icon: <FileText className="w-4 h-4 text-emerald-400" /> },
        { id: '3', name: 'tMap_Clean', type: 'Transformation & Val', color: 'border-purple-500/40 bg-purple-950/20 text-purple-300', details: 'Standardisation', icon: <Layers className="w-4 h-4 text-purple-400" /> },
        { id: '4', name: 'tDBOutput_1', type: 'Chargement DB', color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300', details: 'Insert / Update Batch', icon: <Database className="w-4 h-4 text-cyan-400" /> }
      ];
      links = [
        { from: '1', to: '2', label: 'Iterate', type: 'iterate' },
        { from: '2', to: '3', label: 'row1 (Main)', type: 'main' },
        { from: '3', to: '4', label: 'out (Main)', type: 'main' }
      ];
    } else if (preset === 'subjob-run') {
      nodes = [
        { id: '1', name: 'tPrejob_1', type: 'Initialisation Contexte', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300', details: 'tContextLoad', icon: <Cpu className="w-4 h-4 text-amber-400" /> },
        { id: '2', name: 'tRunJob_Master', type: 'Appel Subjob Dédié', color: 'border-indigo-500/40 bg-indigo-950/20 text-indigo-300', details: 'Context Param Transmission', icon: <Server className="w-4 h-4 text-indigo-400" /> },
        { id: '3', name: 'tPostjob_1', type: 'Journalisation & Cleanup', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300', details: 'Commit & Disconnect', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> }
      ];
      links = [
        { from: '1', to: '2', label: 'OnComponentOk', type: 'trigger' },
        { from: '2', to: '3', label: 'OnSubjobOk', type: 'trigger' }
      ];
    } else if (preset === 'rest-api' || preset === 'loop-rest') {
      nodes = [
        { id: '1', name: 'tLoop_1', type: 'Boucle d\'Iteration', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300', details: 'For i = 1 to N', icon: <RefreshCw className="w-4 h-4 text-amber-400" /> },
        { id: '2', name: 'tRESTClient_1', type: 'Appel Endpoint REST', color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300', details: 'GET /api/v1/data', icon: <Globe className="w-4 h-4 text-cyan-400" /> },
        { id: '3', name: 'tExtractJSONFields_1', type: 'Parser JSONPath', color: 'border-teal-500/40 bg-teal-950/20 text-teal-300', details: '$.items[*]', icon: <Cpu className="w-4 h-4 text-teal-400" /> },
        { id: '4', name: 'tMap_Transform', type: 'Mappage & Cleaning', color: 'border-purple-500/40 bg-purple-950/20 text-purple-300', details: 'Var.cleanData', icon: <Layers className="w-4 h-4 text-purple-400" /> },
        { id: '5', name: 'tBufferOutput_1', type: 'Sortie / Stockage', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300', details: 'Buffer Mémoire / CSV', icon: <Database className="w-4 h-4 text-emerald-400" /> }
      ];
      links = [
        { from: '1', to: '2', label: 'Iterate', type: 'iterate' },
        { from: '2', to: '3', label: 'Response (Main)', type: 'main' },
        { from: '3', to: '4', label: 'Parsed (Main)', type: 'main' },
        { from: '4', to: '5', label: 'out (Main)', type: 'main' }
      ];
    } else if (preset === 'java-routine') {
      nodes = [
        { id: '1', name: 'tFileInputDelimited_1', type: 'Source Fichier', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300', details: 'row1.password_raw', icon: <FileText className="w-4 h-4 text-emerald-400" /> },
        { id: '2', name: 'tMap_SecurityHash', type: 'Routine Java', color: 'border-purple-500/40 bg-purple-950/20 text-purple-300', details: 'SecurityUtils.hashSHA256()', icon: <Cpu className="w-4 h-4 text-purple-400" /> },
        { id: '3', name: 'tDBOutput_1', type: 'Destination DB', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300', details: 'Données Hachées', icon: <Database className="w-4 h-4 text-emerald-400" /> }
      ];
      links = [
        { from: '1', to: '2', label: 'row1 (Main)', type: 'main' },
        { from: '2', to: '3', label: 'out1 (Hashed Data)', type: 'main' }
      ];
    } else if (preset === 'jvm-memory') {
      nodes = [
        { id: '1', name: 'Job Run JVM Args', type: 'Config Mémoire JVM', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300', details: '-Xms256m -Xmx1024m -XX:+UseG1GC', icon: <Cpu className="w-4 h-4 text-amber-400" /> },
        { id: '2', name: 'tMap_1', type: 'Stockage Temp Disque', color: 'border-purple-500/40 bg-purple-950/20 text-purple-300', details: 'Store temp data on disk = true', icon: <Layers className="w-4 h-4 text-purple-400" /> },
        { id: '3', name: 'tSortRow_1', type: 'Tri sur Disque', color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300', details: 'Sort on disk (100k rows in memory)', icon: <RefreshCw className="w-4 h-4 text-cyan-400" /> },
        { id: '4', name: 'tDBOutput_1', type: 'Insertion par Commit Batch', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300', details: 'Batch size = 10000', icon: <Database className="w-4 h-4 text-emerald-400" /> }
      ];
      links = [
        { from: '1', to: '2', label: 'Alloc Heap', type: 'trigger' },
        { from: '2', to: '3', label: 'row1 (Main)', type: 'main' },
        { from: '3', to: '4', label: 'out1 (Sorted)', type: 'main' }
      ];
    } else {
      nodes = [
        { id: '1', name: 'tPrejob_1', type: 'Initialisation', color: 'border-amber-500/40 bg-amber-950/20 text-amber-300', details: 'Contextes', icon: <Cpu className="w-4 h-4 text-amber-400" /> },
        { id: '2', name: 'tDBConnection_1', type: 'Connexion DB', color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300', details: 'Auto Commit = false', icon: <Database className="w-4 h-4 text-cyan-400" /> },
        { id: '3', name: 'tMap_Core', type: 'Job Traitement', color: 'border-purple-500/40 bg-purple-950/20 text-purple-300', details: 'Transformations', icon: <Layers className="w-4 h-4 text-purple-400" /> },
        { id: '4', name: 'tPostjob_1', type: 'Fermeture & Commit', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300', details: 'Nettoyage', icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" /> }
      ];
      links = [
        { from: '1', to: '2', label: 'OnComponentOk', type: 'trigger' },
        { from: '2', to: '3', label: 'OnSubjobOk', type: 'trigger' },
        { from: '3', to: '4', label: 'OnSubjobOk', type: 'trigger' }
      ];
    }
  }

  return (
    <div className={`my-3 p-3.5 rounded-2xl bg-[#171717] border border-zinc-800 text-zinc-100 shadow-sm transition-all ${isFullscreen ? 'fixed inset-4 z-50 overflow-auto bg-[#171717] border-zinc-700' : ''}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <h4 className="text-xs font-mono font-medium text-zinc-200">
            {title}
          </h4>
        </div>

        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
          title="Agrandir"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {description && (
        <p className="text-[11px] text-zinc-400 mb-2 font-mono">
          {description}
        </p>
      )}

      {/* Cyber Grid Schematic Renderer */}
      <div className="relative rounded-xl border border-zinc-800/80 bg-[#0d0d0d] p-3 overflow-x-auto">
        <div className="relative z-10 flex items-center space-x-3 min-w-max py-1">
          {nodes.map((node) => {
            const outLinks = links.filter(l => l.from === node.id);
            const isSelected = activeNode?.id === node.id;

            return (
              <React.Fragment key={node.id}>
                <button
                  type="button"
                  onClick={() => setActiveNode(isSelected ? null : node)}
                  className={`flex flex-col p-2.5 rounded-lg border text-left min-w-[155px] max-w-[200px] ${node.color} transition-all hover:scale-105 ${isSelected ? 'ring-2 ring-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]' : ''}`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    {node.icon}
                    <span className="font-mono text-[11px] font-bold text-zinc-100 truncate">
                      {node.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-zinc-300 leading-tight mb-1">
                    {node.type}
                  </span>
                  {node.details && (
                    <span className="text-[9px] text-zinc-400 font-mono bg-zinc-950/80 px-1 py-0.5 rounded border border-zinc-800/80 truncate">
                      {node.details}
                    </span>
                  )}
                </button>

                {outLinks.length > 0 && (
                  <div className="flex flex-col items-center justify-center space-y-1 px-1">
                    {outLinks.map((link, idx) => (
                      <div key={idx} className="flex flex-col items-center justify-center">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full whitespace-nowrap ${
                          link.type === 'reject' ? 'bg-amber-950/90 text-amber-300 border border-amber-500/40' :
                          link.type === 'lookup' ? 'bg-cyan-950/90 text-cyan-200 border border-cyan-500/40' :
                          link.type === 'trigger' ? 'bg-purple-950/90 text-purple-200 border border-purple-500/40' :
                          link.type === 'iterate' ? 'bg-sky-950/90 text-sky-200 border border-sky-500/40' :
                          'bg-emerald-950/90 text-emerald-200 border border-emerald-500/40'
                        }`}>
                          {link.label}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5" />
                      </div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Node detail drawer if clicked */}
      {activeNode && (
        <div className="mt-2 p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-emerald-300 flex items-center justify-between">
          <span>Focus Composant: <strong>{activeNode.name}</strong> ({activeNode.type}) — {activeNode.details || "Prêt pour exécution"}</span>
          <button onClick={() => setActiveNode(null)} className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">Fermer</button>
        </div>
      )}
    </div>
  );
};
