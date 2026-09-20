import React, { useState } from 'react';
import { Search, Tag, ArrowRight, X, Layers, Zap } from 'lucide-react';
import { TriggerDefinition, StepDefinition } from '../../types';

interface DataPillPickerProps {
  trigger?: TriggerDefinition;
  steps: StepDefinition[];
  currentStepIndex: number;
  onSelectPill: (pillExpression: string) => void;
  onClose: () => void;
}

interface AvailablePill {
  category: 'Trigger' | 'Step Output';
  sourceName: string;
  fieldPath: string;
  label: string;
  type: string;
  example?: string;
}

export const DataPillPicker: React.FC<DataPillPickerProps> = ({
  trigger,
  steps,
  currentStepIndex,
  onSelectPill,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'TRIGGER' | 'STEPS'>('ALL');

  // Build pill catalog from current flow context
  const pills: AvailablePill[] = [];

  // 1. Trigger pills
  if (trigger) {
    if (trigger.trigger_type === 'DOMAIN_EVENT') {
      const eventName = trigger.event_name || 'OMS.OrderCreated';
      if (eventName.includes('Order')) {
        pills.push(
          { category: 'Trigger', sourceName: 'Order Created', fieldPath: 'trigger.order.id', label: 'Order ID', type: 'string', example: 'ORD-20391' },
          { category: 'Trigger', sourceName: 'Order Created', fieldPath: 'trigger.order.order_number', label: 'Order Number', type: 'string', example: 'ORD-20391' },
          { category: 'Trigger', sourceName: 'Order Created', fieldPath: 'trigger.order.total', label: 'Order Total Amount', type: 'number', example: '85,000,000' },
          { category: 'Trigger', sourceName: 'Order Created', fieldPath: 'trigger.order.channel', label: 'Sales Channel', type: 'string', example: 'B2B' },
          { category: 'Trigger', sourceName: 'Order Created', fieldPath: 'trigger.order.customer_name', label: 'Customer Name', type: 'string', example: 'Vinamilk Megacorp' },
          { category: 'Trigger', sourceName: 'Order Created', fieldPath: 'trigger.order.owner_email', label: 'Owner Email', type: 'email', example: 'sales@ubop.vn' }
        );
      } else if (eventName.includes('Inventory')) {
        pills.push(
          { category: 'Trigger', sourceName: 'Inventory Low', fieldPath: 'trigger.inventory.material_id', label: 'Material ID', type: 'string', example: 'MAT-SRV-01' },
          { category: 'Trigger', sourceName: 'Inventory Low', fieldPath: 'trigger.inventory.material_name', label: 'Material Name', type: 'string', example: 'Dell PowerEdge Server' },
          { category: 'Trigger', sourceName: 'Inventory Low', fieldPath: 'trigger.inventory.plant', label: 'Plant Code', type: 'string', example: 'PL01' },
          { category: 'Trigger', sourceName: 'Inventory Low', fieldPath: 'trigger.inventory.available_qty', label: 'Available Quantity', type: 'number', example: '12' }
        );
      } else if (eventName.includes('Opportunity')) {
        pills.push(
          { category: 'Trigger', sourceName: 'Opportunity Won', fieldPath: 'trigger.opportunity.id', label: 'Opportunity ID', type: 'string', example: 'OPP-8910' },
          { category: 'Trigger', sourceName: 'Opportunity Won', fieldPath: 'trigger.opportunity.account_name', label: 'Account Name', type: 'string', example: 'Viettel Telecom' },
          { category: 'Trigger', sourceName: 'Opportunity Won', fieldPath: 'trigger.opportunity.amount', label: 'Deal Amount', type: 'number', example: '150,000,000' }
        );
      } else {
        pills.push(
          { category: 'Trigger', sourceName: 'Event Payload', fieldPath: 'trigger.id', label: 'Event ID', type: 'string', example: 'EVT-9921' },
          { category: 'Trigger', sourceName: 'Event Payload', fieldPath: 'trigger.summary', label: 'Summary', type: 'string', example: 'Event Data' }
        );
      }
    } else if (trigger.trigger_type === 'SCHEDULE') {
      pills.push(
        { category: 'Trigger', sourceName: 'Schedule', fieldPath: 'trigger.scheduled_at', label: 'Execution Timestamp', type: 'date', example: '2026-09-20T08:00:00Z' },
        { category: 'Trigger', sourceName: 'Schedule', fieldPath: 'trigger.frequency', label: 'Frequency', type: 'string', example: trigger.schedule_frequency || 'DAILY' }
      );
    }
  }

  // 2. Preceding steps pills
  steps.slice(0, currentStepIndex).forEach((prevStep, idx) => {
    const key = prevStep.step_key || `step_${idx + 1}`;
    if (prevStep.step_type === 'ACTION') {
      pills.push(
        { category: 'Step Output', sourceName: prevStep.name, fieldPath: `steps.${key}.status`, label: 'Execution Status', type: 'string', example: 'COMPLETED' },
        { category: 'Step Output', sourceName: prevStep.name, fieldPath: `steps.${key}.result_id`, label: 'Result Reference ID', type: 'string', example: 'res_8829' }
      );
    } else if (prevStep.step_type === 'APPROVAL') {
      pills.push(
        { category: 'Step Output', sourceName: prevStep.name, fieldPath: `steps.${key}.decision`, label: 'Approval Decision', type: 'string', example: 'APPROVED' },
        { category: 'Step Output', sourceName: prevStep.name, fieldPath: `steps.${key}.approver`, label: 'Approver Name', type: 'string', example: 'Operations Lead' },
        { category: 'Step Output', sourceName: prevStep.name, fieldPath: `steps.${key}.comment`, label: 'Approval Comments', type: 'string', example: 'Approved' }
      );
    } else if (prevStep.step_type === 'CONDITION') {
      pills.push(
        { category: 'Step Output', sourceName: prevStep.name, fieldPath: `steps.${key}.branch`, label: 'Evaluated Branch', type: 'string', example: 'TRUE' }
      );
    }
  });

  const filteredPills = pills.filter((pill) => {
    if (activeCategory === 'TRIGGER' && pill.category !== 'Trigger') return false;
    if (activeCategory === 'STEPS' && pill.category !== 'Step Output') return false;
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      pill.label.toLowerCase().includes(q) ||
      pill.fieldPath.toLowerCase().includes(q) ||
      pill.sourceName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Select Data Pill Reference</h3>
              <p className="text-xs text-slate-400">Insert upstream data values into configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search pill by field, source, or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeCategory === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Available ({pills.length})
            </button>
            <button
              onClick={() => setActiveCategory('TRIGGER')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeCategory === 'TRIGGER'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Trigger Payload
            </button>
            <button
              onClick={() => setActiveCategory('STEPS')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                activeCategory === 'STEPS'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Step Outputs
            </button>
          </div>
        </div>

        {/* Pill List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-800/60 space-y-1">
          {filteredPills.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No matching data pills found.
            </div>
          ) : (
            filteredPills.map((pill, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onSelectPill(`{{ ${pill.fieldPath} }}`);
                  onClose();
                }}
                className="pt-2 pb-2 px-3 rounded-lg hover:bg-indigo-500/10 hover:border-indigo-500/30 border border-transparent cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-200 group-hover:text-indigo-300">
                      {pill.label}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-400 font-mono">
                      {pill.type}
                    </span>
                    {pill.example && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        e.g. {pill.example}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-slate-500">
                      {pill.category === 'Trigger' ? (
                        <Zap className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Layers className="w-3 h-3 text-cyan-400" />
                      )}
                      {pill.sourceName}
                    </span>
                    <span>•</span>
                    <code className="text-indigo-400/90 font-mono text-[10px]">
                      {`{{ ${pill.fieldPath} }}`}
                    </code>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-indigo-400 transition-opacity">
                  <span>Insert</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>Click any data pill to insert into current field</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
