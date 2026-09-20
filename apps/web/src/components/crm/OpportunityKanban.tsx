import React, { useState } from 'react';
import { Calendar, Building } from 'lucide-react';
import { Opportunity, Account } from '../../types';

interface OpportunityKanbanProps {
  opportunities: Opportunity[];
  accounts: Account[];
  onSelectOpportunity: (opp: Opportunity) => void;
  onMoveStage: (opportunityId: number, targetStage: string) => Promise<void>;
  onCloseLostPrompt?: (opp: Opportunity) => void;
}

const STAGES = [
  { id: 'PROSPECTING', label: 'Prospecting', color: 'border-slate-300' },
  { id: 'QUALIFICATION', label: 'Qualification', color: 'border-blue-300' },
  { id: 'DISCOVERY', label: 'Discovery', color: 'border-indigo-300' },
  { id: 'PROPOSAL', label: 'Proposal', color: 'border-purple-300' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'border-amber-300' },
  { id: 'CLOSED_WON', label: 'Closed Won', color: 'border-emerald-400 bg-emerald-50/20' },
  { id: 'CLOSED_LOST', label: 'Closed Lost', color: 'border-rose-400 bg-rose-50/20' },
];

export const OpportunityKanban: React.FC<OpportunityKanbanProps> = ({
  opportunities,
  accounts,
  onSelectOpportunity,
  onMoveStage,
  onCloseLostPrompt,
}) => {
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const getAccountName = (accountId?: number) => {
    if (!accountId) return 'Independent Account';
    const acc = accounts.find((a) => a.id === accountId);
    return acc ? acc.name : `Account #${accountId}`;
  };

  const handleDragStart = (e: React.DragEvent, oppId: number) => {
    e.dataTransfer.setData('text/plain', oppId.toString());
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const oppIdStr = e.dataTransfer.getData('text/plain');
    const oppId = Number(oppIdStr);
    if (!oppId) return;

    const opp = opportunities.find((o) => o.id === oppId);
    if (!opp || opp.stage === targetStage) return;

    if (targetStage === 'CLOSED_LOST' && onCloseLostPrompt) {
      onCloseLostPrompt(opp);
      return;
    }

    await onMoveStage(oppId, targetStage);
  };

  return (
    <div className="flex gap-3.5 overflow-x-auto pb-4 pt-1 items-start min-h-[580px] scrollbar-thin">
      {STAGES.map((stage) => {
        const stageOpps = opportunities.filter((o) => o.stage === stage.id);
        const totalValue = stageOpps.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const isTarget = dragOverStage === stage.id;

        return (
          <div
            key={stage.id}
            onDragOver={(e) => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage.id)}
            className={`w-72 shrink-0 bg-slate-50 border rounded-xl flex flex-col max-h-[750px] transition-colors ${
              isTarget
                ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-200'
                : `${stage.color}`
            }`}
          >
            {/* Column Header */}
            <div className="p-3 border-b border-slate-200/80 bg-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  {stage.label}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                  {stageOpps.length}
                </span>
              </div>
              <div className="text-[11px] font-mono font-medium text-slate-500 mt-1">
                {totalValue.toLocaleString('vi-VN')} VND
              </div>
            </div>

            {/* Cards container */}
            <div className="p-2 space-y-2.5 overflow-y-auto flex-1 scrollbar-thin">
              {stageOpps.length === 0 ? (
                <div className="text-center py-8 px-2 border-2 border-dashed border-slate-200 rounded-lg">
                  <span className="text-[11px] text-slate-400 font-medium">No deals in this stage</span>
                </div>
              ) : (
                stageOpps.map((opp) => (
                  <div
                    key={opp.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, opp.id)}
                    onClick={() => onSelectOpportunity(opp)}
                    className="group bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all cursor-grab active:cursor-grabbing space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-teal-600 transition-colors line-clamp-2">
                        {opp.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                      <Building className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{getAccountName(opp.account_id)}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="font-mono font-bold text-slate-900">
                        {opp.amount.toLocaleString('vi-VN')} {opp.currency}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        {opp.probability}%
                      </span>
                    </div>

                    {/* Accessible stage switcher dropdown */}
                    <div
                      className="flex items-center justify-between pt-1 text-[10px] text-slate-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {opp.expected_close_date
                          ? new Date(opp.expected_close_date).toLocaleDateString('vi-VN')
                          : 'No close date'}
                      </span>

                      <select
                        value={opp.stage}
                        onChange={(e) => {
                          const newStage = e.target.value;
                          if (newStage === 'CLOSED_LOST' && onCloseLostPrompt) {
                            onCloseLostPrompt(opp);
                          } else {
                            onMoveStage(opp.id, newStage);
                          }
                        }}
                        className="text-[10px] py-0.5 px-1 rounded border border-slate-200 bg-slate-50 text-slate-600 focus:outline-hidden"
                      >
                        {STAGES.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
