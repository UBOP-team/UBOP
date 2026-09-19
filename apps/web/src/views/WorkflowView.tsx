import React, { useState } from 'react';
import { Plus, Zap, CheckCircle, Terminal, Play, ArrowRight } from 'lucide-react';
import { WorkflowRule, WorkflowLog } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const [ruleForm, setRuleForm] = useState({
    name: '',
    event_pattern: 'order.created',
    action_type: 'NOTIFY',
    action_payload: '{"channel": "operations-alert"}',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);

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
      toast.success('Trigger Dispatched', 'Simulated domain event published to EventBus.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Workflow & Event Automations</h2>
          <p className="text-xs text-slate-400 mt-1">
            Build event-driven automation recipes across CRM leads, OMS fulfillment, and provider webhooks.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleTestTrigger}
            disabled={isExecuting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            <Play className={`w-3.5 h-3.5 text-teal-400 ${isExecuting ? 'animate-spin' : ''}`} />
            {isExecuting ? 'Dispatching...' : 'Dispatch Test Event'}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/10 shrink-0"
          >
            <Plus className="w-4 h-4" /> Create Rule
          </button>
        </div>
      </div>

      {/* Visual Recipe Cards */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-teal-400" /> Active Automation Recipes
          </span>
          <span className="text-[11px] font-mono text-slate-500">{rules.length} configured triggers</span>
        </div>

        <div className="p-4 grid grid-cols-1 gap-3">
          {rules.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No automation rules defined yet. Click "Create Rule" to build one.
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-slate-100 text-sm">{rule.name}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-semibold">
                    <CheckCircle className="w-3 h-3" /> ACTIVE
                  </span>
                </div>

                {/* Visual Recipe Flow */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                  {/* Step 1: Trigger */}
                  <div className="flex items-center gap-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex-1">
                    <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold text-[10px]">
                      1
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">When Trigger Fires</span>
                      <code className="text-teal-300 font-mono text-xs">{rule.event_pattern}</code>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block shrink-0" />

                  {/* Step 2: Condition */}
                  <div className="flex items-center gap-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex-1">
                    <div className="w-6 h-6 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-[10px]">
                      2
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Condition Filter</span>
                      <span className="text-slate-300 font-medium text-xs">Match Pattern Verified</span>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block shrink-0" />

                  {/* Step 3: Action */}
                  <div className="flex items-center gap-2 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex-1">
                    <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-[10px]">
                      3
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono text-slate-500 block">Execute Action</span>
                      <span className="text-purple-300 font-semibold text-xs">{rule.action_type}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Logs Terminal */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-400" /> Event Execution Terminal
          </span>
          <span className="text-[11px] font-mono text-slate-500">Live EventBus subscriber audit</span>
        </div>

        <div className="p-4 space-y-2 font-mono text-[11px] max-h-72 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-slate-500 text-center py-6">No event executions logged yet.</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 hover:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-teal-300 font-semibold">{log.rule_name}</span>
                  <span className="text-slate-500">[{log.event_name}]</span>
                </div>
                <div className="text-slate-400 text-[10px] truncate max-w-md">{log.output}</div>
                <span className="text-slate-600 text-[10px] shrink-0">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Create Rule */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Workflow Automation Rule">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Rule Name *</label>
            <input
              type="text"
              required
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              placeholder="e.g. Auto-notify Slack on Order Created"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Trigger Event Pattern *</label>
              <select
                value={ruleForm.event_pattern}
                onChange={(e) => setRuleForm({ ...ruleForm, event_pattern: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
              >
                <option value="order.created">order.created</option>
                <option value="order.status_updated">order.status_updated</option>
                <option value="inventory.low_stock">inventory.low_stock</option>
                <option value="customer.created">customer.created</option>
                <option value="*">* (All Events)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Action Type</label>
              <select
                value={ruleForm.action_type}
                onChange={(e) => setRuleForm({ ...ruleForm, action_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="NOTIFY">NOTIFY (Internal Provider)</option>
                <option value="LOG">AUDIT LOG</option>
                <option value="WEBHOOK">WEBHOOK DISPATCH</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Action Configuration (JSON)</label>
            <textarea
              rows={3}
              value={ruleForm.action_payload}
              onChange={(e) => setRuleForm({ ...ruleForm, action_payload: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
