import React, { useState } from 'react';
import { GitMerge, ArrowRight } from 'lucide-react';
import { SubflowDefinition } from '../../types';

interface SubflowListProps {
  subflows: SubflowDefinition[];
}

export const SubflowList: React.FC<SubflowListProps> = ({ subflows }) => {
  const [selectedSubflow, setSelectedSubflow] = useState<SubflowDefinition | null>(null);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <GitMerge className="w-6 h-6 text-cyan-400" />
          Reusable Subflow Library
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          ServiceNow Subflows · Encapsulate multi-step logic with defined inputs and outputs for cross-flow reuse
        </p>
      </div>

      {/* Grid of Subflows */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subflows.map((sub) => (
          <div
            key={sub.id}
            onClick={() => setSelectedSubflow(sub)}
            className="p-5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-2xl transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/5 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-[10px] font-mono font-semibold text-cyan-400 border border-cyan-800/40">
                  Subflow
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {sub.steps?.length || 1} internal step(s)
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {sub.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {sub.description}
                </p>
              </div>

              <div className="pt-2 text-[11px] text-slate-400 space-y-1 font-mono">
                <div>Inputs: {sub.input_schema?.map((i) => i.name).join(', ') || 'none'}</div>
                <div>Outputs: {sub.output_schema?.map((o) => o.name).join(', ') || 'none'}</div>
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Status: <strong className="text-emerald-400 font-medium">{sub.status}</strong></span>
              <span className="text-cyan-400 group-hover:text-cyan-300 font-medium flex items-center gap-1">
                View Definition <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Subflow Details Modal */}
      {selectedSubflow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">{selectedSubflow.name}</h2>
                <code className="text-xs text-slate-400 font-mono mt-0.5 block">
                  ID: {selectedSubflow.id}
                </code>
              </div>
              <button
                onClick={() => setSelectedSubflow(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedSubflow.description}
            </p>

            {/* Input Specs */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Required Subflow Inputs ({selectedSubflow.input_schema.length})
              </h4>
              <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/60 text-xs">
                {selectedSubflow.input_schema.map((inp, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-semibold text-slate-200">{inp.name}</span>
                      <span className="text-[11px] text-slate-400 block">{inp.label}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                      {inp.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Output Specs */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Produced Subflow Outputs ({selectedSubflow.output_schema.length})
              </h4>
              <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/60 text-xs">
                {selectedSubflow.output_schema.map((out, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-semibold text-slate-200">{out.name}</span>
                      <span className="text-[11px] text-slate-400 block">{out.label}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-400">
                      {out.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedSubflow(null)}
                className="px-4 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
