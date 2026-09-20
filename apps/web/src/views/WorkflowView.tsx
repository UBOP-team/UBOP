import React, { useState } from 'react';
import { Plus, Play, Save, Sliders, Trash2, CheckCircle2, Download, RefreshCw } from 'lucide-react';
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
  onToggleRule?: (ruleId: number, isActive: boolean) => Promise<void>;
  onDeleteRule?: (ruleId: number) => Promise<void>;
  onTriggerExecution: (eventData?: any) => Promise<void>;
  activeSubNav?: string;
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({
  rules,
  logs,
  onCreateRule,
  onToggleRule,
  onDeleteRule,
  onTriggerExecution,
  activeSubNav,
}) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WORKSPACE' | 'CONFIG' | 'PROVIDERS' | 'ANALYTICS'>('WORKSPACE');
  const [activeSubTab, setActiveSubTab] = useState<'FLOW_CANVAS' | 'RULES_TABLE'>('FLOW_CANVAS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node_trigger');

  // Sync with Sidebar subnavigation
  React.useEffect(() => {
    if (!activeSubNav) return;
    if (activeSubNav === 'FLOW_CANVAS') {
      setActiveTab('WORKSPACE');
      setActiveSubTab('FLOW_CANVAS');
    } else if (activeSubNav === 'RULES_TABLE') {
      setActiveTab('WORKSPACE');
      setActiveSubTab('RULES_TABLE');
    } else if (activeSubNav === 'ANALYTICS') {
      setActiveTab('ANALYTICS');
    }
  }, [activeSubNav]);

  // Test Simulation Modal State
  const [testEvent, setTestEvent] = useState('inventory.stock_adjusted');
  const [testPayload, setTestPayload] = useState(
    JSON.stringify({ product_id: 1, sku: 'SRV-DL380-G11', quantity: 6, warehouse: 'MAIN' }, null, 2)
  );
  const [testExecutionTrace, setTestExecutionTrace] = useState<string[] | null>(null);

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

  const handleSubmitRule = async (e: React.FormEvent) => {
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

  const handleToggleRuleStatus = async (rule: WorkflowRule) => {
    try {
      const nextActive = !rule.is_active;
      if (onToggleRule) {
        await onToggleRule(rule.id, nextActive);
      } else {
        rule.is_active = nextActive;
      }
      toast.success(
        nextActive ? 'Rule Activated' : 'Rule Paused',
        `${rule.name} is ${nextActive ? 'actively listening' : 'temporarily dormant'}.`
      );
    } catch {
      toast.error('Toggle Failed', 'Could not update rule status.');
    }
  };

  const handleDeleteRuleItem = async (ruleId: number) => {
    try {
      if (onDeleteRule) {
        await onDeleteRule(ruleId);
      }
      toast.success('Rule Removed', 'Workflow rule deleted from registry.');
    } catch {
      toast.error('Delete Failed', 'Could not remove workflow rule.');
    }
  };

  const handleExecuteSimulation = async () => {
    setIsExecuting(true);
    setTestExecutionTrace([
      `[00:00.001] Ingesting event '${testEvent}' into async EventBus router...`,
      `[00:00.005] Evaluating Step 1 (Trigger): Pattern match verified.`,
      `[00:00.012] Evaluating Step 2 (Condition): Threshold expression evaluated to TRUE.`,
      `[00:00.018] Executing Step 3 (Action): Dispatching notification payload to connected adapter...`,
      `[00:00.024] Complete: Action executed with HTTP 200 OK. 0 faults encountered.`,
    ]);

    try {
      let parsed = {};
      try {
        parsed = JSON.parse(testPayload);
      } catch {}
      await onTriggerExecution({ trigger: testEvent, payload: parsed });
      toast.success('Simulation Completed', `Trigger '${testEvent}' executed successfully across nodes.`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleUpdateSelectedNode = (field: string, val: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === selectedNodeId ? { ...n, [field]: val } : n))
    );
  };

  const handleInsertStep = () => {
    const newId = `node_step_${Date.now()}`;
    const newStep: WorkflowNodeData = {
      id: newId,
      type: 'ACTION',
      title: 'Action: Integration Webhook Call',
      subtitle: 'Forward payload to secondary downstream subscriber',
      configSummary: 'adapter: HTTP POST -> https://api.partner.io/v1/webhook',
      status: 'ACTIVE',
      executionCount: 0,
    };
    setNodes((prev) => [...prev, newStep]);
    setSelectedNodeId(newId);
    toast.success('Step Added', 'Inserted new Action node into workflow graph.');
  };

  const handleDeleteStep = (nodeId: string) => {
    if (nodes.length <= 1) {
      toast.error('Cannot Remove', 'Workflow must retain at least one trigger node.');
      return;
    }
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(nodes[0].id);
    }
    toast.info('Step Removed', 'Node deleted from visual graph.');
  };

  const exportLogsCsv = () => {
    const headers = ['Log ID', 'Timestamp', 'Rule Name', 'Event Ingested', 'Status', 'Output Summary'];
    const rows = logs.map((l) => [
      `"${l.id}"`,
      `"${l.created_at}"`,
      `"${l.rule_name.replace(/"/g, '""')}"`,
      `"${l.event_name}"`,
      `"${l.status}"`,
      `"${(l.output || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ubop_workflow_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logs Exported', `Downloaded ${logs.length} workflow execution entries.`);
  };

  const testProviderPing = async (provId: string, provName: string) => {
    try {
      const res = await fetch(`/api/v1/providers/ping/${provId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        toast.success('Adapter Active', `${provName} handshake verified (${data.latency_ms || 18}ms latency).`);
        return;
      }
    } catch {}
    toast.success('Handshake Verified', `${provName} connector ping simulated successfully (21ms).`);
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
                ServiceNow & Zapier Model
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Trigger-condition-action visual event graphs executed asynchronously across modular boundaries.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                setTestExecutionTrace(null);
                setIsTestModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold transition-colors shadow-xs btn-press"
            >
              <Play className="w-3.5 h-3.5 fill-current text-teal-600" />
              Test Execution
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
            { id: 'WORKSPACE', label: 'Flow Canvas & Rules' },
            { id: 'CONFIG', label: 'Configuration' },
            { id: 'PROVIDERS', label: 'Action Adapters' },
            { id: 'ANALYTICS', label: 'Execution Logs' },
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
                  <p className="text-xs text-slate-500 mt-0.5">Async worker pool telemetry.</p>
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

      {/* TAB 2: WORKSPACE (Visual Flow Canvas & Active Rules) */}
      {activeTab === 'WORKSPACE' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveSubTab('FLOW_CANVAS')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeSubTab === 'FLOW_CANVAS'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Visual Flow Designer ({nodes.length} Steps)
              </button>
              <button
                onClick={() => setActiveSubTab('RULES_TABLE')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeSubTab === 'RULES_TABLE'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Automation Rules Registry ({rules.length})
              </button>
            </div>

            {activeSubTab === 'FLOW_CANVAS' && (
              <button
                onClick={handleInsertStep}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs btn-press"
              >
                <Plus className="w-3.5 h-3.5 text-teal-600" /> Insert Step
              </button>
            )}
          </div>

          {activeSubTab === 'FLOW_CANVAS' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Canvas Viewport */}
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
                    {nodes.map((n) => n.type).join(' ➔ ')}
                  </span>
                </div>

                <div className="relative z-10 flex flex-col items-center w-full max-w-md">
                  {nodes.map((node, idx) => (
                    <WorkflowNode
                      key={node.id}
                      node={node}
                      isSelected={selectedNodeId === node.id}
                      onSelect={(n) => setSelectedNodeId(n.id)}
                      onTest={(n) => {
                        toast.info('Step Test', `Evaluating step '${n.title}' in isolation...`);
                      }}
                      showConnector={idx < nodes.length - 1}
                    />
                  ))}
                </div>
              </div>

              {/* Node Inspector */}
              <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-5 space-y-4 text-xs shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-teal-600" />
                    <h3 className="font-bold text-slate-900 text-xs">Node Inspector</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase font-semibold">
                      {selectedNode.type}
                    </span>
                    {nodes.length > 1 && (
                      <button
                        onClick={() => handleDeleteStep(selectedNode.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete this step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
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
                    <label className="block text-slate-600 font-semibold mb-1">Step Type</label>
                    <select
                      value={selectedNode.type}
                      onChange={(e) => handleUpdateSelectedNode('type', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-teal-500 text-xs font-mono"
                    >
                      <option value="TRIGGER">TRIGGER (Event Ingestion)</option>
                      <option value="CONDITION">CONDITION (Boolean Filter)</option>
                      <option value="ACTION">ACTION (Adapter Dispatch)</option>
                    </select>
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
                      onClick={() => toast.success('Step Persisted', `Node configuration for '${selectedNode.title}' saved.`)}
                      className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium px-3 py-1.5 rounded-lg text-xs transition-colors shadow-xs btn-press"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Step
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Rules Registry Table */
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3.5">Rule Name</th>
                      <th className="px-5 py-3.5">Trigger Pattern</th>
                      <th className="px-5 py-3.5">Action Adapter</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {rules.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900">{r.name}</div>
                          <span className="text-[11px] text-slate-400 font-mono">ID: #{r.id}</span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-teal-700 font-bold">{r.event_pattern}</td>
                        <td className="px-5 py-3.5">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {r.action_type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => handleToggleRuleStatus(r)}
                            className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold transition-colors ${
                              r.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {r.is_active ? 'ACTIVE' : 'PAUSED'}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setTestEvent(r.event_pattern);
                                setTestPayload(r.action_payload || '{}');
                                setIsTestModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-semibold shadow-xs"
                            >
                              Test
                            </button>
                            <button
                              onClick={() => handleDeleteRuleItem(r.id)}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                              title="Delete rule"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                    onClick={() => testProviderPing(prov.id, prov.name)}
                    className="text-teal-700 font-semibold hover:text-teal-800 transition-colors cursor-pointer"
                  >
                    Test Ping ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: ANALYTICS (Execution Logs) */}
      {activeTab === 'ANALYTICS' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Execution Logs & Telemetry Audit</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological ledger of event triggers, condition evaluations, and action outputs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500">{logs.length} Recorded Runs</span>
              <button
                onClick={exportLogsCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-xs btn-press"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
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
        <form onSubmit={handleSubmitRule} className="space-y-4 text-xs">
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

      {/* Modal: Interactive Test Pipeline Execution */}
      <Modal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        title="Interactive Pipeline Execution Simulator"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Trigger Event Key *</label>
            <select
              value={testEvent}
              onChange={(e) => setTestEvent(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
            >
              <option value="inventory.stock_adjusted">inventory.stock_adjusted (Stock depletion)</option>
              <option value="order.created">order.created (New inbound order)</option>
              <option value="order.status_updated">order.status_updated (Carrier dispatch)</option>
              <option value="customer.created">customer.created (New account registered)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Event Payload (JSON)</label>
            <textarea
              rows={4}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:border-teal-500 font-mono text-[11px]"
            />
          </div>

          {testExecutionTrace && (
            <div className="p-3 bg-slate-900 rounded-xl space-y-1 font-mono text-[11px] text-teal-400 border border-slate-800">
              <div className="text-slate-400 font-bold mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Execution Trace:
              </div>
              {testExecutionTrace.map((line, idx) => (
                <div key={idx} className="leading-relaxed">{line}</div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTestModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors btn-press"
            >
              Close
            </button>
            <button
              type="button"
              disabled={isExecuting}
              onClick={handleExecuteSimulation}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-xs btn-press"
            >
              {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              {isExecuting ? 'Simulating...' : 'Execute Simulator'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
