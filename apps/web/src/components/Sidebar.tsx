import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Boxes,
  ShoppingCart,
  GitFork,
  Radio,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  BarChart3,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

export interface NavSubItem {
  id: string;
  label: string;
}

export interface NavModule {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  children?: NavSubItem[];
}

interface SidebarProps {
  currentTab: string;
  currentSubTab?: string;
  onTabChange: (tab: string, subTab?: string) => void;
  connectedProvidersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  currentSubTab,
  onTabChange,
  connectedProvidersCount = 4,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    crm: true,
    oms: true,
    erp: true,
    bi: false,
    workflow: false,
  });

  const toggleExpand = (modId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  // 1. Command Center
  const commandCenterNav: NavModule[] = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
  ];

  // 2. Business Modules (Blueprint Section 1.2)
  const businessModulesNav: NavModule[] = [
    {
      id: 'crm',
      label: 'CRM',
      icon: Users,
      children: [
        { id: 'OVERVIEW', label: 'Overview' },
        { id: 'LEADS', label: 'Leads' },
        { id: 'ACCOUNTS', label: 'Accounts' },
        { id: 'CONTACTS', label: 'Contacts' },
        { id: 'OPPORTUNITIES', label: 'Opportunities' },
        { id: 'ACTIVITIES', label: 'Activities' },
      ],
    },
    {
      id: 'oms',
      label: 'OMS',
      icon: ShoppingCart,
      children: [
        { id: 'OVERVIEW', label: 'Overview' },
        { id: 'ORDERS', label: 'Orders Index' },
        { id: 'PRODUCTS', label: 'Products' },
        { id: 'FULFILLMENT', label: 'Fulfillment & Carrier' },
        { id: 'RETURNS', label: 'Returns & Refunds' },
      ],
    },
    {
      id: 'erp',
      label: 'ERP',
      icon: Boxes,
      children: [
        { id: 'OVERVIEW', label: 'Overview' },
        { id: 'INVENTORY', label: 'Inventory & SKUs' },
        { id: 'MOVEMENTS', label: 'Movement Audit Trail' },
        { id: 'FINANCE', label: 'General Ledger' },
      ],
    },
    {
      id: 'bi',
      label: 'BI & Telemetry',
      icon: BarChart3,
      children: [
        { id: 'OVERVIEW', label: 'Dashboard Reader' },
        { id: 'WORKSPACE', label: 'Query Workspace' },
        { id: 'ANALYTICS', label: 'Engine Telemetry' },
      ],
    },
    {
      id: 'workflow',
      label: 'Automation',
      icon: GitFork,
      children: [
        { id: 'FLOW_CANVAS', label: 'Flow Canvas' },
        { id: 'RULES_TABLE', label: 'Rules Registry' },
        { id: 'ANALYTICS', label: 'Run History' },
      ],
    },
  ];

  // 3. Integrations & Administration
  const systemNav: NavModule[] = [
    {
      id: 'providers',
      label: 'Integrations',
      icon: Radio,
      badge: `${connectedProvidersCount} live`,
      children: [
        { id: 'MARKETPLACE', label: 'Provider Hub' },
        { id: 'CUSTOM', label: 'Custom Studio' },
      ],
    },
    { id: 'settings', label: 'Administration', icon: ShieldCheck },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200/80 flex flex-col justify-between p-3 h-screen sticky top-0 shrink-0 select-none transition-all duration-200 ease-out shadow-[1px_0_2px_rgba(0,0,0,0.02)] overflow-y-auto ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div>
        {/* Workspace Switcher Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center font-bold text-white shadow-xs shrink-0 text-xs">
              U
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 tracking-tight truncate">
                    UBOP Platform
                  </span>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-slate-400 font-mono">Production OS</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors btn-press ml-1"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Tree Navigation */}
        <nav className="space-y-4 text-xs">
          {/* Section 1: Overview */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-mono uppercase text-slate-400 px-2.5 py-1 font-semibold tracking-wider">
                Command
              </div>
            )}
            <div className="space-y-0.5 mt-0.5">
              {commandCenterNav.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      active
                        ? 'bg-slate-900 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                    title={item.label}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Business Modules */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-mono uppercase text-slate-400 px-2.5 py-1 font-semibold tracking-wider">
                Business Modules
              </div>
            )}
            <div className="space-y-1 mt-0.5">
              {businessModulesNav.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedModules[item.id] ?? false;

                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                        active && (!hasChildren || isCollapsed)
                          ? 'bg-slate-900 text-white shadow-xs font-semibold'
                          : active
                          ? 'bg-slate-100/90 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                      title={item.label}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${active && !hasChildren ? 'text-white' : 'text-slate-500'}`} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && hasChildren && (
                        <div
                          onClick={(e) => toggleExpand(item.id, e)}
                          className="p-0.5 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-150 ${
                              isExpanded ? 'rotate-0' : '-rotate-90'
                            }`}
                          />
                        </div>
                      )}
                    </button>

                    {/* Sub-navigation items */}
                    {!isCollapsed && hasChildren && isExpanded && (
                      <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l border-slate-200/80 ml-4">
                        {item.children!.map((sub) => {
                          const isSubActive = active && currentSubTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => onTabChange(item.id, sub.id)}
                              className={`w-full text-left px-2 py-1 rounded-md text-[11px] transition-colors block truncate ${
                                isSubActive
                                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                              }`}
                            >
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Integrations & Administration */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-mono uppercase text-slate-400 px-2.5 py-1 font-semibold tracking-wider">
                Platform & Connectors
              </div>
            )}
            <div className="space-y-1 mt-0.5">
              {systemNav.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedModules[item.id] ?? false;

                return (
                  <div key={item.id} className="space-y-0.5">
                    <button
                      onClick={() => onTabChange(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                        active && (!hasChildren || isCollapsed)
                          ? 'bg-slate-900 text-white shadow-xs font-semibold'
                          : active
                          ? 'bg-slate-100/90 text-slate-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                      title={item.label}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${active && !hasChildren ? 'text-white' : 'text-slate-500'}`} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </div>

                      {!isCollapsed && (
                        <div className="flex items-center gap-1.5">
                          {item.badge && (
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-semibold uppercase ${
                                active ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {hasChildren && (
                            <div
                              onClick={(e) => toggleExpand(item.id, e)}
                              className="p-0.5 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700 transition-colors"
                            >
                              <ChevronDown
                                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                                  isExpanded ? 'rotate-0' : '-rotate-90'
                                }`}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </button>

                    {!isCollapsed && hasChildren && isExpanded && (
                      <div className="pl-6 pr-1 py-0.5 space-y-0.5 border-l border-slate-200/80 ml-4">
                        {item.children!.map((sub) => {
                          const isSubActive = active && currentSubTab === sub.id;
                          return (
                            <button
                              key={sub.id}
                              onClick={() => onTabChange(item.id, sub.id)}
                              className={`w-full text-left px-2 py-1 rounded-md text-[11px] transition-colors block truncate ${
                                isSubActive
                                  ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                              }`}
                            >
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* Footer Status */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        {!isCollapsed && (
          <div className="px-2 py-1.5 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-medium truncate">Apex Global Inc.</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/70 font-semibold">
              Enterprise
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};
