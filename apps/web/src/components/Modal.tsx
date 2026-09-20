import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  const maxWidthClass = sizeClasses[size] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-smooth-fade">
      <div className={`bg-white border border-slate-200/90 rounded-2xl w-full ${maxWidthClass} shadow-2xl overflow-hidden animate-smooth-scale max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-white shrink-0">
          <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors btn-press"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 text-xs text-slate-700 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
