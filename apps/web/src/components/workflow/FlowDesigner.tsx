import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Play,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Zap,
  Tag,
  GitBranch,
  Clock,
  UserCheck,
  ShieldCheck,
  Search,
  X,
} from 'lucide-react';
import {
  FlowDefinition,
  StepDefinition,
  TriggerDefinition,
  ActionDefinition,
  SubflowDefinition,
  ConditionGroup,
  FlowValidationResult,
} from '../../types';
import { DataPillPicker } from './DataPillPicker';
import { useToast } from '../Toast';

interface FlowDesignerProps {
  flow: FlowDefinition;
  actions: ActionDefinition[];
  subflows: SubflowDefinition[];
  onBack: () => void;
  onSaveDraft: (updatedFlow: Partial<FlowDefinition>) => Promise<void>;
  onActivate: (flowId: string) => Promise<void>;
  onRunTest: (flowId: string, payload: any) => Promise<void>;
  onRunLive?: (flowId: string, payload?: any) => Promise<void>;
}

export const FlowDesigner: React.FC<FlowDesignerProps> = ({
  flow,
  actions,
  subflows,
  onBack,
  onSaveDraft,
  onActivate,
  onRunTest,
  onRunLive,
}) => {
  const toast = useToast();

  // Current working version is draft_version if present, else active_version
  const activeVersion = flow.draft_version || flow.active_version;

  const [flowName, setFlowName] = useState(flow.name);
  const [flowDescription, setFlowDescription] = useState(flow.description || '');
  const [trigger, setTrigger] = useState<TriggerDefinition>(
    activeVersion?.trigger_definition || {
      trigger_type: 'DOMAIN_EVENT',
      event_name: 'OMS.OrderCreated',
      enabled: true,
    }
  );
  const [steps, setSteps] = useState<StepDefinition[]>(activeVersion?.flow_structure || []);

  // Selection & UI State
  const [selectedTarget, setSelectedTarget] = useState<'TRIGGER' | string>('TRIGGER');
  const [stepSearch, setStepSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Validation State
  const [validationResult, setValidationResult] = useState<FlowValidationResult | null>(null);
  const [showValidationDrawer, setShowValidationDrawer] = useState(false);

  // Data Pill Picker State
  const [activePillTarget, setActivePillTarget] = useState<{ stepKey: string; fieldName: string } | null>(null);

  // Test & Live Run Modal State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [runMode, setRunMode] = useState<'TEST' | 'LIVE'>('TEST');
  const [testPayloadStr, setTestPayloadStr] = useState(
    JSON.stringify(
      trigger.trigger_type === 'DOMAIN_EVENT' && trigger.event_name?.includes('Inventory')
        ? { material_id: 'MAT-SRV-01', plant: 'PL01', available_qty: 8, material_name: 'Dell Server Blade' }
        : {
            order: {
              id: 'ORD-20391',
              order_number: 'ORD-20391',
              total: 85000000,
              channel: 'B2B',
              customer_name: 'Vinamilk Megacorp',
              owner_email: 'sales@ubop.vn',
            },
          },
      null,
      2
    )
  );

  // Selected Step helper
  const selectedStepIndex = steps.findIndex((s) => s.step_key === selectedTarget);
  const selectedStep = selectedStepIndex >= 0 ? steps[selectedStepIndex] : null;

  // --------------------------------------------------------------------------
  // Step Actions
  // --------------------------------------------------------------------------
  const handleAddStep = (stepType: string, actionMeta?: ActionDefinition | SubflowDefinition, insertIndex?: number) => {
    const newKey = `step_${Date.now().toString().slice(-6)}`;
    let newStep: StepDefinition;

    if (stepType === 'ACTION' && actionMeta && 'key' in actionMeta) {
      newStep = {
        step_key: newKey,
        step_type: 'ACTION',
        name: actionMeta.name,
        action_key: actionMeta.key,
        connection_reference: actionMeta.connection_type_required ? 'Default Connection' : undefined,
        inputs: {},
        on_error_policy: 'FAIL_FLOW',
        timeout_seconds: 60,
      };
    } else if (stepType === 'CONDITION') {
      newStep = {
        step_key: newKey,
        step_type: 'CONDITION',
        name: 'Evaluate Branch Conditions',
        condition_group: {
          operator: 'AND',
          rules: [{ field_ref: 'trigger.order.total', operator: 'GT', value: 50000000 }],
        },
        true_steps: [],
        false_steps: [],
      };
    } else if (stepType === 'APPROVAL') {
      newStep = {
        step_key: newKey,
        step_type: 'APPROVAL',
        name: 'Request Human Approval',
        approval_role: 'OPERATIONS_MANAGER',
        approval_timeout_sec: 86400,
      };
    } else if (stepType === 'WAIT') {
      newStep = {
        step_key: newKey,
        step_type: 'WAIT',
        name: 'Wait State',
        wait_type: 'DURATION',
        wait_duration_sec: 3600,
      };
    } else if (stepType === 'SUBFLOW' && actionMeta) {
      newStep = {
        step_key: newKey,
        step_type: 'SUBFLOW',
        name: actionMeta.name,
        subflow_id: actionMeta.id,
        subflow_inputs: {},
      };
    } else {
      newStep = {
        step_key: newKey,
        step_type: 'ACTION',
        name: 'Generic Action',
        action_key: 'utility.action',
        inputs: {},
      };
    }

    setSteps((prev) => {
      const copy = [...prev];
      if (insertIndex !== undefined && insertIndex >= 0) {
        copy.splice(insertIndex, 0, newStep);
      } else {
        copy.push(newStep);
      }
      return copy;
    });

    setSelectedTarget(newKey);
    setHasUnsavedChanges(true);
    toast.success('Step Added', `Added ${newStep.name} to flow canvas.`);
  };

  const handleDeleteStep = (stepKey: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSteps((prev) => prev.filter((s) => s.step_key !== stepKey));
    if (selectedTarget === stepKey) {
      setSelectedTarget('TRIGGER');
    }
    setHasUnsavedChanges(true);
  };

  const handleMoveStep = (index: number, direction: 'UP' | 'DOWN', e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === steps.length - 1) return;

    setSteps((prev) => {
      const copy = [...prev];
      const targetIdx = direction === 'UP' ? index - 1 : index + 1;
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  const handleUpdateStep = (updated: StepDefinition) => {
    setSteps((prev) => prev.map((s) => (s.step_key === updated.step_key ? updated : s)));
    setHasUnsavedChanges(true);
  };

  // --------------------------------------------------------------------------
  // Save, Validate, Activate & Test
  // --------------------------------------------------------------------------
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveDraft({
        name: flowName,
        description: flowDescription,
        trigger,
        steps,
      } as any);
      setHasUnsavedChanges(false);
      toast.success('Draft Saved', 'Flow structure updated in registry.');
    } catch (err: any) {
      toast.error('Save Failed', err.message || 'Could not save flow draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleValidate = async () => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!trigger.trigger_type) errors.push('Trigger type is required.');
    if (trigger.trigger_type === 'DOMAIN_EVENT' && !trigger.event_name) {
      errors.push('Domain event trigger requires an event contract (e.g. OMS.OrderCreated).');
    }

    steps.forEach((s) => {
      if (s.step_type === 'ACTION' && !s.action_key) {
        errors.push(`Step '${s.name}' is missing an action key.`);
      }
      if (s.step_type === 'APPROVAL' && !s.approval_role) {
        errors.push(`Step '${s.name}' requires an approver role.`);
      }
    });

    const res: FlowValidationResult = {
      is_valid: errors.length === 0,
      errors,
      warnings,
    };
    setValidationResult(res);
    setShowValidationDrawer(true);

    if (res.is_valid) {
      toast.success('Validation Passed', 'Flow structure satisfies all constraints.');
    } else {
      toast.error('Validation Issues Found', `${errors.length} issue(s) require attention.`);
    }
  };

  const handleActivateDraft = async () => {
    setIsActivating(true);
    try {
      await onActivate(flow.id);
      setHasUnsavedChanges(false);
      toast.success('Flow Activated', 'Published version is now active for incoming triggers.');
    } catch (err: any) {
      toast.error('Activation Failed', err.message || 'Could not activate flow.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleRunModalSubmit = async () => {
    let parsedPayload = {};
    try {
      parsedPayload = JSON.parse(testPayloadStr);
    } catch {
      toast.error('Invalid JSON', 'Trigger payload must be valid JSON.');
      return;
    }

    setIsTestModalOpen(false);
    if (runMode === 'LIVE' && onRunLive) {
      await onRunLive(flow.id, parsedPayload);
    } else {
      await onRunTest(flow.id, parsedPayload);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* ------------------------------------------------------------- */}
      {/* 1. Top Navigation Bar (ServiceNow Flow Studio Header) */}
      {/* ------------------------------------------------------------- */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 px-5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to Flows Index"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={flowName}
                onChange={(e) => {
                  setFlowName(e.target.value);
                  setHasUnsavedChanges(true);
                }}
                className="text-sm font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-indigo-500 focus:outline-none px-1"
              />

              {flow.active_version && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active v{flow.active_version.version_number}
                </span>
              )}

              {flow.draft_version && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Draft v{flow.draft_version.version_number}
                </span>
              )}

              {hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Unsaved Changes" />
              )}
            </div>
            <input
              type="text"
              value={flowDescription}
              onChange={(e) => {
                setFlowDescription(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Describe business intent..."
              className="text-[11px] text-slate-400 bg-transparent border-b border-transparent hover:border-slate-800 focus:border-indigo-500 focus:outline-none px-1 w-72 truncate"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleValidate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" /> Validate
          </button>

          <button
            onClick={() => {
              setRunMode('TEST');
              setIsTestModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <Play className="w-4 h-4 text-emerald-400" /> Test
          </button>

          {onRunLive && flow.status === 'ACTIVE' && (
            <button
              onClick={() => {
                setRunMode('LIVE');
                setIsTestModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-200 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 transition-colors shadow-sm"
              title="Run Live Flow with Real Side Effects"
            >
              <Zap className="w-4 h-4 text-purple-400" /> Run Live
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-slate-700 hover:bg-slate-600 transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={handleActivateDraft}
            disabled={isActivating || !flow.draft_version_id}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md disabled:opacity-40"
          >
            <CheckCircle2 className="w-4 h-4" /> {isActivating ? 'Activating...' : 'Activate'}
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. Three-Column Workspace Layout */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* ========================================================= */}
        {/* COLUMN 1: Left Step Library */}
        {/* ========================================================= */}
        <aside className="col-span-3 border-r border-slate-800 bg-slate-900/60 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Action & Logic Catalog
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search actions..."
                value={stepSearch}
                onChange={(e) => setStepSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 text-[10px]">
              {['ALL', 'LOGIC', 'CRM', 'OMS', 'ERP', 'BI', 'PROVIDERS'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Flow Logic Primitives */}
            {(activeCategory === 'ALL' || activeCategory === 'LOGIC') && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Flow Logic
                </span>

                <div
                  onClick={() => handleAddStep('CONDITION')}
                  className="p-2.5 rounded-lg border border-slate-800 hover:border-indigo-500/40 bg-slate-900/80 hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      <GitBranch className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                        Condition (If / Else)
                      </div>
                      <div className="text-[10px] text-slate-400">Branch based on typed data rules</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                </div>

                <div
                  onClick={() => handleAddStep('APPROVAL')}
                  className="p-2.5 rounded-lg border border-slate-800 hover:border-indigo-500/40 bg-slate-900/80 hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300">
                        Human Approval
                      </div>
                      <div className="text-[10px] text-slate-400">Pause for authorized decision</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
                </div>

                <div
                  onClick={() => handleAddStep('WAIT')}
                  className="p-2.5 rounded-lg border border-slate-800 hover:border-indigo-500/40 bg-slate-900/80 hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-slate-300">
                        Wait State
                      </div>
                      <div className="text-[10px] text-slate-400">Persisted duration or event pause</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-slate-500 group-hover:text-white" />
                </div>
              </div>
            )}

            {/* Governed Actions */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Governed Actions ({actions.length})
              </span>

              {actions
                .filter((a) => {
                  if (activeCategory !== 'ALL' && activeCategory !== 'LOGIC' && a.category !== activeCategory) {
                    return false;
                  }
                  if (!stepSearch) return true;
                  return (
                    a.name.toLowerCase().includes(stepSearch.toLowerCase()) ||
                    a.key.toLowerCase().includes(stepSearch.toLowerCase())
                  );
                })
                .map((act) => (
                  <div
                    key={act.id}
                    onClick={() => handleAddStep('ACTION', act)}
                    className="p-2.5 rounded-lg border border-slate-800 hover:border-indigo-500/40 bg-slate-900/80 hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                          {act.name}
                        </span>
                        <span className="px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-slate-400">
                          {act.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                        {act.description}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
                  </div>
                ))}
            </div>

            {/* Reusable Subflows */}
            {(activeCategory === 'ALL' || activeCategory === 'LOGIC') && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Subflows ({subflows.length})
                </span>

                {subflows.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => handleAddStep('SUBFLOW', sub)}
                    className="p-2.5 rounded-lg border border-slate-800 hover:border-cyan-500/40 bg-slate-900/80 hover:bg-slate-800/60 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300">
                        {sub.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                        {sub.description}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ========================================================= */}
        {/* COLUMN 2: Structured Vertical Flow Canvas (ServiceNow) */}
        {/* ========================================================= */}
        <main className="col-span-5 bg-slate-950 p-6 overflow-y-auto flex flex-col items-center">
          <div className="w-full max-w-xl space-y-4">
            {/* ---------------- Trigger Card ---------------- */}
            <div
              onClick={() => setSelectedTarget('TRIGGER')}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative shadow-lg ${
                selectedTarget === 'TRIGGER'
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      TRIGGER
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {trigger.trigger_type === 'DOMAIN_EVENT'
                        ? trigger.event_name || 'Domain Event'
                        : trigger.trigger_type === 'SCHEDULE'
                        ? `Schedule: ${trigger.schedule_frequency || 'DAILY'} @ ${trigger.schedule_time || '08:00'}`
                        : trigger.trigger_type}
                    </h4>
                  </div>
                </div>

                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300">
                  {trigger.trigger_type}
                </span>
              </div>

              {trigger.conditions && trigger.conditions.rules?.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="font-semibold text-slate-300">Filter:</span>
                  <span>{trigger.conditions.rules.length} rule(s) configured</span>
                </div>
              )}
            </div>

            {/* Connecting line */}
            <div className="flex flex-col items-center justify-center my-1">
              <div className="w-0.5 h-6 bg-slate-700" />
              <div className="w-2 h-2 rounded-full bg-slate-600" />
            </div>

            {/* ---------------- Ordered Steps ---------------- */}
            {steps.map((step, idx) => {
              const isSelected = selectedTarget === step.step_key;
              return (
                <React.Fragment key={step.step_key}>
                  <div
                    onClick={() => setSelectedTarget(step.step_key)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative shadow-md ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-bold">
                          {idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {step.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-mono text-slate-400">
                              {step.step_type}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            {step.action_key && <span>Action: {step.action_key}</span>}
                            {step.approval_role && <span>Approver: {step.approval_role}</span>}
                            {step.connection_reference && (
                              <span className="text-cyan-400 font-mono text-[10px]">
                                ⚡ {step.connection_reference}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Step controls */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleMoveStep(idx, 'UP', e)}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20"
                          title="Move Up"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleMoveStep(idx, 'DOWN', e)}
                          disabled={idx === steps.length - 1}
                          className="p-1 rounded text-slate-500 hover:text-white disabled:opacity-20"
                          title="Move Down"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteStep(step.step_key, e)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400"
                          title="Delete Step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Condition Branch Visualization */}
                    {step.step_type === 'CONDITION' && (
                      <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {/* True Branch */}
                          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                              ✓ True Path
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {step.true_steps && step.true_steps.length > 0
                                ? `${step.true_steps.length} step(s) will execute`
                                : 'No branch steps'}
                            </span>
                          </div>

                          {/* False Branch */}
                          <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              ✕ False Path
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {step.false_steps && step.false_steps.length > 0
                                ? `${step.false_steps.length} step(s) will execute`
                                : 'Standard route'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connecting line between steps */}
                  {idx < steps.length - 1 && (
                    <div className="flex flex-col items-center justify-center my-1">
                      <div className="w-0.5 h-5 bg-slate-700" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Bottom Add Step Button */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => handleAddStep('ACTION', actions[0])}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Next Step
              </button>
            </div>
          </div>
        </main>

        {/* ========================================================= */}
        {/* COLUMN 3: Right Configuration Panel */}
        {/* ========================================================= */}
        <aside className="col-span-4 border-l border-slate-800 bg-slate-900 p-5 overflow-y-auto flex flex-col space-y-4">
          {selectedTarget === 'TRIGGER' ? (
            /* Configure Trigger */
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  Trigger Configuration
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  What starts this flow?
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Trigger Type
                </label>
                <select
                  value={trigger.trigger_type}
                  onChange={(e) => {
                    setTrigger({ ...trigger, trigger_type: e.target.value as any });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="DOMAIN_EVENT">Domain Business Event</option>
                  <option value="SCHEDULE">Schedule Timer</option>
                  <option value="MANUAL">Manual Authorized Execution</option>
                  <option value="WEBHOOK">Authenticated Webhook</option>
                </select>
              </div>

              {trigger.trigger_type === 'DOMAIN_EVENT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Domain Event Contract
                  </label>
                  <select
                    value={trigger.event_name || 'OMS.OrderCreated'}
                    onChange={(e) => {
                      setTrigger({ ...trigger, event_name: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="OMS.OrderCreated">OMS.OrderCreated</option>
                    <option value="OMS.OrderPaid">OMS.OrderPaid</option>
                    <option value="ERP.InventoryLow">ERP.InventoryLow</option>
                    <option value="ERP.SupplierInvoiceMismatch">ERP.SupplierInvoiceMismatch</option>
                    <option value="CRM.OpportunityWon">CRM.OpportunityWon</option>
                    <option value="BI.RefreshFailed">BI.RefreshFailed</option>
                  </select>
                </div>
              )}

              {trigger.trigger_type === 'SCHEDULE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Frequency
                    </label>
                    <select
                      value={trigger.schedule_frequency || 'DAILY'}
                      onChange={(e) => {
                        setTrigger({ ...trigger, schedule_frequency: e.target.value as any });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                    >
                      <option value="HOURLY">Hourly</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Time
                    </label>
                    <input
                      type="text"
                      value={trigger.schedule_time || '08:00'}
                      onChange={(e) => {
                        setTrigger({ ...trigger, schedule_time: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : selectedStep ? (
            /* Configure Selected Step */
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  Step Configuration
                </span>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  {selectedStep.name}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Step Label
                </label>
                <input
                  type="text"
                  value={selectedStep.name}
                  onChange={(e) => handleUpdateStep({ ...selectedStep, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Action Inputs with Data Pill Pickers */}
              {selectedStep.step_type === 'ACTION' && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Action Inputs & Data Reference Bindings
                  </span>

                  {/* Input fields based on action */}
                  {Object.entries(selectedStep.inputs || {}).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-slate-400 capitalize">
                          {key.replace('_', ' ')}
                        </label>
                        <button
                          onClick={() =>
                            setActivePillTarget({ stepKey: selectedStep.step_key, fieldName: key })
                          }
                          className="flex items-center gap-1 text-[10px] font-medium text-indigo-400 hover:text-indigo-300"
                        >
                          <Tag className="w-3 h-3" /> Data Pill
                        </button>
                      </div>

                      <input
                        type="text"
                        value={val || ''}
                        onChange={(e) => {
                          const newInputs = { ...(selectedStep.inputs || {}), [key]: e.target.value };
                          handleUpdateStep({ ...selectedStep, inputs: newInputs });
                        }}
                        className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ))}

                  {/* Add Input Key */}
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        const fieldName = prompt('Enter input parameter name (e.g. recipient, message, order_id):');
                        if (fieldName) {
                          const newInputs = { ...(selectedStep.inputs || {}), [fieldName]: '' };
                          handleUpdateStep({ ...selectedStep, inputs: newInputs });
                        }
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Input Parameter
                    </button>
                  </div>
                </div>
              )}

              {/* Condition Group Configuration */}
              {selectedStep.step_type === 'CONDITION' && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Conditional Evaluation Rules
                  </span>

                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Match Operator:</span>
                      <select
                        value={selectedStep.condition_group?.operator || 'AND'}
                        onChange={(e) => {
                          const updatedGroup: ConditionGroup = {
                            operator: e.target.value as 'AND' | 'OR',
                            rules: selectedStep.condition_group?.rules || [],
                          };
                          handleUpdateStep({ ...selectedStep, condition_group: updatedGroup });
                        }}
                        className="px-2 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200"
                      >
                        <option value="AND">ALL conditions (AND)</option>
                        <option value="OR">ANY condition (OR)</option>
                      </select>
                    </div>

                    {selectedStep.condition_group?.rules?.map((rule, rIdx) => (
                      <div key={rIdx} className="space-y-1.5 p-2 bg-slate-900 rounded-lg border border-slate-800">
                        <input
                          type="text"
                          value={rule.field_ref}
                          onChange={(e) => {
                            const newRules = [...(selectedStep.condition_group?.rules || [])];
                            newRules[rIdx].field_ref = e.target.value;
                            handleUpdateStep({
                              ...selectedStep,
                              condition_group: { ...selectedStep.condition_group!, rules: newRules },
                            });
                          }}
                          placeholder="field path (e.g. trigger.order.total)"
                          className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={rule.operator}
                            onChange={(e) => {
                              const newRules = [...(selectedStep.condition_group?.rules || [])];
                              newRules[rIdx].operator = e.target.value as any;
                              handleUpdateStep({
                                ...selectedStep,
                                condition_group: { ...selectedStep.condition_group!, rules: newRules },
                              });
                            }}
                            className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200"
                          >
                            <option value="EQUALS">equals</option>
                            <option value="GT">greater than</option>
                            <option value="LT">less than</option>
                            <option value="CONTAINS">contains</option>
                          </select>

                          <input
                            type="text"
                            value={rule.value}
                            onChange={(e) => {
                              const newRules = [...(selectedStep.condition_group?.rules || [])];
                              newRules[rIdx].value = e.target.value;
                              handleUpdateStep({
                                ...selectedStep,
                                condition_group: { ...selectedStep.condition_group!, rules: newRules },
                              });
                            }}
                            placeholder="target value"
                            className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reliability Settings */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">
                  Reliability & Error Policy
                </span>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    On Error Action
                  </label>
                  <select
                    value={selectedStep.on_error_policy || 'FAIL_FLOW'}
                    onChange={(e) =>
                      handleUpdateStep({ ...selectedStep, on_error_policy: e.target.value as any })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200"
                  >
                    <option value="FAIL_FLOW">Fail Flow Immediately</option>
                    <option value="RETRY_THEN_FAIL">Retry with Backoff, then Fail</option>
                    <option value="CONTINUE">Record Warning and Continue</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              Select a step or trigger to configure properties.
            </div>
          )}
        </aside>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Data Pill Picker Modal */}
      {/* ------------------------------------------------------------- */}
      {activePillTarget && (
        <DataPillPicker
          trigger={trigger}
          steps={steps}
          currentStepIndex={selectedStepIndex}
          onSelectPill={(pillExpr) => {
            if (!selectedStep) return;
            const currentVal = selectedStep.inputs?.[activePillTarget.fieldName] || '';
            const newVal = currentVal ? `${currentVal} ${pillExpr}` : pillExpr;
            const newInputs = { ...(selectedStep.inputs || {}), [activePillTarget.fieldName]: newVal };
            handleUpdateStep({ ...selectedStep, inputs: newInputs });
            setActivePillTarget(null);
          }}
          onClose={() => setActivePillTarget(null)}
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. Pre-Activation Test Simulator Modal */}
      {/* ------------------------------------------------------------- */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-lg border ${
                    runMode === 'LIVE'
                      ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}
                >
                  {runMode === 'LIVE' ? <Zap className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {runMode === 'LIVE' ? 'Execute Live Flow Run' : 'Test Flow Execution'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {runMode === 'LIVE'
                      ? 'Live execution dispatches real domain events, pauses at approvals, and mutates system data'
                      : 'Sandbox test run before publication'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Trigger Payload {runMode === 'LIVE' ? '(Live)' : 'Simulation'} (JSON)
              </label>
              <textarea
                value={testPayloadStr}
                onChange={(e) => setTestPayloadStr(e.target.value)}
                rows={9}
                className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div
              className={`p-3 rounded-xl border text-xs ${
                runMode === 'LIVE'
                  ? 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
              }`}
            >
              {runMode === 'LIVE' ? (
                <>
                  <strong>Live Execution Guard:</strong> If this flow reaches an Approval step, it will pause in{' '}
                  <code className="px-1 py-0.5 rounded bg-purple-950/80 text-purple-200">WAITING</code> status and generate a real item in your Approvals inbox. Subsequent actions execute when approved.
                </>
              ) : (
                <>
                  <strong>Sandbox Guard:</strong> Flow will execute in guarded diagnostic mode. Step timings and resolved data references will be recorded in execution details.
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsTestModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRunModalSubmit}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-md transition-colors ${
                  runMode === 'LIVE'
                    ? 'bg-purple-600 hover:bg-purple-500'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                {runMode === 'LIVE' ? (
                  <>
                    <Zap className="w-3.5 h-3.5" /> Trigger Live Flow
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Execute Test Run
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. Static Validation Drawer */}
      {/* ------------------------------------------------------------- */}
      {showValidationDrawer && validationResult && (
        <div className="fixed bottom-4 right-4 z-40 w-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 animate-slideUp">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {validationResult.is_valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span className="text-xs font-bold text-white">
                Validation Result ({validationResult.is_valid ? 'Valid' : 'Errors Detected'})
              </span>
            </div>
            <button
              onClick={() => setShowValidationDrawer(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-2.5 space-y-1.5 text-xs">
            {validationResult.errors.map((err, i) => (
              <div key={i} className="text-rose-400 flex items-start gap-1.5">
                <span>•</span>
                <span>{err}</span>
              </div>
            ))}
            {validationResult.warnings.map((warn, i) => (
              <div key={i} className="text-amber-400 flex items-start gap-1.5">
                <span>•</span>
                <span>{warn}</span>
              </div>
            ))}
            {validationResult.errors.length === 0 && validationResult.warnings.length === 0 && (
              <p className="text-emerald-400 text-xs">All checks passed with 0 issues.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
