import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  Boxes,
  Users,
  ShoppingCart,
  GitMerge,
  Layers,
  Plus,
  Zap,
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'NAVIGATION' | 'ACTIONS';
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onAction?: (actionId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onAction,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: CommandItem[] = [
    {
      id: 'nav-dashboard',
      title: 'Go to Command Center (Executive Overview)',
      category: 'NAVIGATION',
      shortcut: 'G D',
      icon: LayoutDashboard,
      onSelect: () => onNavigate('dashboard'),
    },
    {
      id: 'nav-crm',
      title: 'Go to Customer Relationship Management (CRM)',
      category: 'NAVIGATION',
      shortcut: 'G C',
      icon: Users,
      onSelect: () => onNavigate('crm'),
    },
    {
      id: 'nav-oms',
      title: 'Go to Order Management System (OMS)',
      category: 'NAVIGATION',
      shortcut: 'G O',
      icon: ShoppingCart,
      onSelect: () => onNavigate('oms'),
    },
    {
      id: 'nav-erp',
      title: 'Go to Enterprise Resource Planning (ERP)',
      category: 'NAVIGATION',
      shortcut: 'G E',
      icon: Boxes,
      onSelect: () => onNavigate('erp'),
    },
    {
      id: 'nav-bi',
      title: 'Go to Business Intelligence & Telemetry (BI)',
      category: 'NAVIGATION',
      shortcut: 'G B',
      icon: LayoutDashboard,
      onSelect: () => onNavigate('bi'),
    },
    {
      id: 'nav-workflows',
      title: 'Go to Automation & Workflows',
      category: 'NAVIGATION',
      shortcut: 'G W',
      icon: GitMerge,
      onSelect: () => onNavigate('workflow'),
    },
    {
      id: 'nav-providers',
      title: 'Go to Integrations & Provider Ecosystem',
      category: 'NAVIGATION',
      shortcut: 'G P',
      icon: Layers,
      onSelect: () => onNavigate('providers'),
    },
    {
      id: 'action-create-sku',
      title: 'Add New Catalog SKU (ERP)',
      category: 'ACTIONS',
      icon: Plus,
      onSelect: () => {
        onNavigate('erp');
        if (onAction) onAction('create-sku');
      },
    },
    {
      id: 'action-create-order',
      title: 'Ingest Omnichannel Order (OMS)',
      category: 'ACTIONS',
      icon: Plus,
      onSelect: () => {
        onNavigate('oms');
        if (onAction) onAction('create-order');
      },
    },
    {
      id: 'action-create-customer',
      title: 'Register Customer Record (CRM)',
      category: 'ACTIONS',
      icon: Plus,
      onSelect: () => {
        onNavigate('crm');
        if (onAction) onAction('create-customer');
      },
    },
    {
      id: 'action-test-ping',
      title: 'Test All Integration Providers Handshake',
      category: 'ACTIONS',
      icon: Zap,
      onSelect: () => {
        onNavigate('providers');
        if (onAction) onAction('test-all-ping');
      },
    },
  ];

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? (filteredItems.length ? filteredItems.length - 1 : 0) : prev - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onSelect();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-start justify-center pt-24 px-4 animate-smooth-fade"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-enterprise-popover overflow-hidden animate-smooth-scale"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search modules..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="font-mono text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-50">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching commands found.
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? 'bg-teal-50 text-teal-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`p-1.5 rounded-lg ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span>{item.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.shortcut && (
                      <kbd className="font-mono text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs">
                        {item.shortcut}
                      </kbd>
                    )}
                    <span className="text-[10px] uppercase font-mono text-slate-400">
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Navigate with ↑ ↓ and press ↵ to select</span>
          <span>UBOP Enterprise OS</span>
        </div>
      </div>
    </div>
  );
};
