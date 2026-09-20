import React, { useState, useEffect } from 'react';
import {
  WorkflowRule,
  WorkflowLog,
  FlowDefinition,
  ActionDefinition,
  SubflowDefinition,
  FlowTemplate,
  FlowRun,
  ApprovalRequest,
} from '../types';
import { FlowList } from '../components/workflow/FlowList';
import { FlowDesigner } from '../components/workflow/FlowDesigner';
import { FlowRunHistory } from '../components/workflow/FlowRunHistory';
import { ActionCatalog } from '../components/workflow/ActionCatalog';
import { SubflowList } from '../components/workflow/SubflowList';
import { TemplateBrowser } from '../components/workflow/TemplateBrowser';
import { ApprovalInbox } from '../components/workflow/ApprovalInbox';
import { ExecutionDetailModal } from '../components/workflow/ExecutionDetailModal';
import { useToast } from '../components/Toast';

interface WorkflowViewProps {
  rules?: WorkflowRule[];
  logs?: WorkflowLog[];
  onCreateRule?: (rule: any) => Promise<void>;
  onToggleRule?: (ruleId: number, isActive: boolean) => Promise<void>;
  onDeleteRule?: (ruleId: number) => Promise<void>;
  onTriggerExecution?: (eventData?: any) => Promise<void>;
  activeSubNav?: string;
}

