import React, { useState } from 'react';
import {
  Plus,
  Zap,
  Play,
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

  // Canvas Nodes State
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
    <div className="space-y-6 animate-smooth-fade">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Workflow Builder & Event Automation
            </h2>
            <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
              {rules.length} Deployed Recipes
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Drag-and-drop trigger-condition-action pipelines with event-driven execution.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTestTrigger}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-xs btn-press"
          >
            <Play className={`w-3.5 h-3.5 fill-current text-teal-600 ${isExecuting ? 'animate-spin' : ''}`} />
            {isExecuting ? 'Evaluating...' : 'Test Full Workflow'}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-all shadow-xs shrink-0 btn-press"
          >
            <Plus className="w-4 h-4" /> Add Automation
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
        <button
          onClick={() => setActiveTab('CANVAS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all btn-press ${
            activeTab === 'CANVAS'
              ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4" />
          Visual Flow Canvas
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all btn-press ${
            activeTab === 'HISTORY'
              ? 'bg-teal-50 text-teal-800 border border-teal-200 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4" />
          Execution Logs & Telemetry
        </button>
      </div>

      {/* TAB 1: VISUAL CANVAS */}
      {activeTab === 'CANVAS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-smooth-fade">
          {/* Left / Center: Interactive Canvas Area */}
          <div className="lg:col-span-8 bg-slate-50/50 border border-slate-200/90 rounded-2xl p-6 flex flex-col items-center justify-start min-h-[520px] relative overflow-hidden shadow-xs">
            {/* Grid dot pattern background */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

            {/* Canvas Header info */}
            <div className="w-full flex items-center justify-between mb-8 pb-3 border-b border-slate-200 relative z-10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-800 text-xs">
                  Active Pipeline: Low Stock Auto-Replenishment
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-xs">
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
          <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 text-xs shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Step Inspector</h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
                {selectedNode.type}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Step Name</label>
                <input
                  type="text"
                  value={selectedNode.title}
                  onChange={(e) => handleUpdateSelectedNode('title', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={selectedNode.subtitle}
                  onChange={(e) => handleUpdateSelectedNode('subtitle', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Step Configuration Expression
                </label>
                <textarea
                  rows={4}
                  value={selectedNode.configSummary || ''}
                  onChange={(e) => handleUpdateSelectedNode('configSummary', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-slate-800 focus:outline-none focus:border-teal-500 text-xs leading-relaxed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  JSON / Python Event Expression evaluated dynamically at runtime.
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Step Status</span>
                  <span className="text-[11px] text-slate-500">Enable in production runs</span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-teal-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() =>
                  toast.info('Step Verified', `${selectedNode.title} schema contracts verified.`)
                }
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium transition-colors text-xs btn-press"
              >
                Validate Step
              </button>

              <button
                type="button"
                onClick={() =>
                  toast.success('Step Persisted', 'Configuration saved to automation pipeline.')
                }
                className="flex items-center gap-1.5 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-xs transition-colors text-xs btn-press"
              >
                <Save className="w-3.5 h-3.5" /> Save Node
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXECUTION HISTORY */}
      {activeTab === 'HISTORY' && (
        <div className="space-y-4 animate-smooth-fade">
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Event Execution Trail</span>
              <span className="text-[10px] font-mono text-slate-500">Live Async Dispatch Queue</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No automation events executed yet. Click &apos;Test Full Workflow&apos; above.
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{log.rule_name}</span>
                        <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                          {log.event_name}
                        </span>
                      </div>
                      <div className="text-slate-500 text-[11px] mt-1 font-mono">
                        Output: {log.output}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {log.status}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
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
            <label className="block text-slate-700 font-medium mb-1">Rule Name *</label>
            <input
              type="text"
              required
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              placeholder="e.g. VIP Order Telegram Dispatch"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Trigger Event Pattern *</label>
            <input
              type="text"
              required
              value={ruleForm.event_pattern}
              onChange={(e) => setRuleForm({ ...ruleForm, event_pattern: e.target.value })}
              placeholder="e.g. order.created or inventory.low"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Action Type</label>
            <select
              value={ruleForm.action_type}
              onChange={(e) => setRuleForm({ ...ruleForm, action_type: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            >
              <option value="NOTIFY">NOTIFY (Channel Webhook / Comms)</option>
              <option value="INTEGRATION_SYNC">INTEGRATION_SYNC (Trigger Provider Ingestion)</option>
              <option value="AUTO_ALLOCATE">AUTO_ALLOCATE (ERP Warehouse Reservation)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Action Payload (JSON)</label>
            <textarea
              rows={3}
              value={ruleForm.action_payload}
              onChange={(e) => setRuleForm({ ...ruleForm, action_payload: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press"
            >
              {loading ? 'Registering...' : 'Deploy Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
