import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  BarChart3,
  ShieldCheck,
  Building,
  Package,
} from 'lucide-react';
import { Customer, Order, Product, IntegrationProvider } from '../types';

interface CommandItem {
  id: string;
  title: string;
  category: 'CUSTOMERS' | 'ORDERS' | 'PRODUCTS' | 'PROVIDERS' | 'ACTIONS' | 'NAVIGATION';
  subtitle?: string;
  shortcut?: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, subTab?: string) => void;
  onAction?: (actionId: string) => void;
  customers?: Customer[];
  orders?: Order[];
  products?: Product[];
  providers?: IntegrationProvider[];
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onAction,
  customers = [],
  orders = [],
  products = [],
  providers = [],
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const baseItems: CommandItem[] = useMemo(
    () => [
      {
        id: 'nav-dashboard',
        title: 'Command Center (Executive Pulse)',
        category: 'NAVIGATION',
        shortcut: 'G D',
        icon: LayoutDashboard,
        onSelect: () => onNavigate('dashboard'),
      },
      {
        id: 'nav-crm',
        title: 'Customer Relationship Management (CRM)',
        category: 'NAVIGATION',
        shortcut: 'G C',
        icon: Users,
        onSelect: () => onNavigate('crm', 'CUSTOMERS'),
      },
      {
        id: 'nav-oms',
        title: 'Order Management System (OMS)',
        category: 'NAVIGATION',
        shortcut: 'G O',
        icon: ShoppingCart,
        onSelect: () => onNavigate('oms', 'ORDERS'),
      },
      {
        id: 'nav-erp',
        title: 'Enterprise Resource Planning (ERP)',
        category: 'NAVIGATION',
        shortcut: 'G E',
        icon: Boxes,
        onSelect: () => onNavigate('erp', 'INVENTORY'),
      },
      {
        id: 'nav-bi',
        title: 'Business Intelligence & Telemetry (BI)',
        category: 'NAVIGATION',
        shortcut: 'G B',
        icon: BarChart3,
        onSelect: () => onNavigate('bi', 'OVERVIEW'),
      },
      {
        id: 'nav-workflows',
        title: 'Automation & Visual Flows',
        category: 'NAVIGATION',
        shortcut: 'G W',
        icon: GitMerge,
        onSelect: () => onNavigate('workflow', 'FLOW_CANVAS'),
      },
      {
        id: 'nav-providers',
        title: 'Integrations & Provider Ecosystem',
        category: 'NAVIGATION',
        shortcut: 'G P',
        icon: Layers,
        onSelect: () => onNavigate('providers', 'MARKETPLACE'),
      },
      {
        id: 'nav-settings',
        title: 'Platform Administration & Topology',
        category: 'NAVIGATION',
        icon: ShieldCheck,
        onSelect: () => onNavigate('settings'),
      },
      {
        id: 'action-create-sku',
        title: 'Add New Master Catalog SKU',
        category: 'ACTIONS',
        icon: Plus,
        onSelect: () => {
          onNavigate('erp', 'INVENTORY');
          if (onAction) onAction('create-sku');
        },
      },
      {
        id: 'action-create-order',
        title: 'Ingest Omnichannel Customer Order',
        category: 'ACTIONS',
        icon: Plus,
        onSelect: () => {
          onNavigate('oms', 'ORDERS');
          if (onAction) onAction('create-order');
        },
      },
      {
        id: 'action-create-customer',
        title: 'Register Enterprise Customer Record',
        category: 'ACTIONS',
        icon: Plus,
        onSelect: () => {
          onNavigate('crm', 'CUSTOMERS');
          if (onAction) onAction('create-customer');
        },
      },
      {
        id: 'action-test-ping',
        title: 'Test All Integration Providers Handshake',
        category: 'ACTIONS',
        icon: Zap,
        onSelect: () => {
          onNavigate('providers', 'MARKETPLACE');
          if (onAction) onAction('test-all-ping');
        },
      },
    ],
    [onNavigate, onAction]
  );

  // Dynamic capability-aware search items (Blueprint Section 1.1)
  const dynamicItems: CommandItem[] = useMemo(() => {
    const res: CommandItem[] = [];

    // Customers
    customers.forEach((c) => {
      res.push({
        id: `cust-${c.id}`,
        title: c.name,
        subtitle: `${c.company || 'Enterprise'} · ${c.status} · ${c.email || ''}`,
        category: 'CUSTOMERS',
        icon: Building,
        onSelect: () => onNavigate('crm', 'CUSTOMERS'),
      });
    });

    // Orders
    orders.forEach((o) => {
      res.push({
        id: `ord-${o.id}`,
        title: `${o.order_number} · ${o.customer_name || 'Customer'}`,
        subtitle: `$${o.total_amount.toFixed(2)} · ${o.status} · ${o.items.length} item(s)`,
        category: 'ORDERS',
        icon: ShoppingCart,
        onSelect: () => onNavigate('oms', 'ORDERS'),
      });
    });

    // Products / SKUs
    products.forEach((p) => {
      res.push({
        id: `prod-${p.id}`,
        title: `${p.sku} · ${p.name}`,
        subtitle: `$${p.price.toFixed(2)} · Category: ${p.category || 'HARDWARE'}`,
        category: 'PRODUCTS',
        icon: Package,
        onSelect: () => onNavigate('erp', 'INVENTORY'),
      });
    });

    // Providers
    providers.forEach((prov) => {
      res.push({
        id: `prov-${prov.id}`,
        title: prov.name,
        subtitle: `${prov.category} · Status: ${prov.status} · ${prov.environment}`,
        category: 'PROVIDERS',
        icon: Layers,
        onSelect: () => onNavigate('providers', 'MARKETPLACE'),
      });
    });

    return res;
  }, [customers, orders, products, providers, onNavigate]);

  const allItems = useMemo(() => [...dynamicItems, ...baseItems], [dynamicItems, baseItems]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return baseItems;
    const q = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    );
  }, [allItems, baseItems, query]);

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
        onClose();
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
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-start justify-center pt-20 px-4 animate-smooth-fade"
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
            placeholder="Search customers, orders, SKUs, providers, or commands..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <kbd className="font-mono text-[10px] text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-50">
          {filteredItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching records or commands found for "{query}".
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
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected
                          ? 'bg-teal-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item.title}</div>
                      {item.subtitle && (
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {item.shortcut && (
                      <kbd className="font-mono text-[10px] text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs">
                        {item.shortcut}
                      </kbd>
                    )}
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Navigate with ↑ ↓ and press ↵ to select</span>
          <span>Capability-Aware Search</span>
        </div>
      </div>
    </div>
  );
};
