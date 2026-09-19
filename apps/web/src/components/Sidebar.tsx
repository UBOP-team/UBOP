import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Boxes,
  ShoppingCart,
  GitFork,
  Radio,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  connectedProvidersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  connectedProvidersCount = 4,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const coreNav = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'oms', label: 'Orders', icon: ShoppingCart },
    { id: 'erp', label: 'Inventory', icon: Boxes },
    { id: 'crm', label: 'Customers', icon: Users },
  ];

  const platformNav = [
    { id: 'workflow', label: 'Workflows', icon: GitFork },
    {
      id: 'providers',
      label: 'Integrations',
      icon: Radio,
      badge: `${connectedProvidersCount} live`,
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200/80 flex flex-col justify-between p-3 h-screen sticky top-0 shrink-0 select-none transition-all duration-200 ease-out shadow-[1px_0_2px_rgba(0,0,0,0.02)] ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div>
        {/* Workspace Switcher (Linear style) */}
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
                  <span className="text-[10px] text-slate-400 font-mono">Production</span>
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
          {/* Operations Core */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-mono uppercase text-slate-400 px-2.5 py-1 font-semibold tracking-wider">
                Operations
              </div>
            )}
            <div className="space-y-0.5 mt-0.5">
              {coreNav.map((item) => {
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

          {/* Automation & Platform */}
          <div>
            {!isCollapsed && (
              <div className="text-[10px] font-mono uppercase text-slate-400 px-2.5 py-1 font-semibold tracking-wider">
                Platform
              </div>
            )}
            <div className="space-y-0.5 mt-0.5">
              {platformNav.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                      active
                        ? 'bg-slate-900 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                    title={item.label}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-semibold uppercase ${
                        active ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
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
