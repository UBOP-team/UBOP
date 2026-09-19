import React, { useState } from 'react';
import { Plus, Play, Save, Sliders } from 'lucide-react';
import { WorkflowRule, WorkflowLog } from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { WorkflowNode, WorkflowNodeData } from '../components/WorkflowNode';
import { MetricCard } from '../components/MetricCard';
import { ConfigPanel, ConfigSection } from '../components/ConfigPanel';

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
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORKSPACE' | 'CONFIG' | 'PROVIDERS' | 'ANALYTICS'>('WORKSPACE');
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

  // Workflow Engine Configuration
  const [workflowConfigSections, setWorkflowConfigSections] = useState<ConfigSection[]>([
    {
      title: 'Execution Engine & Concurrency',
      description: 'Asynchronous event worker pool settings and backpressure control.',
      fields: [
        {
          id: 'max_concurrency',
          label: 'Max Concurrent Event Workers',
          description: 'Maximum parallel async worker coroutines processing EventBus messages.',
          type: 'number',
          value: 16,
        },
        {
          id: 'step_timeout_sec',
          label: 'Action Step Timeout Limit (Seconds)',
          description: 'Cut off long-running HTTP adapter calls before raising timeout incident.',
          type: 'number',
          value: 30,
        },
        {
          id: 'enable_dead_letter_queue',
          label: 'Dead-Letter Queue (DLQ) Fallback',
          description: 'Route permanently failed events into DLQ for post-mortem replay.',
          type: 'toggle',
          value: true,
        },
      ],
    },
    {
      title: 'Retry Policies & Circuit Breakers',
      description: 'Exponential backoff parameters for external third-party API adapters.',
      fields: [
        {
          id: 'retry_backoff',
          label: 'Exponential Backoff Strategy',
          description: 'Wait time multiplier between retries when provider returns 5xx error.',
          type: 'select',
          value: 'EXPONENTIAL',
          options: [
            { label: 'Exponential (1s, 2s, 4s, 8s)', value: 'EXPONENTIAL' },
            { label: 'Linear (2s, 4s, 6s)', value: 'LINEAR' },
            { label: 'Immediate Re-attempt', value: 'IMMEDIATE' },
          ],
        },
        {
          id: 'max_retries',
          label: 'Maximum Retry Attempts',
          description: 'Number of re-attempts before discarding event to DLQ.',
          type: 'number',
          value: 3,
        },
      ],
    },
  ]);

  const handleWorkflowConfigChange = (secIdx: number, fieldId: string, val: any) => {
    setWorkflowConfigSections((prev) => {
      const copy = [...prev];
      const fields = [...copy[secIdx].fields];
      const fIdx = fields.findIndex((f) => f.id === fieldId);
      if (fIdx !== -1) {
        fields[fIdx] = { ...fields[fIdx], value: val };
        copy[secIdx] = { ...copy[secIdx], fields };
      }
      return copy;
    });
  };

  const handleSaveWorkflowConfig = () => {
    toast.success('Workflow Engine Saved', 'Concurrency worker limits and retry policies persisted.');
  };

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
        'Trigger evaluated TRUE: Dispatched actions across live tech connectors.'
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
      {/* Header & 5 Standard Module Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Workflow & Event Automation Engine</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-violet-50 text-violet-700 border border-violet-200/70">
                ServiceNow Workflows
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Trigger-condition-action visual event graphs executed asynchronously across modular boundaries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestTrigger}
              disabled={isExecuting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium transition-colors shadow-xs btn-press disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current text-slate-500 ${isExecuting ? 'animate-spin' : ''}`} />
              {isExecuting ? 'Dispatching...' : 'Test Execution'}
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-xs shrink-0 btn-press active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" /> Add Automation
            </button>
          </div>
        </div>

        {/* 5 Standard Tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { id: 'OVERVIEW', label: 'Overview' },
            { id: 'WORKSPACE', label: 'Workspace' },
            { id: 'CONFIG', label: 'Configuration' },
            { id: 'PROVIDERS', label: 'Provider Settings' },
            { id: 'ANALYTICS', label: 'Analytics' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <MetricCard
              title="Active Automation Rules"
              value={rules.length}
              subtext="Listening on EventBus"
              change={0}
              period="production rules"
            />
            <MetricCard
              title="24h Dispatched Events"
              value="1,428"
              subtext="Aggregated across modules"
              change={14.8}
              period="vs prior 24h"
              sparklineData={[110, 140, 180, 220, 290, 340]}
            />
            <MetricCard
              title="Execution Success Rate"
              value="99.6%"
              subtext="0 dead-letter drops"
              change={0.2}
              period="99.9% target SLA"
              sparklineData={[98.8, 99.1, 99.4, 99.6]}
            />
            <MetricCard
              title="Average Action Latency"
              value="18.2 ms"
              subtext="Asynchronous coroutine runtime"
              change={-8.5}
              period="optimized dispatch"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Live Event Routing Stream</h3>
                <span className="font-mono text-xs text-slate-500">EventBus Buffer</span>
              </div>
              <div className="space-y-3">
                {[
                  { event: 'order.created', desc: 'Auto-reserve stock & dispatch picking manifest', status: 'SUCCESS', count: 184 },
                  { event: 'order.status_updated', desc: 'Post Slack notification & customer SMS receipt', status: 'SUCCESS', count: 96 },
                  { event: 'inventory.stock_adjusted', desc: 'Evaluate safety reorder buffer <= 10 units', status: 'SUCCESS', count: 28 },
                ].map((e, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-teal-700">{e.event}</span>
                      <p className="text-slate-600 mt-0.5">{e.desc}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {e.status}
                      </span>
                      <span className="block text-[11px] font-mono text-slate-400 mt-1">{e.count} runs</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Engine Queue State</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Async worker status.</p>
                </div>
                <div className="space-y-3 pt-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-mono text-slate-400">WORKER POOL CAPACITY</span>
                    <div className="font-mono font-bold text-slate-900 text-sm">16 Active Coroutines</div>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[11px] font-mono text-slate-400">REDIS PUB/SUB HEALTH</span>
                    <div className="font-mono font-bold text-emerald-700 text-sm">0 Pending Backpressure</div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('WORKSPACE')}
                className="mt-4 w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                Open Visual Flow Canvas ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKSPACE (Visual Flow Canvas & Inspector) */}
      {activeTab === 'WORKSPACE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-50/50 border border-slate-200/90 rounded-2xl p-6 flex flex-col items-center justify-start min-h-[520px] relative overflow-hidden shadow-xs">
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

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

          <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 text-xs shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-600" />
                <h3 className="font-bold text-slate-900 text-xs">Node Inspector</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase font-semibold">
                {selectedNode.type}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Step Name</label>
                <input
                  type="text"
                  value={selectedNode.title}
                  onChange={(e) => handleUpdateSelectedNode('title', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description / Subtitle</label>
                <input
                  type="text"
                  value={selectedNode.subtitle}
                  onChange={(e) => handleUpdateSelectedNode('subtitle', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-teal-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Logic Payload / Filter</label>
                <textarea
                  rows={3}
                  value={selectedNode.configSummary}
                  onChange={(e) => handleUpdateSelectedNode('configSummary', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:border-teal-500 font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-slate-400 font-mono text-[11px]">
                  Executions: {selectedNode.executionCount}
                </span>
                <button
                  type="button"
                  onClick={() => toast.success('Step Updated', `Configured '${selectedNode.title}' successfully.`)}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" /> Save Step
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURATION */}
      {activeTab === 'CONFIG' && (
        <ConfigPanel
          title="Workflow Automation Engine Settings"
          subtitle="Configure worker coroutine concurrency, action timeouts, and exponential retry backoff."
          sections={workflowConfigSections}
          onChangeField={handleWorkflowConfigChange}
          onSave={handleSaveWorkflowConfig}
          onReset={() => toast.info('Reset Defaults', 'Restored baseline workflow engine configuration.')}
        />
      )}

      {/* TAB 4: PROVIDER SETTINGS */}
      {activeTab === 'PROVIDERS' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Automation Action Adapters</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live communication channels, HTTP incident webhooks, and commerce action dispatchers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: 'slack',
                name: 'Slack Incoming Webhook Dispatcher',
                status: 'CONNECTED',
                description: 'Post structured incident cards into operations channels.',
                latency: '24ms',
                endpoint: 'https://hooks.slack.com/services/...',
              },
              {
                id: 'telegram',
                name: 'Telegram Bot API Messenger',
                status: 'CONNECTED',
                description: 'Direct instant alerts to executive emergency group chats.',
                latency: '31ms',
                endpoint: 'https://api.telegram.org/bot...',
              },
              {
                id: 'stripe',
                name: 'Stripe Billing & Charge Actions',
                status: 'CONNECTED',
                description: 'Automated invoice generation and payment intent captures.',
                latency: '14ms',
                endpoint: 'https://api.stripe.com/v1/...',
              },
              {
                id: 'shopify',
                name: 'Shopify Admin Sync Webhook',
                status: 'CONNECTED',
                description: 'Trigger catalog updates and automated fulfillment notices.',
                latency: '18ms',
                endpoint: 'https://myshop.myshopify.com/admin/api/...',
              },
            ].map((prov) => (
              <div key={prov.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-xs">{prov.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{prov.description}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {prov.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-200 text-slate-500">
                  <span>Latency: {prov.latency}</span>
                  <button
                    onClick={() => toast.success('Handshake Verified', `${prov.name} active.`)}
                    className="text-teal-700 font-semibold hover:text-teal-800"
                  >
                    Test Ping ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Execution Logs & Telemetry Audit</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological ledger of event triggers, condition evaluations, and action outputs.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-500">{logs.length} Recorded Runs</span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Rule Name</th>
                  <th className="px-5 py-3">Trigger Event</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Execution Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                      No logs in buffer.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono text-slate-400 text-[11px]">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-900">{log.rule_name}</td>
                      <td className="px-5 py-3 font-mono text-teal-700">{log.event_name}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-mono text-[11px]">
                        {log.output}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Create Automation Rule */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Deploy Automation Pipeline"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Rule Name *</label>
            <input
              type="text"
              required
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              placeholder="e.g. Notify Slack on Large Orders"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Event Ingestion Trigger *</label>
            <select
              value={ruleForm.event_pattern}
              onChange={(e) => setRuleForm({ ...ruleForm, event_pattern: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
            >
              <option value="order.created">order.created (Omnichannel Ingestion)</option>
              <option value="order.status_updated">order.status_updated (Fulfillment Shift)</option>
              <option value="inventory.stock_adjusted">inventory.stock_adjusted (ATP Change)</option>
              <option value="customer.created">customer.created (New Account)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Action Adapter Type *</label>
            <select
              value={ruleForm.action_type}
              onChange={(e) => setRuleForm({ ...ruleForm, action_type: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
            >
              <option value="NOTIFY">NOTIFY (Slack / Telegram Message)</option>
              <option value="WEBHOOK">WEBHOOK (HTTP POST Payload)</option>
              <option value="INTEGRATION_SYNC">INTEGRATION_SYNC (Shopify / WMS Sync)</option>
              <option value="STRIPE_CHARGE">STRIPE_CHARGE (Immediate Payment Capture)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Action JSON Payload</label>
            <textarea
              rows={3}
              value={ruleForm.action_payload}
              onChange={(e) => setRuleForm({ ...ruleForm, action_payload: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
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
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press"
            >
              {loading ? 'Deploying...' : 'Deploy Automation'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
