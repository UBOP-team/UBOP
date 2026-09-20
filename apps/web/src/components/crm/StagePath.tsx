import React from 'react';
import { Check, ChevronRight } from 'lucide-react';

export interface StagePathStep {
  id: string;
  label: string;
}

interface StagePathProps {
  steps: StagePathStep[];
  currentStepId: string;
  onSelectStep?: (stepId: string) => void;
  onMarkCurrentComplete?: () => void;
  isTerminalWon?: boolean;
  isTerminalLost?: boolean;
  readOnly?: boolean;
}

export const StagePath: React.FC<StagePathProps> = ({
  steps,
  currentStepId,
  onSelectStep,
  onMarkCurrentComplete,
  isTerminalWon = false,
  isTerminalLost = false,
  readOnly = false,
}) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Stage Progression Path
        </span>
        {!readOnly && onMarkCurrentComplete && !isTerminalWon && !isTerminalLost && (
          <button
            onClick={onMarkCurrentComplete}
            className="text-xs px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            Advance Stage
          </button>
        )}
      </div>

      <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-thin">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex || isTerminalWon;
          const isCurrent = step.id === currentStepId;

          let badgeClasses = 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
          if (isCurrent) {
            badgeClasses = isTerminalLost
              ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300'
              : 'bg-teal-600 text-white border-teal-600 ring-2 ring-teal-200 font-semibold';
          } else if (isCompleted) {
            badgeClasses = 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100';
          }

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => onSelectStep && onSelectStep(step.id)}
                className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all shrink-0 cursor-pointer disabled:cursor-default ${badgeClasses}`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-white text-teal-700'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : idx + 1}
                </span>
                <span className="truncate max-w-[120px]">{step.label}</span>
              </button>
              {idx < steps.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
