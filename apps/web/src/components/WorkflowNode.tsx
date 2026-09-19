import React from 'react';
import {
  Zap,
  GitBranch,
  Play,
  Trash2,
  AlertCircle,
  Clock,
  ArrowDown,
} from 'lucide-react';

export type WorkflowNodeType = 'TRIGGER' | 'CONDITION' | 'ACTION';

export interface WorkflowNodeData {
  id: string;
  type: WorkflowNodeType;
  title: string;
  subtitle: string;
  configSummary?: string;
  status: 'ACTIVE' | 'WARNING' | 'DISABLED';
  eventPattern?: string;
  executionCount?: number;
}

export interface WorkflowNodeProps {
  node: WorkflowNodeData;
  isSelected?: boolean;
  onSelect?: (node: WorkflowNodeData) => void;
  onDelete?: (nodeId: string) => void;
  onTest?: (node: WorkflowNodeData) => void;
  showConnector?: boolean;
}

export const WorkflowNode: React.FC<WorkflowNodeProps> = ({
  node,
  isSelected = false,
  onSelect,
  onDelete,
  onTest,
  showConnector = true,
}) => {
  const typeConfig = {
    TRIGGER: {
      label: 'Trigger Node',
      icon: Zap,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    CONDITION: {
      label: 'Decision / Filter',
      icon: GitBranch,
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
    },
    ACTION: {
      label: 'Execution Action',
      icon: Play,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  }[node.type];

  const Icon = typeConfig.icon;

  return (
    <div className="flex flex-col items-center">
      {/* The Node Card */}
      <div
        onClick={() => onSelect && onSelect(node)}
        className={`w-80 bg-white border rounded-2xl p-4 cursor-pointer transition-all duration-200 shadow-xs hover:shadow-md card-hover relative ${
          isSelected
            ? 'border-teal-500 ring-2 ring-teal-200 shadow-sm'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-lg border flex items-center justify-center ${typeConfig.badgeColor}`}
            >
              <Icon className="w-3.5 h-3.5 fill-current" />
            </span>
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-slate-500">
              {typeConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {node.status === 'ACTIVE' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active node" />
            )}
            {node.status === 'WARNING' && (
              <span title="Configuration incomplete">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              </span>
            )}

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node.id);
                }}
                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                title="Delete node"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Title and description */}
        <h4 className="text-sm font-bold text-slate-900">{node.title}</h4>
        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{node.subtitle}</p>

        {/* Payload / config pill */}
        {node.configSummary && (
          <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-teal-700 truncate">
            {node.configSummary}
          </div>
        )}

        {/* Footer info: Executions */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {node.executionCount !== undefined ? `${node.executionCount} executions` : 'Ready to fire'}
          </span>

          {onTest && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTest(node);
              }}
              className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-current" /> Test Step
            </button>
          )}
        </div>
      </div>

      {/* Downward Connector Arrow */}
      {showConnector && (
        <div className="flex flex-col items-center my-2">
          <div className="w-0.5 h-4 bg-slate-300" />
          <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
            <ArrowDown className="w-3.5 h-3.5" />
          </div>
          <div className="w-0.5 h-4 bg-slate-300" />
        </div>
      )}
    </div>
  );
};
