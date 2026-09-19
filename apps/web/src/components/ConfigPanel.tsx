import React from 'react';
import { Save, RotateCcw, Sliders } from 'lucide-react';

export interface ConfigField {
  id: string;
  label: string;
  description?: string;
  type: 'text' | 'password' | 'select' | 'toggle' | 'textarea' | 'number';
  value: any;
  options?: { label: string; value: string }[];
  placeholder?: string;
  disabled?: boolean;
}

export interface ConfigSection {
  title: string;
  description?: string;
  fields: ConfigField[];
}

export interface ConfigPanelProps {
  title: string;
  subtitle?: string;
  sections: ConfigSection[];
  onChangeField: (sectionIndex: number, fieldId: string, value: any) => void;
  onSave: () => void;
  onReset?: () => void;
  isSaving?: boolean;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({
  title,
  subtitle,
  sections,
  onChangeField,
  onSave,
  onReset,
  isSaving = false,
}) => {
  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 space-y-6 text-xs text-slate-300 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            {title}
          </h3>
          {subtitle && <p className="text-slate-400 text-xs mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl shadow-md shadow-teal-500/10 transition-all disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Persisting...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section, secIdx) => (
          <div key={secIdx} className="space-y-4">
            <div>
              <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-teal-400">
                {section.title}
              </h4>
              {section.description && (
                <p className="text-slate-500 text-[11px] mt-0.5">{section.description}</p>
              )}
            </div>

            <div className="space-y-3">
              {section.fields.map((field) => (
                <div
                  key={field.id}
                  className="p-3.5 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <label className="font-semibold text-slate-200 block text-xs">
                        {field.label}
                      </label>
                      {field.description && (
                        <p className="text-slate-500 text-[11px]">{field.description}</p>
                      )}
                    </div>

                    {field.type === 'toggle' && (
                      <input
                        type="checkbox"
                        checked={!!field.value}
                        onChange={(e) => onChangeField(secIdx, field.id, e.target.checked)}
                        disabled={field.disabled}
                        className="w-4 h-4 accent-teal-500 cursor-pointer"
                      />
                    )}
                  </div>

                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={field.value ?? ''}
                      onChange={(e) => onChangeField(secIdx, field.id, e.target.value)}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono text-xs"
                    />
                  )}

                  {field.type === 'password' && (
                    <input
                      type="password"
                      value={field.value ?? ''}
                      onChange={(e) => onChangeField(secIdx, field.id, e.target.value)}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono text-xs"
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      value={field.value ?? 0}
                      onChange={(e) => onChangeField(secIdx, field.id, Number(e.target.value))}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono text-xs"
                    />
                  )}

                  {field.type === 'select' && field.options && (
                    <select
                      value={field.value ?? ''}
                      onChange={(e) => onChangeField(secIdx, field.id, e.target.value)}
                      disabled={field.disabled}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 text-xs"
                    >
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {field.type === 'textarea' && (
                    <textarea
                      rows={3}
                      value={field.value ?? ''}
                      onChange={(e) => onChangeField(secIdx, field.id, e.target.value)}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-teal-400 focus:outline-none focus:border-teal-500 font-mono text-xs"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
