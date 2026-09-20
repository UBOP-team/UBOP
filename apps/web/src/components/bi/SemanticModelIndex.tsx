import React, { useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, Layers, EyeOff } from 'lucide-react';
import { SemanticModel } from '../../types';
import { Modal } from '../Modal';

interface SemanticModelIndexProps {
  models: SemanticModel[];
  onTriggerRefresh: (modelId: string) => void;
}

export const SemanticModelIndex: React.FC<SemanticModelIndexProps> = ({
  models,
  onTriggerRefresh,
}) => {
  const [selectedModel, setSelectedModel] = useState<SemanticModel | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'OVERVIEW' | 'ENTITIES' | 'MEASURES' | 'REFRESH'>('OVERVIEW');

  return (
    <div className="space-y-4 animate-smooth-fade">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Governed Semantic Models</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Decoupled analytical abstraction layer mapping raw CRM, OMS, and ERP tables into reusable business entities.
          </p>
        </div>
      </div>

      {/* Models Table (Section 10) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-semibold border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Semantic Model</th>
              <th className="px-4 py-3">Source Modules</th>
              <th className="px-4 py-3">Refresh Mode</th>
              <th className="px-4 py-3">Last Refresh</th>
              <th className="px-4 py-3">Health Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {models.map((m) => {
              const isHealthy = m.refresh_status === 'SUCCEEDED';
              return (
                <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <span className="text-[10px] font-mono text-slate-400">{m.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {m.source_type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-600">{m.refresh_mode}</td>
                  <td className="px-4 py-3.5 font-mono text-slate-600">
                    {isHealthy ? 'Today 10:30 UTC' : 'Yesterday 18:00 UTC'}
                  </td>
                  <td className="px-4 py-3.5">
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
                          <AlertTriangle className="w-3 h-3" /> Stale
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedModel(m);
                        setActiveModalTab('OVERVIEW');
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors"
                    >
                      Inspect Detail
                    </button>
                    <button
                      onClick={() => onTriggerRefresh(m.id)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors"
                    >
                      Refresh Now
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Semantic Model Detail Modal (Section 10) */}
      {selectedModel && (
        <Modal
          isOpen={!!selectedModel}
          onClose={() => setSelectedModel(null)}
          title={`Semantic Model: ${selectedModel.name}`}
          size="2xl"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-500 -mt-2">
              Governance definition for {selectedModel.source_type} domain.
            </p>
            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200">
              {[
                { id: 'OVERVIEW', label: 'Overview' },
                { id: 'ENTITIES', label: 'Entities & Fields' },
                { id: 'MEASURES', label: 'Measures' },
                { id: 'REFRESH', label: 'Refresh History' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveModalTab(tab.id as any)}
                  className={`px-3.5 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                    activeModalTab === tab.id
                      ? 'border-slate-900 text-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Overview */}
            {activeModalTab === 'OVERVIEW' && (
              <div className="space-y-3 text-xs">
                <p className="text-slate-600 leading-relaxed">{selectedModel.description}</p>
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-400 block">SOURCE MODULE</span>
                    <span className="font-semibold text-slate-800">{selectedModel.source_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">REFRESH MODE</span>
                    <span className="font-semibold text-slate-800">{selectedModel.refresh_mode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">STATUS</span>
                    <span className="font-semibold text-teal-700">{selectedModel.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">LAST SUCCESSFUL SYNC</span>
                    <span className="font-semibold text-slate-800">Today 10:30 UTC</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Entities & Fields */}
            {activeModalTab === 'ENTITIES' && (
              <div className="space-y-3 max-h-72 overflow-y-auto text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <Layers className="w-3.5 h-3.5 text-teal-600" />
                    Entity: Sales Orders (Source: oms_orders)
                  </div>
                  <div className="space-y-1.5 pl-4 divide-y divide-slate-100">
                    <div className="pt-1 flex items-center justify-between">
                      <span className="font-medium text-slate-800">Order Date</span>
                      <span className="font-mono text-slate-400 text-[10px]">DATE (DIMENSION)</span>
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="font-medium text-slate-800">Sales Channel</span>
                      <span className="font-mono text-slate-400 text-[10px]">STRING (DIMENSION)</span>
                    </div>
                    <div className="pt-1 flex items-center justify-between">
                      <span className="font-medium text-slate-800">Gross Revenue</span>
                      <span className="font-mono text-slate-400 text-[10px]">NUMBER (MEASURE: SUM)</span>
                    </div>
                    <div className="pt-1 flex items-center justify-between opacity-50">
                      <span className="font-medium text-slate-800 flex items-center gap-1">
                        <EyeOff className="w-3 h-3" /> Internal Hash ID
                      </span>
                      <span className="font-mono text-rose-500 text-[10px]">HIDDEN</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Measures */}
            {activeModalTab === 'MEASURES' && (
              <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
                {[
                  { name: 'revenue', formula: 'SUM(Orders.total_amount)', unit: 'VND / USD' },
                  { name: 'net_revenue', formula: 'SUM(Orders.total_amount - Refunds.amount)', unit: 'VND / USD' },
                  { name: 'order_count', formula: 'COUNT(Orders.id)', unit: 'Orders' },
                  { name: 'avg_order_value', formula: 'SUM(Revenue) / COUNT(Orders)', unit: 'VND / USD' },
                ].map((m) => (
                  <div key={m.name} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">{m.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">{m.formula}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-mono font-semibold text-teal-700">
                      {m.unit}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: Refresh History */}
            {activeModalTab === 'REFRESH' && (
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-900">Run #run-001 (SUCCEEDED)</span>
                    <span className="text-[10px] text-slate-500 block font-mono">145ms • 4,200 rows ingested</span>
                  </div>
                  <span className="font-mono text-[10px] text-emerald-800 font-semibold">Today 10:30 UTC</span>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
