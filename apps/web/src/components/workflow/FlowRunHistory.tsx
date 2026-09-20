import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { FlowRun } from '../../types';

interface FlowRunHistoryProps {
  runs: FlowRun[];
  onSelectRun: (run: FlowRun) => void;
  onRetryRun?: (runId: string) => Promise<void>;
  onCancelRun?: (runId: string) => Promise<void>;
}

export const FlowRunHistory: React.FC<FlowRunHistoryProps> = ({
  runs,
  onSelectRun,
  onRetryRun,
  onCancelRun,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RUNNING' | 'WAITING' | 'SUCCEEDED' | 'FAILED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRuns = runs.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.flow_name.toLowerCase().includes(q) ||
      (r.trigger_reference && r.trigger_reference.toLowerCase().includes(q)) ||
      (r.correlation_id && r.correlation_id.toLowerCase().includes(q)) ||
      r.id.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCEEDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Succeeded
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      case 'RUNNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <Clock className="w-3.5 h-3.5" /> Running
          </span>
        );
      case 'WAITING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Waiting
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Ban className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Clock className="w-6 h-6 text-indigo-400" />
          Execution Runs Index
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Inspect execution history, step run durations, resolved data references, and runtime failures
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {[
            { id: 'ALL', label: 'All Runs' },
            { id: 'RUNNING', label: 'Running' },
            { id: 'WAITING', label: 'Waiting Approval' },
            { id: 'SUCCEEDED', label: 'Succeeded' },
            { id: 'FAILED', label: 'Failed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter runs by flow, ID, correlation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-72"
          />
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Flow Name</th>
              <th className="py-3 px-4">Version</th>
              <th className="py-3 px-4">Trigger Reference</th>
              <th className="py-3 px-4">Started</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredRuns.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                  No workflow runs match the current filters.
                </td>
              </tr>
            ) : (
              filteredRuns.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onSelectRun(r)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-200 group-hover:text-indigo-300">
                        {r.flow_name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      Run #{r.id}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-indigo-300">
                    v{r.version_number}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono text-xs text-slate-300">
                      {r.trigger_reference || r.trigger_type}
                    </span>
                    {r.correlation_id && (
                      <span className="text-[10px] text-cyan-400 font-mono block mt-0.5">
                        Related: #{r.correlation_id}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(r.started_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-300">
                    {r.duration_ms !== null && r.duration_ms !== undefined
                      ? `${r.duration_ms} ms`
                      : '—'}
                  </td>

                  <td className="py-3.5 px-4">
                    {getStatusBadge(r.status)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {r.status === 'FAILED' && onRetryRun && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetryRun(r.id);
                          }}
                          title="Retry run"
                          className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(r.status === 'RUNNING' || r.status === 'WAITING') && onCancelRun && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelRun(r.id);
                          }}
                          title="Cancel run"
                          className="p-1.5 text-slate-400 hover:text-rose-300 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <div className="flex items-center gap-1 text-indigo-400 group-hover:text-indigo-300 font-medium">
                        <span>Inspect</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
