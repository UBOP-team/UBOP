import React, { useState } from 'react';
import { Plus, Zap, CheckCircle, Terminal, Play } from 'lucide-react';
import { WorkflowRule, WorkflowLog } from '../types';
import { Modal } from '../components/Modal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Workflow & Event Automations Engine</h2>
          <p className="text-xs text-slate-400 mt-1">
            Event-driven triggers connecting CRM, ERP stock reservations, and external notifications.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onTriggerExecution}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-teal-400" /> Run Trigger Test
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold px-4 py-2 rounded-xl text-xs transition-colors shadow-lg shadow-teal-500/10"
          >
            <Plus className="w-4 h-4" /> Create Rule
          </button>
        </div>
      </div>

      {/* Rules Section */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-teal-400" /> Configured Automation Triggers
          </span>
          <span className="text-[11px] text-slate-500">{rules.length} active rules</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {rules.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No workflow rules defined. Add one above to automate tasks.
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{rule.name}</div>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                    <span>
                      Trigger Pattern:{' '}
                      <code className="text-teal-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
                        {rule.event_pattern}
                      </code>
                    </span>
                    <span>Action: <strong className="text-slate-300">{rule.action_type}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    <CheckCircle className="w-3 h-3" /> ACTIVE
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-teal-400" /> Recent Execution Audit Trail
          </span>
          <span className="text-[11px] text-slate-500">EventBus listener activity</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {logs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No logs registered yet. Actions taken on events will appear here.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-900/40 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-200">{log.rule_name}</div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">{log.output}</div>
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
              placeholder="e.g. Notify Team on Large Order"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Trigger Event Pattern *</label>
            <select
              value={ruleForm.event_pattern}
              onChange={(e) => setRuleForm({ ...ruleForm, event_pattern: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="order.created">order.created</option>
              <option value="order.status_updated">order.status_updated</option>
              <option value="inventory.low_stock">inventory.low_stock</option>
              <option value="*">* (Wildcard All Events)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Action Type</label>
            <select
              value={ruleForm.action_type}
              onChange={(e) => setRuleForm({ ...ruleForm, action_type: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="NOTIFY">NOTIFY (Internal Provider)</option>
              <option value="LOG">AUDIT LOG</option>
              <option value="WEBHOOK">WEBHOOK DISPATCH</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Action Config JSON</label>
            <textarea
              rows={3}
              value={ruleForm.action_payload}
              onChange={(e) => setRuleForm({ ...ruleForm, action_payload: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-500"
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
              className="px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-950 font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Save Automation Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
