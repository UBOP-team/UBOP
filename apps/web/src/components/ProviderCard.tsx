import React from 'react';
import {
  Sliders,
  Radio,
  Check,
  Zap,
} from 'lucide-react';
import { IntegrationProvider } from '../types';

export interface ProviderCardProps {
  provider: IntegrationProvider;
  onConfigure: (provider: IntegrationProvider) => void;
  onConnect?: (provider: IntegrationProvider) => void;
  onTestPing?: (provider: IntegrationProvider) => void;
  isTesting?: boolean;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  provider,
  onConfigure,
  onConnect,
  onTestPing,
  isTesting = false,
}) => {
  const isConnected = provider.status === 'CONNECTED';
  const isConfigured = provider.status === 'CONFIGURED';

  // Extract or synthesize capabilities
  const capabilities = [
    'Orders & Ingestion Sync',
    'Catalog Schema Mapping',
    'Real-time EventBus Dispatch',
  ];

  return (
    <div className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden shadow-md">
      {/* Top Banner & Status */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${provider.accentColor} p-0.5 flex items-center justify-center shadow-lg`}
          >
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-slate-100 text-sm">
              {provider.name.substring(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                  : isConfigured
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800/60 text-slate-400 border border-slate-700/60'
              }`}
            >
              {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              {provider.status}
            </span>

            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
              {provider.environment}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-slate-100 group-hover:text-teal-400 transition-colors">
            {provider.name}
          </h3>
          <span className="text-[10px] font-mono text-slate-500 uppercase">
            {provider.category}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {provider.description}
        </p>

        {/* Feature Capabilities Checklist */}
        <div className="mt-3.5 space-y-1.5 pt-3 border-t border-slate-800/60">
          {capabilities.map((cap, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-300">
              <Check className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{cap}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Latency & Actions */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3 font-mono">
          <span>Latency: {provider.latencyMs ? `${provider.latencyMs}ms` : 'Untested'}</span>
          <span>Sync: {provider.autoSync ? 'Auto' : 'Manual'}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {onTestPing && (
            <button
              onClick={() => onTestPing(provider)}
              disabled={isTesting}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              <Radio className={`w-3.5 h-3.5 text-teal-400 ${isTesting ? 'animate-pulse' : ''}`} />
              {isTesting ? 'Pinging...' : 'Test Ping'}
            </button>
          )}

          {isConnected ? (
            <button
              onClick={() => onConfigure(provider)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-xl text-xs font-medium transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" /> Configure
            </button>
          ) : (
            <button
              onClick={() => (onConnect ? onConnect(provider) : onConfigure(provider))}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
