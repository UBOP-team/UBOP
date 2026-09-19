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
    <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-6 text-xs text-slate-700 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-600" />
            {title}
          </h3>
          {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition-colors font-medium text-xs shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" /> Reset Defaults
            </button>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg shadow-xs transition-colors disabled:opacity-50 text-xs"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map((section, secIdx) => (
          <div key={secIdx} className="space-y-3">
            <div className="pb-1">
              <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-slate-500">
                {section.title}
              </h4>
              {section.description && (
                <p className="text-slate-500 text-[11px] mt-0.5">{section.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {section.fields.map((field) => (
                <div
                  key={field.id}
                  className={`p-3.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 transition-colors ${
                    field.type === 'textarea' ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <label className="font-semibold text-slate-900 block text-xs">
                        {field.label}
                      </label>
                      {field.description && (
                        <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                          {field.description}
                        </p>
                      )}
                    </div>

                    {field.type === 'toggle' && (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!field.value}
                        onClick={() => !field.disabled && onChangeField(secIdx, field.id, !field.value)}
                        disabled={field.disabled}
                        className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out relative shrink-0 ${
                          field.value ? 'bg-teal-600' : 'bg-slate-300'
                        } ${field.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span
                          className={`block w-4.5 h-4.5 bg-white rounded-full shadow-xs transition-transform duration-200 ease-in-out ${
                            field.value ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {field.type === 'text' && (
                    <input
                      type="text"
                      value={field.value ?? ''}
                      onChange={(e) => onChangeField(secIdx, field.id, e.target.value)}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-mono text-xs shadow-xs"
                    />
                  )}

                  {field.type === 'password' && (
                    <input
                      type="password"
                      value={field.value ?? ''}
                      onChange={(e) => onChangeField(secIdx, field.id, e.target.value)}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-mono text-xs shadow-xs"
                    />
                  )}

                  {field.type === 'number' && (
                    <input
                      type="number"
                      value={field.value ?? 0}
                      onChange={(e) => onChangeField(secIdx, field.id, Number(e.target.value))}
                      placeholder={field.placeholder}
                      disabled={field.disabled}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-mono text-xs shadow-xs"
                    />
                  )}

                  {field.type === 'select' && field.options && (
                    <select
                      value={field.value ?? ''}
                      onChange={(e) => onChangeField(secIdx, field.id, e.target.value)}
                      disabled={field.disabled}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-xs shadow-xs"
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
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-mono text-xs shadow-xs"
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
