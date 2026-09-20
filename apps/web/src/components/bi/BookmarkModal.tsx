import React, { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { Modal } from '../Modal';
import { AnalyticalBookmark } from '../../types';

interface BookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: AnalyticalBookmark[];
  onSaveBookmark: (name: string, isDefault: boolean) => void;
  onApplyBookmark: (bm: AnalyticalBookmark) => void;
}

export const BookmarkModal: React.FC<BookmarkModalProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onSaveBookmark,
  onApplyBookmark,
}) => {
  const [newBookmarkName, setNewBookmarkName] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookmarkName.trim()) return;
    onSaveBookmark(newBookmarkName.trim(), isDefault);
    setNewBookmarkName('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Personal Analytical Bookmarks"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 -mt-2">
          Save your active page, on-canvas slicers, and filter configurations for instant recall.
        </p>
        {/* Create New Bookmark Form */}
        <form onSubmit={handleSave} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <span className="text-xs font-bold text-slate-900 block">Save Current Analytical State</span>
          <div>
            <input
              type="text"
              placeholder="e.g. Vietnam Shopify Q3 Performance"
              value={newBookmarkName}
              onChange={(e) => setNewBookmarkName(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Set as my default view
            </label>
            <button
              type="submit"
              disabled={!newBookmarkName.trim()}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              Save View
            </button>
          </div>
        </form>

        {/* Existing Bookmarks List */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 block">Saved Personal Views</span>
          {bookmarks.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No saved views yet for this report.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="flex items-center justify-between p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-3.5 h-3.5 text-teal-600" />
                    <span className="text-xs font-semibold text-slate-900">{bm.name}</span>
                    {bm.is_default && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Default
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      onApplyBookmark(bm);
                      onClose();
                    }}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-800 px-2 py-0.5 rounded hover:bg-teal-50 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
