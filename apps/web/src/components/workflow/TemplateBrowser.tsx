import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Copy,
} from 'lucide-react';
import { FlowTemplate } from '../../types';

interface TemplateBrowserProps {
  templates: FlowTemplate[];
  onUseTemplate: (template: FlowTemplate) => Promise<void>;
}

export const TemplateBrowser: React.FC<TemplateBrowserProps> = ({
  templates,
  onUseTemplate,
}) => {
  const [isApplying, setIsApplying] = useState<string | null>(null);

  const handleApply = async (tpl: FlowTemplate) => {
    setIsApplying(tpl.id);
    try {
      await onUseTemplate(tpl);
    } finally {
      setIsApplying(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-amber-400" />
          Automation Blueprint Templates
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Accelerate workflow authoring with pre-configured, enterprise best-practice automation flows
        </p>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="p-6 bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-2xl transition-all shadow-lg flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  {tpl.category}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {tpl.template_structure?.steps?.length || 2} step(s)
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                  {tpl.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-slate-400">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold text-slate-300">Trigger:</span>
                  <span className="font-mono text-slate-300 text-[11px]">{tpl.trigger_summary}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Creates a new Draft flow in Designer
              </span>

              <button
                onClick={() => handleApply(tpl)}
                disabled={isApplying === tpl.id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors shadow-md disabled:opacity-50"
              >
                <Copy className="w-3.5 h-3.5" />
                {isApplying === tpl.id ? 'Creating...' : 'Use Template'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
