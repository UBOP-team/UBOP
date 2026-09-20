import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { SemanticModel, RefreshRun } from '../../types';
import { Modal } from '../Modal';

interface DataRefreshManagerProps {
  models: SemanticModel[];
  runs: RefreshRun[];
  onTriggerRefresh: (modelId: string, isRetry?: boolean) => void;
}

export const DataRefreshManager: React.FC<DataRefreshManagerProps> = ({
  models,
  runs,
  onTriggerRefresh,
}) => {
  const [selectedErrorRun, setSelectedErrorRun] = useState<RefreshRun | null>(null);

  return (
    <div className="space-y-6 animate-smooth-fade">
      <div>
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Data Freshness &amp; Refresh Operations</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Asynchronous projection pipelines synchronizing operational data from CRM, OMS, and ERP into analytical read models.
        </p>
      </div>

      {/* Model Freshness Overview Table (Section 37) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900">Semantic Model Replication Status</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Semantic Model</th>
                <th className="px-4 py-2.5">Replication Pipeline</th>
                <th className="px-4 py-2.5">Last Successful Sync</th>
                <th className="px-4 py-2.5">Freshness State</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {models.map((m) => {
                const isHealthy = m.refresh_status === 'SUCCEEDED';
                return (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{m.source_type} &bull; {m.refresh_mode}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {isHealthy ? 'Today 10:30 UTC' : 'Yesterday 18:00 UTC'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                          isHealthy
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {isHealthy ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Healthy
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" /> Stale Data
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onTriggerRefresh(m.id, !isHealthy)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg shadow-2xs transition-colors btn-press ${
                          !isHealthy
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700'
                        }`}
                      >
                        {!isHealthy ? 'Retry Refresh' : 'Refresh Now'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh Audit Runs (Section 38 & 39) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-900">Recent Refresh Execution Audit Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Run Identifier</th>
                <th className="px-4 py-2.5">Model</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Duration</th>
                <th className="px-4 py-2.5">Rows Processed</th>
                <th className="px-4 py-2.5 text-right">Diagnostics</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {runs.map((r) => {
                const isSuccess = r.status === 'SUCCEEDED';
                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">{r.id}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {r.semantic_model_name || r.semantic_model_id}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                          isSuccess
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">{r.duration_ms} ms</td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {r.rows_processed.toLocaleString()} records
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.error_message ? (
                        <button
                          onClick={() => setSelectedErrorRun(r)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                        >
                          View Diagnostics
                        </button>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">&bull; Optimal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Refresh Error Diagnostics Modal (Section 39) */}
      {selectedErrorRun && (
        <Modal
          isOpen={!!selectedErrorRun}
          onClose={() => setSelectedErrorRun(null)}
          title={`Refresh Failure: ${selectedErrorRun.semantic_model_id}`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <p className="text-xs text-slate-500 -mt-2">
              Diagnostics and recovery options for analytical projection.
            </p>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900">
              <span className="font-bold block">Error Diagnostic Message</span>
              <p className="font-mono text-[11px]">{selectedErrorRun.error_message}</p>
            </div>
            <p className="text-slate-600">
              Reports depending on this model remain fully readable using the last successful snapshot (19 Sep 2026, 18:00 UTC).
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedErrorRun(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  setSelectedErrorRun(null);
                  onTriggerRefresh(selectedErrorRun.semantic_model_id, true);
                }}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs"
              >
                Retry Refresh
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