export const WorkflowView: React.FC<WorkflowViewProps> = ({
  activeSubNav,
}) => {
  const toast = useToast();

  // Navigation State
  const [currentView, setCurrentView] = useState<
    'FLOWS' | 'DESIGNER' | 'RUNS' | 'ACTIONS' | 'SUBFLOWS' | 'TEMPLATES' | 'APPROVALS'
  >('FLOWS');

  // Loaded Entities
  const [flows, setFlows] = useState<FlowDefinition[]>([]);
  const [actions, setActions] = useState<ActionDefinition[]>([]);
  const [subflows, setSubflows] = useState<SubflowDefinition[]>([]);
  const [templates, setTemplates] = useState<FlowTemplate[]>([]);
  const [runs, setRuns] = useState<FlowRun[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

  // Selected for Inspect / Designer
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [inspectedRun, setInspectedRun] = useState<FlowRun | null>(null);

  // Sync with Sidebar navigation
  useEffect(() => {
    if (!activeSubNav) return;
    if (activeSubNav === 'FLOWS' || activeSubNav === 'FLOW_CANVAS') {
      setCurrentView('FLOWS');
    } else if (activeSubNav === 'RUNS' || activeSubNav === 'ANALYTICS') {
      setCurrentView('RUNS');
    } else if (activeSubNav === 'ACTIONS' || activeSubNav === 'RULES_TABLE') {
      setCurrentView('ACTIONS');
    } else if (activeSubNav === 'SUBFLOWS') {
      setCurrentView('SUBFLOWS');
    } else if (activeSubNav === 'TEMPLATES') {
      setCurrentView('TEMPLATES');
    } else if (activeSubNav === 'APPROVALS') {
      setCurrentView('APPROVALS');
    }
  }, [activeSubNav]);

  // Initial Data Fetching
  const fetchAllData = async () => {
    try {
      const [flowsRes, actionsRes, subflowsRes, templatesRes, runsRes, approvalsRes] = await Promise.all([
        fetch('/api/v1/workflow/flows').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/v1/workflow/actions').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/v1/workflow/subflows').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/v1/workflow/templates').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/v1/workflow/runs').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/v1/workflow/approvals').then((r) => (r.ok ? r.json() : [])),
      ]);

      setFlows(flowsRes);
      setActions(actionsRes);
      setSubflows(subflowsRes);
      setTemplates(templatesRes);
      setRuns(runsRes);
      setApprovals(approvalsRes);
    } catch (err) {
      console.error('Error fetching workflow data:', err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // -------------------------------------------------------------
  // Flow Handlers
  // -------------------------------------------------------------
  const handleSelectFlow = (flowId: string) => {
    setSelectedFlowId(flowId);
    setCurrentView('DESIGNER');
  };

  const handleCreateFlow = async (newFlowData: { name: string; description: string; category: string }) => {
    try {
      const payload = {
        name: newFlowData.name,
        description: newFlowData.description,
        category: newFlowData.category,
        trigger: {
          trigger_type: 'DOMAIN_EVENT',
          event_name: 'OMS.OrderCreated',
          enabled: true,
        },
        steps: [],
      };

      const res = await fetch('/api/v1/workflow/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create flow');
      const created: FlowDefinition = await res.json();
      setFlows((prev) => [created, ...prev]);
      setSelectedFlowId(created.id);
      setCurrentView('DESIGNER');
      toast.success('Flow Created', `Draft version initialized for ${created.name}`);
    } catch (err: any) {
      toast.error('Error', err.message || 'Could not create flow');
    }
  };

  const handleSaveDraft = async (updatedFields: Partial<FlowDefinition>) => {
    if (!selectedFlowId) return;
    const res = await fetch(`/api/v1/workflow/flows/${selectedFlowId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedFields),
    });
    if (!res.ok) throw new Error('Failed to update flow draft');
    const updated: FlowDefinition = await res.json();
    setFlows((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  const handleActivateFlow = async (flowId: string) => {
    const res = await fetch(`/api/v1/workflow/flows/${flowId}/activate`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to activate flow');
    }
    const activated: FlowDefinition = await res.json();
    setFlows((prev) => prev.map((f) => (f.id === activated.id ? activated : f)));
  };

  const handleToggleStatus = async (flowId: string, currentStatus: string) => {
    const endpoint = currentStatus === 'ACTIVE' ? 'deactivate' : 'activate';
    try {
      const res = await fetch(`/api/v1/workflow/flows/${flowId}/${endpoint}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Status change failed');
      const updated: FlowDefinition = await res.json();
      setFlows((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      toast.success('Status Updated', `Flow is now ${updated.status}`);
    } catch (err: any) {
      toast.error('Status Error', err.message);
    }
  };

  const handleRunTest = async (flowId: string, customPayload?: any) => {
    try {
      const targetFlow = flows.find((f) => f.id === flowId);
      const payload = customPayload || {
        order: {
          id: 'ORD-20391',
          order_number: 'ORD-20391',
          total: 85000000,
          channel: 'B2B',
          customer_name: 'Vinamilk Megacorp',
          owner_email: 'sales@ubop.vn',
        },
      };

      const res = await fetch(`/api/v1/workflow/flows/${flowId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger_type: targetFlow?.active_version?.trigger_definition?.trigger_type || 'DOMAIN_EVENT',
          payload,
        }),
      });

      if (!res.ok) throw new Error('Test execution failed');
      const testRun: FlowRun = await res.json();
      setRuns((prev) => [testRun, ...prev]);
      setInspectedRun(testRun);
      toast.success('Test Run Complete', `Executed ${testRun.step_runs?.length || 0} steps in ${testRun.duration_ms} ms`);
    } catch (err: any) {
      toast.error('Test Failed', err.message);
    }
  };

  const handleUseTemplate = async (template: FlowTemplate) => {
    try {
      const payload = {
        name: template.name,
        description: template.description,
        category: template.category,
        trigger: template.template_structure.trigger,
        steps: template.template_structure.steps,
      };

      const res = await fetch('/api/v1/workflow/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create flow from template');
      const created: FlowDefinition = await res.json();
      setFlows((prev) => [created, ...prev]);
      setSelectedFlowId(created.id);
      setCurrentView('DESIGNER');
      toast.success('Template Applied', `Created Draft flow from ${template.name}`);
    } catch (err: any) {
      toast.error('Template Error', err.message);
    }
  };

  // -------------------------------------------------------------
  // Run Handlers
  // -------------------------------------------------------------
  const handleCancelRun = async (runId: string) => {
    try {
      const res = await fetch(`/api/v1/workflow/runs/${runId}/cancel`, { method: 'POST' });
      if (!res.ok) throw new Error('Cancel failed');
      const updated: FlowRun = await res.json();
      setRuns((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setInspectedRun(updated);
      toast.success('Run Cancelled', 'Execution was halted.');
    } catch (err: any) {
      toast.error('Error', err.message);
    }
  };

  const handleRetryRun = async (runId: string) => {
    try {
      const res = await fetch(`/api/v1/workflow/runs/${runId}/retry`, { method: 'POST' });
      if (!res.ok) throw new Error('Retry failed');
      const newRun: FlowRun = await res.json();
      setRuns((prev) => [newRun, ...prev]);
      setInspectedRun(newRun);
      toast.success('Run Retried', 'New execution initiated with idempotency guard.');
    } catch (err: any) {
      toast.error('Error', err.message);
    }
  };

  // -------------------------------------------------------------
  // Approval Handlers
  // -------------------------------------------------------------
  const handleDecideApproval = async (approvalId: string, decision: 'APPROVED' | 'REJECTED', comment?: string) => {
    try {
      const res = await fetch(`/api/v1/workflow/approvals/${approvalId}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, comment }),
      });

      if (!res.ok) throw new Error('Decision failed');
      const updated: ApprovalRequest = await res.json();
      setApprovals((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success('Approval Recorded', `Decision: ${decision}. Associated flow run will resume.`);
    } catch (err: any) {
      toast.error('Error', err.message);
    }
  };

  // Active selected flow
  const currentFlow = flows.find((f) => f.id === selectedFlowId) || flows[0];

  return (
    <div className="min-h-full bg-slate-950">
      {/* View Switching */}
      {currentView === 'FLOWS' && (
        <FlowList
          flows={flows}
          onSelectFlow={handleSelectFlow}
          onCreateFlow={handleCreateFlow}
          onRunTest={(flowId) => handleRunTest(flowId)}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {currentView === 'DESIGNER' && currentFlow && (
        <FlowDesigner
          flow={currentFlow}
          actions={actions}
          subflows={subflows}
          onBack={() => setCurrentView('FLOWS')}
          onSaveDraft={handleSaveDraft}
          onActivate={handleActivateFlow}
          onRunTest={handleRunTest}
        />
      )}

      {currentView === 'RUNS' && (
        <FlowRunHistory
          runs={runs}
          onSelectRun={(run) => setInspectedRun(run)}
          onRetryRun={handleRetryRun}
          onCancelRun={handleCancelRun}
        />
      )}

      {currentView === 'ACTIONS' && (
        <ActionCatalog actions={actions} />
      )}

      {currentView === 'SUBFLOWS' && (
        <SubflowList subflows={subflows} />
      )}

      {currentView === 'TEMPLATES' && (
        <TemplateBrowser
          templates={templates}
          onUseTemplate={handleUseTemplate}
        />
      )}

      {currentView === 'APPROVALS' && (
        <ApprovalInbox
          approvals={approvals}
          onDecide={handleDecideApproval}
        />
      )}

      {/* ServiceNow Execution Details Modal */}
      {inspectedRun && (
        <ExecutionDetailModal
          run={inspectedRun}
          onClose={() => setInspectedRun(null)}
          onRetry={handleRetryRun}
          onCancel={handleCancelRun}
        />
      )}
    </div>
  );
};
