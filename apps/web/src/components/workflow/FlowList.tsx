import React, { useState } from 'react';
import {
  Search,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Zap,
  Edit3,
  Power,
} from 'lucide-react';
import { FlowDefinition } from '../../types';

interface FlowListProps {
  flows: FlowDefinition[];
  onSelectFlow: (flowId: string) => void;
  onCreateFlow: (newFlow: { name: string; description: string; category: string }) => Promise<void>;
  onRunTest: (flowId: string) => void;
  onRunLive?: (flowId: string) => void;
  onToggleStatus: (flowId: string, currentStatus: string) => Promise<void>;
}

export const FlowList: React.FC<FlowListProps> = ({
  flows,
  onSelectFlow,
  onCreateFlow,
  onRunTest,
  onRunLive,
  onToggleStatus,
}) => {
  const [activeView, setActiveView] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'FAILED_RECENTLY' | 'INACTIVE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isNewFlowModalOpen, setIsNewFlowModalOpen] = useState(false);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowDesc, setNewFlowDesc] = useState('');
  const [newFlowCat, setNewFlowCat] = useState('OMS');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFlows = flows.filter((f) => {
    // System view filter
    if (activeView === 'ACTIVE' && f.status !== 'ACTIVE') return false;
    if (activeView === 'DRAFT' && f.status !== 'DRAFT' && !f.draft_version_id) return false;
    if (activeView === 'FAILED_RECENTLY' && f.last_run_status !== 'FAILED') return false;
    if (activeView === 'INACTIVE' && f.status !== 'INACTIVE') return false;

    // Category filter
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;

    // Search filter
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      (f.description && f.description.toLowerCase().includes(q)) ||
      f.category.toLowerCase().includes(q)
    );
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlowName.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateFlow({
        name: newFlowName.trim(),
        description: newFlowDesc.trim(),
        category: newFlowCat,
      });
      setIsNewFlowModalOpen(false);
      setNewFlowName('');
      setNewFlowDesc('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Draft
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Inactive
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Zap className="w-6 h-6 text-indigo-400" />
            Automation Flows
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            ServiceNow Workflow Studio · Compose cross-module automation from governed UBOP capabilities
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewFlowModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" /> New Flow
          </button>
        </div>
      </div>

      {/* System Views Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {[
            { id: 'ALL', label: 'All Flows' },
            { id: 'ACTIVE', label: 'Active' },
            { id: 'DRAFT', label: 'Draft Changes' },
            { id: 'FAILED_RECENTLY', label: 'Failed Recently' },
            { id: 'INACTIVE', label: 'Inactive' },
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeView === view.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>

        {/* Search and Category Filter */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search flows by name, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Categories</option>
            <option value="OMS">OMS</option>
            <option value="CRM">CRM</option>
            <option value="ERP">ERP</option>
            <option value="BI">BI</option>
            <option value="CROSS_MODULE">Cross-Module</option>
          </select>
        </div>
      </div>

      {/* Flows Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Flow Name</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Trigger Contract</th>
              <th className="py-3 px-4">Version Status</th>
              <th className="py-3 px-4">Last Run</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredFlows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                  No automation flows match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredFlows.map((f) => {
                const triggerEvent = f.active_version?.trigger_definition?.event_name || f.draft_version?.trigger_definition?.event_name || 'Event Trigger';

                return (
                  <tr
                    key={f.id}
                    onClick={() => onSelectFlow(f.id)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-200 group-hover:text-indigo-300 text-xs">
                          {f.name}
                        </span>
                        {f.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-xs">
                            {f.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300 font-medium">
                        {f.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>{triggerEvent}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 text-xs">
                        {f.active_version ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono font-medium">
                            v{f.active_version.version_number} Active
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}

                        {f.draft_version && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 font-mono text-[10px]" title="Draft edits present">
                            v{f.draft_version.version_number} Draft
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        {f.last_run_at ? (
                          <div className="flex items-center gap-1.5">
                            {f.last_run_status === 'SUCCEEDED' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            <span className="text-slate-300">
                              {new Date(f.last_run_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500">Never executed</span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {f.run_count} runs total
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(f.status)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {onRunLive && f.status === 'ACTIVE' && (
                          <button
                            onClick={() => onRunLive(f.id)}
                            className="p-1.5 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-purple-950/40 transition-colors"
                            title="Trigger Live Flow Run"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => onRunTest(f.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          title="Run Test Simulator"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onSelectFlow(f.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors"
                          title="Open in Flow Designer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onToggleStatus(f.id, f.status)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                          title={f.status === 'ACTIVE' ? 'Deactivate Flow' : 'Activate Flow'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* New Flow Modal */}
      {isNewFlowModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Create New Automation Flow</h3>
            <p className="text-xs text-slate-400">
              Establish a new flow definition in Draft state. You can configure triggers and steps in Flow Designer before activation.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Flow Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Order Auto Routing"
                  value={newFlowName}
                  onChange={(e) => setNewFlowName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Describe business intent..."
                  rows={3}
                  value={newFlowDesc}
                  onChange={(e) => setNewFlowDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newFlowCat}
                  onChange={(e) => setNewFlowCat(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                >
                  <option value="OMS">OMS Commerce</option>
                  <option value="CRM">CRM Sales & Leads</option>
                  <option value="ERP">ERP Supply & Inventory</option>
                  <option value="BI">BI & Analytics</option>
                  <option value="CROSS_MODULE">Cross-Module</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewFlowModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md"
                >
                  {isSubmitting ? 'Creating...' : 'Create Draft Flow'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
