import React from 'react';
import { FileText, HelpCircle } from 'lucide-react';
import { ReportPage } from '../../types';

interface ReportPageTabsProps {
  pages: ReportPage[];
  activePageId: string;
  onSelectPage: (id: string) => void;
  isEditing?: boolean;
  onAddPage?: () => void;
}

export const ReportPageTabs: React.FC<ReportPageTabsProps> = ({
  pages,
  activePageId,
  onSelectPage,
  isEditing = false,
  onAddPage,
}) => {
  const activePage = pages.find((p) => p.id === activePageId) || pages[0];

  return (
    <div className="space-y-2">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-2 rounded-t-xl">
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {pages.map((p) => {
            const isActive = p.id === activePageId;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPage(p.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                {p.name}
              </button>
            );
          })}

          {isEditing && onAddPage && (
            <button
              onClick={onAddPage}
              className="px-2.5 py-1.5 text-xs font-semibold text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors border border-dashed border-teal-300"
            >
              + Add Page
            </button>
          )}
        </div>
      </div>

      {/* Page Question Banner (Section 32 & 76 Quality Checklist) */}
      {activePage?.page_question && (
        <div className="px-3.5 py-2 bg-slate-50 border border-slate-200/90 rounded-lg flex items-center gap-2 text-xs text-slate-700">
          <HelpCircle className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="font-semibold text-slate-900">Analytical Question:</span>
          <span className="italic text-slate-600">{activePage.page_question}</span>
        </div>
      )}
    </div>
  );
};
