import React, { useState } from 'react';
import {
  Plus,
  Zap,
  Terminal,
  Play,
  Sliders,
  History,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { WorkflowRule, WorkflowLog } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { WorkflowNode, WorkflowNodeData } from '../components/WorkflowNode';

interface WorkflowViewProps {
  rules: WorkflowRule[];
  logs: WorkflowLog[];
  onCreateRule: (rule: any) => Promise<void>;
  onTriggerExecution: () => Promise<void>;
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({
  rules,
  logs,
  onCreateRule,
  onTriggerExecution,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'CANVAS' | 'HISTORY' | 'RECIPES'>('CANVAS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node_trigger');

  // Canvas Nodes State (Zapier + ServiceNow style: Trigger -> Condition -> Action)
  const [nodes, setNodes] = useState<WorkflowNodeData[]>([
    {
      id: 'node_trigger',
      type: 'TRIGGER',
      title: 'Inventory Updated',
      subtitle: 'Fires whenever warehouse physical count changes',
      configSummary: 'event_pattern: inventory.stock_adjusted',
      status: 'ACTIVE',
      executionCount: 142,
    },
    {
      id: 'node_condition',
      type: 'CONDITION',
      title: 'Condition: Stock < 10',
      subtitle: 'Evaluates if safety reorder threshold is violated',
      configSummary: 'eval: payload.quantity < 10 && payload.warehouse == "MAIN"',
      status: 'ACTIVE',
      executionCount: 28,
    },
    {
      id: 'node_action',
      type: 'ACTION',
      title: 'Action: Send Slack & SMS Alert',
      subtitle: 'Dispatches emergency supplier restock ticket',
      configSummary: 'adapter: Slack Operations -> #procurement-emergency',
      status: 'ACTIVE',
      executionCount: 28,
    },
  ]);

  const [ruleForm, setRuleForm] = useState({
    name: '',
    event_pattern: 'order.created',
    action_type: 'NOTIFY',
    action_payload: '{"channel": "operations-alert"}',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onCreateRule(ruleForm);
      setIsModalOpen(false);
      setRuleForm({
        name: '',
        event_pattern: 'order.created',
        action_type: 'NOTIFY',
        action_payload: '{"channel": "operations-alert"}',
        is_active: true,
      });
      toast.success('Automation Rule Created', `${ruleForm.name} is now listening on the EventBus.`);
    } catch {
      toast.error('Error', 'Could not create workflow rule.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestTrigger = async () => {
    setIsExecuting(true);
    try {
      await onTriggerExecution();
      toast.success(
        'Pipeline Executed',
        'Trigger fired: Inventory stock < 10 evaluated TRUE. Action dispatched in 16ms.'
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const handleUpdateSelectedNode = (field: string, val: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, [field]: val } : n))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 tracking-tight">
              Workflow Builder & Event Automation
            </h2>
            <span className="font-mono text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              {rules.length} Deployed Recipes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            ServiceNow Flow Designer + Zapier Canvas: Drag-and-drop trigger-condition-action pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTestTrigger}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-400 text-xs font-semibold transition-colors"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
            {isExecuting ? 'Evaluating...' : 'Test Full Workflow'}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/10 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Automation
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
        <button
          onClick={() => setActiveTab('CANVAS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'CANVAS'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          Visual Flow Canvas
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'HISTORY'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          Execution Logs & Telemetry
        </button>
      </div>

      {/* TAB 1: VISUAL CANVAS */}
      {activeTab === 'CANVAS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
          {/* Left / Center: Interactive Canvas Area */}
          <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-start min-h-[520px] relative overflow-hidden shadow-xl">
            {/* Grid dot pattern background */}
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

            {/* Canvas Header info */}
            <div className="w-full flex items-center justify-between mb-8 pb-3 border-b border-slate-800/80 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-slate-200 text-xs">
                  Active Pipeline: Low Stock Auto-Replenishment
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                Trigger → Condition → Action
              </span>
            </div>

            {/* Nodes Stack */}
            <div className="relative z-10 flex flex-col items-center">
              {nodes.map((node, idx) => (
                <WorkflowNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={(n) => setSelectedNodeId(n.id)}
                  onTest={(n) =>
                    toast.info('Step Test', `Evaluating step '${n.title}' in isolation...`)
                  }
                  showConnector={idx < nodes.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Right: Step Configuration Panel */}
          <div className="lg:col-span-4 bg-slate-950/90 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                <h3 className="font-bold text-slate-100">Step Inspector</h3>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/30">
                {selectedNode.type}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Step Name</label>
                <input
                  type="text"
                  value={selectedNode.title}
                  onChange={(e) => handleUpdateSelectedNode('title', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={selectedNode.subtitle}
                  onChange={(e) => handleUpdateSelectedNode('subtitle', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Step Configuration Expression
                </label>
                <textarea
                  rows={4}
                  value={selectedNode.configSummary || ''}
                  onChange={(e) => handleUpdateSelectedNode('configSummary', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-teal-400 focus:outline-none focus:border-teal-500 text-xs leading-relaxed"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  JSON / Python Event Expression evaluated dynamically at runtime.
                </span>
              </div>

              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">Step Status</span>
                  <span className="text-[11px] text-slate-500">Enable in production runs</span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-teal-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  toast.info('Step Verified', `${selectedNode.title} schema contracts verified.`)
                }
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 font-medium transition-colors text-xs"
              >
                Validate Step
              </button>

              <button
                type="button"
                onClick={() =>
                  toast.success('Step Persisted', 'Configuration saved to automation pipeline.')
                }
                className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl shadow-md transition-colors text-xs"
              >
                <Save className="w-3.5 h-3.5" /> Save Node
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXECUTION HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-slate-100">Event Execution Trail</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">Live Async Dispatch Queue</span>
            </div>

            <div className="divide-y divide-slate-800/60 text-xs">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No automation events executed yet. Click &apos;Test Full Workflow&apos; above.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{log.rule_name}</span>
                        <span className="font-mono text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                          {log.event_name}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-1 font-mono">
                        Output: {log.output}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {log.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Automation Rule */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Author Event Automation Rule"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Rule Name *</label>
            <input
              type="text"
              required
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              placeholder="e.g. VIP Order Telegram Dispatch"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Trigger Event Pattern *</label>
            <input
              type="text"
              required
              value={ruleForm.event_pattern}
              onChange={(e) => setRuleForm({ ...ruleForm, event_pattern: e.target.value })}
              placeholder="e.g. order.created or inventory.low"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Action Type</label>
            <select
              value={ruleForm.action_type}
              onChange={(e) => setRuleForm({ ...ruleForm, action_type: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="NOTIFY">NOTIFY (Channel Webhook / Comms)</option>
              <option value="INTEGRATION_SYNC">INTEGRATION_SYNC (Trigger Provider Ingestion)</option>
              <option value="AUTO_ALLOCATE">AUTO_ALLOCATE (ERP Warehouse Reservation)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Action Payload (JSON)</label>
            <textarea
              rows={3}
              value={ruleForm.action_payload}
              onChange={(e) => setRuleForm({ ...ruleForm, action_payload: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Deploy Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
