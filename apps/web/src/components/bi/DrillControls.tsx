import React from 'react';
import { ChevronRight, ArrowLeft, CornerDownRight } from 'lucide-react';

interface DrillControlsProps {
  currentHierarchy: string[]; // e.g., ['2026', 'Q3', 'September']
  onDrillUp: () => void;
  canDrillUp: boolean;
  drillthroughContext?: {
    entity: string;
    id: string;
    name: string;
  } | null;
  onClearDrillthrough?: () => void;
}

export const DrillControls: React.FC<DrillControlsProps> = ({
  currentHierarchy,
  onDrillUp,
  canDrillUp,
  drillthroughContext,
  onClearDrillthrough,
}) => {
  if (!canDrillUp && !drillthroughContext) return null;

  return (
    <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
      <div className="flex items-center gap-2">
        {canDrillUp && (
          <button
            onClick={onDrillUp}
            className="flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded hover:bg-slate-100 font-semibold text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Drill Up
          </button>
        )}

        {currentHierarchy.length > 0 && (
          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600">
            {currentHierarchy.map((level, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
                <span className={idx === currentHierarchy.length - 1 ? 'font-bold text-teal-800' : ''}>
                  {level}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {drillthroughContext && (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
            <CornerDownRight className="w-3 h-3 text-indigo-600" />
            Drill-through: {drillthroughContext.entity} &gt; {drillthroughContext.name}
          </span>
          {onClearDrillthrough && (
            <button
              onClick={onClearDrillthrough}
              className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Return to Summary
            </button>
          )}
        </div>
      )}
    </div>
  );
};
