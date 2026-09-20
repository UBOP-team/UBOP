import React, { useState } from 'react';
import {
  Layers,
  Search,
  ArrowRight,
  Tag,
  Radio,
} from 'lucide-react';
import { ActionDefinition } from '../../types';

interface ActionCatalogProps {
  actions: ActionDefinition[];
}

export const ActionCatalog: React.FC<ActionCatalogProps> = ({ actions }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectedAction, setInspectedAction] = useState<ActionDefinition | null>(null);

  const categories = ['ALL', 'CRM', 'OMS', 'ERP', 'BI', 'NOTIFICATIONS', 'PROVIDERS'];

  const filteredActions = actions.filter((a) => {
    if (selectedCategory !== 'ALL' && a.category !== selectedCategory) return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.key.toLowerCase().includes(q) ||
      (a.description && a.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Layers className="w-6 h-6 text-indigo-400" />
          Governed Action Catalog
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Reusable, atomic operations across CRM, OMS, ERP, BI, Notifications, and external providers
        </p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search catalog by key, capability..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-72"
          />
        </div>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActions.map((act) => (
          <div
            key={act.id}
            onClick={() => setInspectedAction(act)}
            className="p-5 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all cursor-pointer shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between group"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono font-semibold text-indigo-300 border border-slate-700">
                  {act.category}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  v{act.version} · {act.usage_count} flows
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {act.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {act.description}
                </p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate">{act.key}</span>
              </div>

              {act.connection_type_required && (
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-950/40 border border-cyan-500/30 text-[10px] text-cyan-300 font-mono">
                  <Radio className="w-3 h-3 text-cyan-400" />
                  <span>Connection: {act.connection_type_required}</span>
                </div>
              )}
            </div>

            <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>{act.input_schema.length} inputs · {act.output_schema.length} outputs</span>
              <span className="text-indigo-400 group-hover:text-indigo-300 font-medium flex items-center gap-1">
                Inspect <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Inspect Action Drawer / Modal */}
      {inspectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">{inspectedAction.name}</h2>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-mono text-indigo-400">
                    v{inspectedAction.version}
                  </span>
                </div>
                <code className="text-xs text-slate-400 font-mono mt-0.5 block">
                  {inspectedAction.key}
                </code>
              </div>
              <button
                onClick={() => setInspectedAction(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {inspectedAction.description}
            </p>

            {/* Input Schema */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Input Parameters ({inspectedAction.input_schema.length})
              </h4>
              <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/60 text-xs">
                {inspectedAction.input_schema.map((inp, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-200">{inp.name}</span>
                        {inp.required && (
                          <span className="text-[10px] text-rose-400 font-medium">required</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">{inp.description || inp.label}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                      {inp.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Output Schema */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Produced Output Schema ({inspectedAction.output_schema.length})
              </h4>
              <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/60 text-xs">
                {inspectedAction.output_schema.map((out, idx) => (
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
                onClick={() => setInspectedAction(null)}
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
