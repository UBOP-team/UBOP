import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  RefreshCw,
  ChevronRight,
  CheckCheck,
  Trash2,
  ExternalLink,
  Shield,
  Building,
  Mail,
  X,
} from 'lucide-react';
import { AppNotification, UserProfile } from '../types';

interface HeaderProps {
  title: string;
  onRefresh?: () => void;
  loading?: boolean;
  onOpenCommandPalette?: () => void;
  notifications?: AppNotification[];
  onMarkAllNotificationsRead?: () => void;
  onClearNotifications?: () => void;
  onSelectNotification?: (notif: AppNotification) => void;
  userProfile?: UserProfile;
  onUpdateUserProfile?: (profile: UserProfile) => void;
  onNavigate?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onRefresh,
  loading = false,
  onOpenCommandPalette,
  notifications = [],
  onMarkAllNotificationsRead,
  onClearNotifications,
  onSelectNotification,
  userProfile = {
    name: 'Huy Nguyen',
    email: 'huy.nguyen@ubop.internal',
    role: 'Platform Admin',
    avatarInitials: 'HN',
    organization: 'Enterprise Cloud Core',
  },
  onUpdateUserProfile,
  onNavigate,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspace, setWorkspace] = useState('Apex Global (US-Production)');

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node)) {
        setIsWorkspaceOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors duration-200">
      {/* Enterprise Breadcrumbs & Workspace Switcher (Blueprint Section 1.1) */}
      <div className="flex items-center gap-2 text-xs">
        <div className="relative" ref={workspaceRef}>
          <button
            onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-semibold transition-colors border border-slate-200/80 shadow-2xs cursor-pointer"
          >
            <span className="truncate max-w-[140px]">{workspace}</span>
            <ChevronRight className={`w-3 h-3 text-slate-400 transition-transform ${isWorkspaceOpen ? '-rotate-90' : 'rotate-90'}`} />
          </button>
          {isWorkspaceOpen && (
            <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-smooth-fade">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 font-semibold border-b border-slate-100">
                Switch Workspace (Tenant)
              </div>
              {[
                { name: 'Apex Global (US-Production)', region: 'us-east-1 · Primary' },
                { name: 'Apex Europe B.V. (EU-Staging)', region: 'eu-central-1 · Staging' },
                { name: 'Sandbox / Local Dev', region: 'localhost · Isolated' },
              ].map((ws) => (
                <button
                  key={ws.name}
                  onClick={() => {
                    setWorkspace(ws.name);
                    setIsWorkspaceOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-50 transition-colors ${
                    workspace === ws.name ? 'bg-teal-50/60 font-semibold text-teal-900' : 'text-slate-700'
                  }`}
                >
                  <span>{ws.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{ws.region}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <h2 className="text-xs font-semibold text-slate-900 tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        {/* Provider Sync Indicator (Blueprint Section 1.1) */}
        <button
          onClick={() => onNavigate && onNavigate('providers')}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
          title="Provider Sync Status & Connectivity"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sync: Healthy</span>
          <span className="text-emerald-500 font-normal">· 8 Connected</span>
        </button>

        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="flex items-center justify-between w-56 bg-slate-50 hover:bg-slate-100/90 border border-slate-200/90 rounded-lg px-2.5 py-1 text-xs text-slate-400 transition-all shadow-xs btn-press cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-normal">Jump to or search...</span>
          </div>
          <kbd className="font-mono text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-xs">
            ⌘K
          </kbd>
        </button>

        {/* Refresh Action */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-all duration-150 btn-press"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-900' : ''}`} />
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-all duration-150 relative btn-press"
            title="Notifications"
          >
            <Bell className="w-3.5 h-3.5" />
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1 ring-2 ring-white" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-84 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-smooth-fade text-xs">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  {unreadCount > 0 && onMarkAllNotificationsRead && (
                    <button
                      onClick={onMarkAllNotificationsRead}
                      className="text-teal-700 hover:text-teal-800 font-medium flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3 h-3" /> Read all
                    </button>
                  )}
                  {notifications.length > 0 && onClearNotifications && (
                    <button
                      onClick={onClearNotifications}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      title="Clear all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <Bell className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                    No notifications right now.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (onSelectNotification) onSelectNotification(n);
                        if (n.linkTab && onNavigate) {
                          onNavigate(n.linkTab);
                          setIsNotifOpen(false);
                        }
                      }}
                      className={`p-3 transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-2.5 ${
                        !n.read ? 'bg-teal-50/30' : ''
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          n.type === 'SUCCESS'
                            ? 'bg-emerald-500'
                            : n.type === 'WARNING'
                            ? 'bg-amber-500'
                            : n.type === 'ERROR'
                            ? 'bg-rose-500'
                            : 'bg-teal-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 flex items-center justify-between">
                          <span className="truncate">{n.title}</span>
                          <span className="font-mono text-[10px] text-slate-400 font-normal shrink-0 ml-1">
                            {n.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.description}</p>
                        {n.linkTab && (
                          <span className="text-[10px] text-teal-700 font-semibold flex items-center gap-0.5 mt-1">
                            Jump to {n.linkTab.toUpperCase()} <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Popover */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-md bg-slate-900 group-hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center shadow-xs transition-colors">
              {userProfile.avatarInitials}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-900 leading-tight group-hover:text-teal-700 transition-colors">
                {userProfile.name}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">{userProfile.role}</div>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-smooth-fade text-xs p-4 space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {userProfile.avatarInitials}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{userProfile.name}</h4>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" /> {userProfile.email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                  Organization & Scope
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-[11px] text-slate-700">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">{userProfile.organization}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold">
                  Active RBAC Role Switcher
                </div>
                <select
                  value={userProfile.role}
                  onChange={(e) => {
                    if (onUpdateUserProfile) {
                      onUpdateUserProfile({
                        ...userProfile,
                        role: e.target.value as any,
                      });
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-teal-500"
                >
                  <option value="Platform Admin">Platform Admin (Full Access)</option>
                  <option value="Operations Manager">Operations Manager (OMS & ERP)</option>
                  <option value="Financial Controller">Financial Controller (Ledger & BI)</option>
                  <option value="Security Auditor">Security Auditor (Read Only + Audit)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => {
                    if (onNavigate) onNavigate('settings');
                    setIsProfileOpen(false);
                  }}
                  className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1"
                >
                  <Shield className="w-3.5 h-3.5" /> Platform Governance
                </button>
                <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Online
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
