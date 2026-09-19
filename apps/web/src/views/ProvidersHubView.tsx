import React, { useState } from 'react';
import {
  CreditCard,
  MessageSquare,
  Truck,
  Users,
  Code2,
  CheckCircle2,
  Sliders,
  Plus,
  Radio,
  Copy,
  Zap,
  ShieldCheck,
  Check,
  RefreshCw,
} from 'lucide-react';
import { IntegrationProvider, ProviderCategory } from '../types';
import { Modal } from '../components/Modal';
import { Drawer } from '../components/Drawer';
import { useToast } from '../components/Toast';

interface ProvidersHubViewProps {
  providers: IntegrationProvider[];
  onUpdateProvider: (updated: IntegrationProvider) => void;
  onAddCustomProvider: (newProvider: IntegrationProvider) => void;
}

export const ProvidersHubView: React.FC<ProvidersHubViewProps> = ({
  providers,
  onUpdateProvider,
  onAddCustomProvider,
}) => {
  const toast = useToast();
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form for Custom Provider
  const [customForm, setCustomForm] = useState({
    name: '',
    category: 'CUSTOM' as ProviderCategory,
    description: '',
    webhookUrl: '',
    apiKey: '',
    environment: 'SANDBOX' as 'SANDBOX' | 'PRODUCTION',
    customHeaders: '{"X-UBOP-Source": "modular-monolith"}',
  });

  const categories = [
    { id: 'ALL', label: 'All Providers', icon: Zap },
    { id: 'PAYMENTS', label: 'Payment Gateways', icon: CreditCard },
    { id: 'COMMUNICATIONS', label: 'Comms & Alerts', icon: MessageSquare },
    { id: 'LOGISTICS', label: 'Shipping & Logistics', icon: Truck },
    { id: 'CRM', label: 'CRM & Marketing', icon: Users },
    { id: 'CUSTOM', label: 'Custom Adapters', icon: Code2 },
  ];

  const filteredProviders = providers.filter((p) => {
    const matchesCategory = activeCategory === 'ALL' || p.category === activeCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success('Copied to Clipboard', `Copied ${fieldName} successfully.`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestConnection = (provider: IntegrationProvider) => {
    setTestingId(provider.id);
    setTimeout(() => {
      setTestingId(null);
      const simulatedLatency = Math.floor(Math.random() * 30) + 15;
      const updated: IntegrationProvider = {
        ...provider,
        status: 'CONNECTED',
        latencyMs: simulatedLatency,
        lastTested: 'Just now',
      };
      onUpdateProvider(updated);
      if (selectedProvider?.id === provider.id) {
        setSelectedProvider(updated);
      }
      toast.success(
        `${provider.name} Connected`,
        `Handshake successful! Response latency: ${simulatedLatency}ms.`
      );
    }, 800);
  };

  const handleToggleAutoSync = (provider: IntegrationProvider) => {
    const updated: IntegrationProvider = {
      ...provider,
      autoSync: !provider.autoSync,
    };
    onUpdateProvider(updated);
    if (selectedProvider?.id === provider.id) setSelectedProvider(updated);
    toast.info(
      `${provider.name} Updated`,
      `Real-time sync is now ${updated.autoSync ? 'enabled' : 'paused'}.`
    );
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    onUpdateProvider(selectedProvider);
    toast.success('Configuration Saved', `${selectedProvider.name} configuration updated.`);
    setSelectedProvider(null);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const newProv: IntegrationProvider = {
      id: `custom_${Date.now()}`,
      name: customForm.name,
      category: customForm.category,
      description: customForm.description || 'Custom user-defined HTTP/Webhook adapter.',
      status: 'CONFIGURED',
      environment: customForm.environment,
      iconType: 'Code2',
      accentColor: 'from-cyan-500 to-teal-500',
      apiKey: customForm.apiKey,
      webhookUrl: customForm.webhookUrl,
      customHeaders: customForm.customHeaders,
      autoSync: true,
      latencyMs: 25,
      lastTested: 'Configured',
    };
    onAddCustomProvider(newProv);
    setIsCustomModalOpen(false);
    setCustomForm({
      name: '',
      category: 'CUSTOM',
      description: '',
      webhookUrl: '',
      apiKey: '',
      environment: 'SANDBOX',
      customHeaders: '{"X-UBOP-Source": "modular-monolith"}',
    });
    toast.success('Custom Provider Created', `${newProv.name} adapter registered successfully.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 text-[10px] font-mono uppercase font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Provider Adapter Layer
              </span>
              <span className="text-xs text-slate-500">• In-memory & Distributed Handlers</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              Integrations & Provider Ecosystem
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Connect payment gateways, fulfillment couriers, customer engagement channels, or define
              your own custom adapters with decoupled contracts.
            </p>
          </div>

          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Custom Provider
          </button>
        </div>

        {/* Live Provider Health Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Connected Providers</div>
            <div className="text-lg font-bold text-slate-100 mt-0.5">
              {providers.filter((p) => p.status === 'CONNECTED').length} / {providers.length}
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Handshake Health</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 100% Operational
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Avg API Latency</div>
            <div className="text-lg font-bold text-teal-400 font-mono mt-0.5">24ms</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Decoupled Contracts</div>
            <div className="text-lg font-bold text-cyan-400 mt-0.5">Strict Isolation</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  active
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-teal-400' : 'text-slate-500'}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter integrations by name..."
          className="w-full sm:w-64 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
        />
      </div>

      {/* Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProviders.map((provider) => {
          const isConnected = provider.status === 'CONNECTED';
          const isConfigured = provider.status === 'CONFIGURED';
          const isTesting = testingId === provider.id;

          return (
            <div
              key={provider.id}
              className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group backdrop-blur-sm relative overflow-hidden"
            >
              {/* Top Row: Icon, Status Badge */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${provider.accentColor} p-0.5 flex items-center justify-center shadow-lg`}
                  >
                    <div className="w-full h-full bg-slate-950/80 rounded-[10px] flex items-center justify-center font-bold text-slate-100 text-sm">
                      {provider.name.substring(0, 2).toUpperCase()}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                        isConnected
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                          : isConfigured
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
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

                <h3 className="text-base font-bold text-slate-100 group-hover:text-teal-400 transition-colors flex items-center gap-1.5">
                  {provider.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {provider.description}
                </p>
              </div>

              {/* Latency & Actions */}
              <div className="mt-5 pt-4 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3 font-mono">
                  <span>Latency: {provider.latencyMs ? `${provider.latencyMs}ms` : 'Not tested'}</span>
                  <span>Sync: {provider.autoSync ? 'Auto' : 'Manual'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleTestConnection(provider)}
                    disabled={isTesting}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Radio className={`w-3.5 h-3.5 text-teal-400 ${isTesting ? 'animate-pulse' : ''}`} />
                    {isTesting ? 'Pinging...' : 'Test Ping'}
                  </button>

                  <button
                    onClick={() => setSelectedProvider(provider)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5" /> Configure
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide-over Drawer: Provider Configuration */}
      <Drawer
        isOpen={!!selectedProvider}
        onClose={() => setSelectedProvider(null)}
        title={selectedProvider ? `${selectedProvider.name} Adapter Settings` : ''}
        subtitle="Manage authentication credentials, webhook endpoints, and sync policy."
        width="lg"
      >
        {selectedProvider && (
          <form onSubmit={handleSaveConfig} className="space-y-5 text-xs">
            {/* Status & Mode Banner */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-0.5">
                  Connection State
                </span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {selectedProvider.status} • {selectedProvider.latencyMs || 22}ms
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-0.5">
                  Environment
                </span>
                <div className="inline-flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProvider({ ...selectedProvider, environment: 'SANDBOX' })
                    }
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                      selectedProvider.environment === 'SANDBOX'
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'text-slate-400'
                    }`}
                  >
                    Sandbox
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProvider({ ...selectedProvider, environment: 'PRODUCTION' })
                    }
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                      selectedProvider.environment === 'PRODUCTION'
                        ? 'bg-teal-500 text-slate-950 shadow-sm'
                        : 'text-slate-400'
                    }`}
                  >
                    Live / Prod
                  </button>
                </div>
              </div>
            </div>

            {/* API Credentials */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                API Secret Key / Access Token
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={selectedProvider.apiKey || 'sk_test_90a98bce771f2849e7b6d19'}
                  onChange={(e) =>
                    setSelectedProvider({ ...selectedProvider, apiKey: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Encrypted with AES-256 at rest. Passed to internal adapter calls.
              </p>
            </div>

            {/* Inbound Webhook URL */}
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Inbound Webhook Endpoint
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://api.ubop.internal/api/v1/webhooks/${selectedProvider.id}`}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-teal-400 font-mono text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      `https://api.ubop.internal/api/v1/webhooks/${selectedProvider.id}`,
                      'Webhook URL'
                    )
                  }
                  className="px-3 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 transition-colors flex items-center gap-1"
                >
                  {copiedField === 'Webhook URL' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <span className="font-semibold text-slate-200 block">Adapter Capabilities</span>

              <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div>
                  <div className="font-medium text-slate-200">Real-time EventBus Dispatch</div>
                  <div className="text-[11px] text-slate-500">
                    Propagate provider events into OMS and ERP automatically.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={selectedProvider.autoSync}
                  onChange={() => handleToggleAutoSync(selectedProvider)}
                  className="w-4 h-4 accent-teal-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div>
                  <div className="font-medium text-slate-200">Webhook Signature Verification</div>
                  <div className="text-[11px] text-slate-500">
                    Reject payloads that fail cryptographic HMAC signature check.
                  </div>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4 accent-teal-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Test Handshake Section */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span className="text-slate-300 font-medium">Verify Connection</span>
              </div>
              <button
                type="button"
                onClick={() => handleTestConnection(selectedProvider)}
                disabled={testingId === selectedProvider.id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-400 rounded-lg text-xs font-semibold transition-colors"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    testingId === selectedProvider.id ? 'animate-spin' : ''
                  }`}
                />
                {testingId === selectedProvider.id ? 'Testing...' : 'Ping Provider'}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/10 transition-colors"
              >
                Save Settings
              </button>
            </div>
          </form>
        )}
      </Drawer>

      {/* Modal: Create Custom Provider */}
      <Modal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        title="Register Custom Provider Adapter"
      >
        <form onSubmit={handleCreateCustom} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Provider Adapter Name *</label>
            <input
              type="text"
              required
              value={customForm.name}
              onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
              placeholder="e.g. Custom WMS Hub or VNPay Gateway"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Category</label>
              <select
                value={customForm.category}
                onChange={(e) =>
                  setCustomForm({ ...customForm, category: e.target.value as ProviderCategory })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="PAYMENTS">PAYMENTS</option>
                <option value="COMMUNICATIONS">COMMUNICATIONS</option>
                <option value="LOGISTICS">LOGISTICS</option>
                <option value="CRM">CRM</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Environment</label>
              <select
                value={customForm.environment}
                onChange={(e) =>
                  setCustomForm({
                    ...customForm,
                    environment: e.target.value as 'SANDBOX' | 'PRODUCTION',
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="SANDBOX">SANDBOX</option>
                <option value="PRODUCTION">PRODUCTION</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Outbound Target Endpoint URL *</label>
            <input
              type="url"
              required
              value={customForm.webhookUrl}
              onChange={(e) => setCustomForm({ ...customForm, webhookUrl: e.target.value })}
              placeholder="https://warehouse.partner.com/api/v1/sync"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Secret Token / API Key</label>
            <input
              type="text"
              value={customForm.apiKey}
              onChange={(e) => setCustomForm({ ...customForm, apiKey: e.target.value })}
              placeholder="token_live_xxxxxxxxxxxx"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Custom Request Headers (JSON)</label>
            <textarea
              rows={3}
              value={customForm.customHeaders}
              onChange={(e) => setCustomForm({ ...customForm, customHeaders: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCustomModalOpen(false)}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg transition-colors"
            >
              Create Adapter
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
