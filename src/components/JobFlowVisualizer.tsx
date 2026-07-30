import React from 'react';
import { ArrowRight, Database, FileText, Cpu, CheckCircle2, AlertTriangle, Layers, Globe } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: React.ReactNode;
}

interface Link {
  from: string;
  to: string;
  label: string;
  type: 'main' | 'lookup' | 'reject' | 'trigger';
}

interface JobFlowProps {
  title: string;
  description?: string;
  nodes?: Node[];
  links?: Link[];
  preset?: 'tmap-etl' | 'rest-api' | 'db-transaction' | 'java-routine';
}

export const JobFlowVisualizer: React.FC<JobFlowProps> = ({ title, description, preset = 'tmap-etl', nodes: customNodes, links: customLinks }) => {
  // Presets if not custom
  let nodes: Node[] = customNodes || [];
  let links: Link[] = customLinks || [];

  if (!customNodes || customNodes.length === 0) {
    if (preset === 'tmap-etl') {
      nodes = [
        { id: '1', name: 'tFileInputDelimited_1', type: 'Lecture CSV Clients', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: <FileText className="w-5 h-5 text-emerald-600" /> },
        { id: '2', name: 'tPostgreSQLInput_1', type: 'Lookup Reference DB', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: <Database className="w-5 h-5 text-blue-600" /> },
        { id: '3', name: 'tMap_1', type: 'Transformation & Join', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30', icon: <Layers className="w-5 h-5 text-indigo-600" /> },
        { id: '4', name: 'tDBOutput_1', type: 'Insertion DB Data Warehouse', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', icon: <Database className="w-5 h-5 text-purple-600" /> },
        { id: '5', name: 'tLogRow_Reject', type: 'Logs Lignes Rejetées', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: <AlertTriangle className="w-5 h-5 text-amber-600" /> }
      ];
      links = [
        { from: '1', to: '3', label: 'row1 (Main)', type: 'main' },
        { from: '2', to: '3', label: 'row2 (Lookup Inner Join)', type: 'lookup' },
        { from: '3', to: '4', label: 'out_valides (Main)', type: 'main' },
        { from: '3', to: '5', label: 'out_reject (Catch Unmatched)', type: 'reject' }
      ];
    } else if (preset === 'rest-api') {
      nodes = [
        { id: '1', name: 'tRESTRequest_1', type: 'Endpoint GET /api/v1/users', color: 'bg-sky-500/10 text-sky-600 border-sky-500/30', icon: <Globe className="w-5 h-5 text-sky-600" /> },
        { id: '2', name: 'tExtractJSONFields_1', type: 'Parsing JSONPath', color: 'bg-teal-500/10 text-teal-600 border-teal-500/30', icon: <Cpu className="w-5 h-5 text-teal-600" /> },
        { id: '3', name: 'tJavaRow_1', type: 'Exécution Routine Java Custom', color: 'bg-violet-500/10 text-violet-600 border-violet-500/30', icon: <Cpu className="w-5 h-5 text-violet-600" /> },
        { id: '4', name: 'tRESTResponse_1', type: 'Status 200 OK + Payload JSON', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" /> }
      ];
      links = [
        { from: '1', to: '2', label: 'get_user (Main)', type: 'main' },
        { from: '2', to: '3', label: 'parsed_data (Main)', type: 'main' },
        { from: '3', to: '4', label: 'response (Main)', type: 'main' }
      ];
    } else if (preset === 'java-routine') {
      nodes = [
        { id: '1', name: 'tFileInputDelimited_1', type: 'Lecture Données Brutes', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: <FileText className="w-5 h-5 text-emerald-600" /> },
        { id: '2', name: 'tMap_RoutineCall', type: 'SecurityUtils.hashSHA256()', color: 'bg-violet-500/10 text-violet-600 border-violet-500/30', icon: <Cpu className="w-5 h-5 text-violet-600" /> },
        { id: '3', name: 'tDBOutput_1', type: 'Insertion Hachée DB', color: 'bg-purple-500/10 text-purple-600 border-purple-500/30', icon: <Database className="w-5 h-5 text-purple-600" /> }
      ];
      links = [
        { from: '1', to: '2', label: 'row1 (Main)', type: 'main' },
        { from: '2', to: '3', label: 'out1 (Hashed Data)', type: 'main' }
      ];
    } else {
      nodes = [
        { id: '1', name: 'tPrejob_1', type: 'Initialisation Context', color: 'bg-amber-500/10 text-amber-600 border-amber-500/30', icon: <Cpu className="w-5 h-5 text-amber-600" /> },
        { id: '2', name: 'tDBConnection_1', type: 'Connexion PostgreSQL', color: 'bg-blue-500/10 text-blue-600 border-blue-500/30', icon: <Database className="w-5 h-5 text-blue-600" /> },
        { id: '3', name: 'tMap_Core', type: 'Traitement Principal', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30', icon: <Layers className="w-5 h-5 text-indigo-600" /> },
        { id: '4', name: 'tPostjob_1', type: 'Fermeture & Commit', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30', icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" /> }
      ];
      links = [
        { from: '1', to: '2', label: 'OnComponentOk', type: 'trigger' },
        { from: '2', to: '3', label: 'OnSubjobOk', type: 'trigger' },
        { from: '3', to: '4', label: 'OnSubjobOk', type: 'trigger' }
      ];
    }
  }

  return (
    <div className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800 shadow-md my-3 font-sans">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h4 className="text-xs font-semibold tracking-wide uppercase text-slate-300">
            Schéma Talend Extrait du Livre : <span className="text-emerald-400 font-bold">{title}</span>
          </h4>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
          Représentation Graphique de Job
        </span>
      </div>

      {description && <p className="text-xs text-slate-400 mb-4">{description}</p>}

      {/* Visual Flow diagram */}
      <div className="overflow-x-auto py-3">
        <div className="flex items-center space-x-3 min-w-max px-2">
          {nodes.map((node, idx) => {
            const outLink = links.find(l => l.from === node.id);
            return (
              <React.Fragment key={node.id}>
                {/* Node Box */}
                <div className={`flex flex-col p-3 rounded-lg border min-w-[160px] max-w-[200px] transition-all hover:scale-105 shadow-sm ${node.color} bg-slate-950/80 backdrop-blur`}>
                  <div className="flex items-center space-x-2 mb-1.5">
                    {node.icon}
                    <span className="font-mono text-xs font-bold text-slate-100 truncate">
                      {node.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400 leading-tight">
                    {node.type}
                  </span>
                </div>

                {/* Arrow Connector */}
                {outLink && (
                  <div className="flex flex-col items-center justify-center px-1">
                    <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full mb-1 ${
                      outLink.type === 'reject' ? 'bg-amber-950 text-amber-400 border border-amber-800/50' :
                      outLink.type === 'lookup' ? 'bg-blue-950 text-blue-400 border border-blue-800/50' :
                      outLink.type === 'trigger' ? 'bg-purple-950 text-purple-400 border border-purple-800/50' :
                      'bg-slate-800 text-emerald-400 border border-slate-700'
                    }`}>
                      {outLink.label}
                    </span>
                    <ArrowRight className="w-5 h-5 text-slate-500" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
