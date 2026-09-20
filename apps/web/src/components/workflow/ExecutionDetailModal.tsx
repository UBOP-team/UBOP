import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Ban,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { FlowRun } from '../../types';

interface ExecutionDetailModalProps {
  run: FlowRun;
  onClose: () => void;
  onRetry?: (runId: string) => Promise<void>;
  onCancel?: (runId: string) => Promise<void>;
}

export const ExecutionDetailModal: React.FC<ExecutionDetailModalProps> = ({
  run,
  onClose,
  onRetry,
  onCancel,
}) => {
  const [selectedStepId, setSelectedStepId] = useState<string>(
    run.step_runs && run.step_runs.length > 0 ? run.step_runs[0].id : ''
  );
  const [activeTab, setActiveTab] = useState<'INPUTS_OUTPUTS' | 'DIAGNOSTICS'>('INPUTS_OUTPUTS');
  const [isActing, setIsActing] = useState(false);

  const selectedStep = run.step_runs?.find((s) => s.id === selectedStepId) || run.step_runs?.[0];

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsActing(true);
    try {
      await onRetry(run.id);
    } finally {
      setIsActing(false);
    }
  };

  const handleCancel = async () => {
    if (!onCancel) return;
    setIsActing(true);
    try {
      await onCancel(run.id);
    } finally {
      setIsActing(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-5xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {run.flow_name}
                </h2>
                <span className="px-2 py-0.5 text-xs font-mono font-medium rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  v{run.version_number}
                </span>
                {getStatusBadge(run.status)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Run ID: <code className="text-slate-300 font-mono">{run.id}</code></span>
                <span>•</span>
                <span>Started: {new Date(run.started_at).toLocaleTimeString()}</span>
                <span>•</span>
                <span>Duration: <strong className="text-slate-200">{run.duration_ms || 0} ms</strong></span>
                {run.correlation_id && (
                  <>
                    <span>•</span>
                    <span className="text-cyan-400">Related: #{run.correlation_id}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(run.status === 'RUNNING' || run.status === 'WAITING') && (
              <button
                onClick={handleCancel}
                disabled={isActing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" /> Cancel Run
              </button>
            )}

            {run.status === 'FAILED' && (
              <button
                onClick={handleRetry}
                disabled={isActing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Retry Flow
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body - 2 Columns */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
          {/* Left Column: Step List Execution Trace */}
          <div className="md:col-span-5 border-r border-slate-800 bg-slate-950/40 p-4 overflow-y-auto space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
              Execution Steps ({run.step_runs?.length || 0})
            </div>

            {(!run.step_runs || run.step_runs.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No step execution records found.
              </div>
            ) : (
              run.step_runs.map((sr, idx) => {
                const isSelected = selectedStep?.id === sr.id;
                return (
                  <div
                    key={sr.id}
                    onClick={() => setSelectedStepId(sr.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {sr.status === 'SUCCEEDED' ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : sr.status === 'FAILED' ? (
                          <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center">
                            <Clock className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">
                            {idx + 1}. {sr.step_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono">
                            {sr.step_type}
                          </span>
                          <span>•</span>
                          <span>{sr.duration_ms || 0} ms</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={`w-4 h-4 text-slate-500 ${isSelected ? 'text-indigo-400' : ''}`} />
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Selected Step Inspector */}
          <div className="md:col-span-7 bg-slate-900 p-5 overflow-y-auto flex flex-col space-y-4">
            {selectedStep ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {selectedStep.step_name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Key: {selectedStep.step_key} · Type: {selectedStep.step_type} · Attempt: {selectedStep.attempt}
                    </p>
                  </div>
                  {getStatusBadge(selectedStep.status)}
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <button
                    onClick={() => setActiveTab('INPUTS_OUTPUTS')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      activeTab === 'INPUTS_OUTPUTS'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                    }`}
                  >
                    Resolved Inputs & Outputs
                  </button>
                  <button
                    onClick={() => setActiveTab('DIAGNOSTICS')}
                    className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                      activeTab === 'DIAGNOSTICS'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                    }`}
                  >
                    Diagnostics & Timing
                  </button>
                </div>

                {activeTab === 'INPUTS_OUTPUTS' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                        <span>Resolved Inputs</span>
                        <span className="text-[10px] text-slate-500 font-mono">Pills interpolated</span>
                      </div>
                      <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto max-h-48">
                        {JSON.stringify(selectedStep.resolved_inputs || {}, null, 2)}
                      </pre>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                        <span>Produced Outputs</span>
                        <span className="text-[10px] text-slate-500 font-mono">Step execution result</span>
                      </div>
                      <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto max-h-48">
                        {JSON.stringify(selectedStep.outputs || {}, null, 2)}
                      </pre>
                    </div>

                    {selectedStep.error_message && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                        <div className="font-semibold flex items-center gap-1.5 mb-1">
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                          <span>Error: {selectedStep.error_code || 'EXECUTION_FAILED'}</span>
                        </div>
                        <p className="font-mono text-xs">{selectedStep.error_message}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'DIAGNOSTICS' && (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="text-slate-400">Step Duration</span>
                        <p className="text-sm font-bold text-white mt-1">
                          {selectedStep.duration_ms || 0} ms
                        </p>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="text-slate-400">Execution Attempt</span>
                        <p className="text-sm font-bold text-white mt-1">
                          Attempt #{selectedStep.attempt}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="text-slate-400">Started At</span>
                        <p className="text-xs font-mono text-slate-300 mt-1">
                          {new Date(selectedStep.started_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                        <span className="text-slate-400">Completed At</span>
                        <p className="text-xs font-mono text-slate-300 mt-1">
                          {selectedStep.completed_at ? new Date(selectedStep.completed_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 space-y-1.5">
                      <span className="text-slate-400 font-medium">Step Isolation Guarantee</span>
                      <p className="text-slate-400 text-xs leading-relaxed">
                        Executed inside isolated transactional worker sandbox. Runtime inputs and outputs are cryptographically sealed and immutable across flow edits.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                Select a step on the left to inspect execution details.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>ServiceNow Flow Designer Runtime Inspector</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
