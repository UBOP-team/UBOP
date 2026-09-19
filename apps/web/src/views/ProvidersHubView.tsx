import React, { useState } from 'react';
import {
  CreditCard,
  MessageSquare,
  Truck,
  Users,
  Code2,
  CheckCircle2,
  Plus,
  Copy,
  Zap,
  ShieldCheck,
  Check,
  RefreshCw,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { IntegrationProvider } from '../types';
import { Drawer } from '../components/Drawer';
import { useToast } from '../components/Toast';
import { IntegrationWizard } from '../components/IntegrationWizard';
import { CustomProviderStudio } from '../components/CustomProviderStudio';
import { ProviderCard } from '../components/ProviderCard';

interface ProvidersHubViewProps {
  providers: IntegrationProvider[];
  onUpdateProvider: (updated: IntegrationProvider) => void;
  onAddCustomProvider: (newProvider: IntegrationProvider) => void;
}

export interface BusinessCapabilityBinding {
  capabilityId: string;
  name: string;
  module: 'OMS' | 'CRM' | 'ERP' | 'BI' | 'WORKFLOW';
  description: string;
  activeProviderId: string;
  availableProviderIds: string[];
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
  const [testingId, setTestingId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Modals / Wizards
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardTargetProvider, setWizardTargetProvider] = useState<IntegrationProvider | null>(null);
  const [isCustomStudioOpen, setIsCustomStudioOpen] = useState(false);

  // Business Capability Bindings ("Business Capability + Provider Selection")
  const [capabilities, setCapabilities] = useState<BusinessCapabilityBinding[]>([
    {
      capabilityId: 'order_management',
      name: 'Order Management Capability',
      module: 'OMS',
      description: 'Omnichannel order ingestion, status state-machine, and fulfillment sync.',
      activeProviderId: 'shopify',
      availableProviderIds: ['shopify', 'amazon', 'internal_oms', 'custom_wms'],
    },
    {
      capabilityId: 'customer_data',
      name: 'Customer Data Platform (CDP)',
      module: 'CRM',
      description: 'Unified customer profiles, activity timelines, and contact history.',
      activeProviderId: 'internal_crm',
      availableProviderIds: ['internal_crm', 'salesforce', 'hubspot'],
    },
    {
      capabilityId: 'inventory_warehousing',
      name: 'Warehouse & Inventory Control',
      module: 'ERP',
      description: 'Stock on hand, bin reservations, ATP calculation, and replenishment.',
      activeProviderId: 'internal_erp',
      availableProviderIds: ['internal_erp', 'sap_fiori', 'custom_wms'],
    },
    {
      capabilityId: 'payment_processing',
      name: 'Payment Processing & Escrow',
      module: 'OMS',
      description: 'Credit card capture, settlement, refunds, and fraud verification.',
      activeProviderId: 'stripe',
      availableProviderIds: ['stripe', 'paypal', 'internal_mock_pay'],
    },
    {
      capabilityId: 'event_notification',
      name: 'Operations Dispatch & Alerts',
      module: 'WORKFLOW',
      description: 'Real-time alert routing, incident webhooks, and SMS dispatch.',
      activeProviderId: 'slack',
      availableProviderIds: ['slack', 'twilio', 'internal_alerts'],
    },
  ]);

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

  const handleSwitchCapabilityProvider = (capabilityId: string, newProviderId: string) => {
    setCapabilities((prev) =>
      prev.map((cap) =>
        cap.capabilityId === capabilityId ? { ...cap, activeProviderId: newProviderId } : cap
      )
    );
    const cap = capabilities.find((c) => c.capabilityId === capabilityId);
    toast.success(
      'Capability Provider Switched',
      `${cap?.name} is now powered by ${newProviderId.toUpperCase()}.`
    );
  };

  const handleOpenConnectWizard = (provider?: IntegrationProvider) => {
    setWizardTargetProvider(provider || null);
    setIsWizardOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 text-[10px] font-mono uppercase font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                Integration Provider Layer
              </span>
              <span className="text-xs text-slate-500">• Composable Architecture</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
              Provider Integration & Capability Hub
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Decouple business capabilities from technical implementations. Select pre-built connectors
              from the marketplace or design custom REST adapters with schema mapping.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsCustomStudioOpen(true)}
              className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-sm"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              Create Custom Provider
            </button>

            <button
              onClick={() => handleOpenConnectWizard()}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-teal-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Capability Provider
            </button>
          </div>
        </div>

        {/* Live Provider Health Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Connected Providers</div>
            <div className="text-lg font-bold text-slate-100 mt-0.5">
              {providers.filter((p) => p.status === 'CONNECTED').length} / {providers.length}
            </div>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Handshake Health</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 100% Operational
            </div>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Avg API Latency</div>
            <div className="text-lg font-bold text-teal-400 font-mono mt-0.5">24ms</div>
          </div>
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="text-[11px] text-slate-400 uppercase font-medium">Decoupled Isolation</div>
            <div className="text-lg font-bold text-cyan-400 mt-0.5">Zero Lock-In</div>
          </div>
        </div>
      </div>

      {/* CORE UX SECTION: "Business Capability + Provider Selection" */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/30">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-100">
                Business Capability Selection Matrix
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Choose which underlying adapter powers each operational domain. The user interface and
              data models remain unified.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {capabilities.map((cap) => {
            return (
              <div
                key={cap.capabilityId}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-slate-900 text-teal-400 border border-slate-800">
                      {cap.module} MODULE
                    </span>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Bound & Active
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100">{cap.name}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-snug">{cap.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-slate-500 block">
                    Active Provider Adapter
                  </span>

                  <select
                    value={cap.activeProviderId}
                    onChange={(e) =>
                      handleSwitchCapabilityProvider(cap.capabilityId, e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                  >
                    {cap.availableProviderIds.map((pId) => (
                      <option key={pId} value={pId}>
                        {pId.replace(/_/g, ' ').toUpperCase()} (Ready)
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                    <span>Failover Policy: Automatic</span>
                    <button
                      type="button"
                      onClick={() => handleOpenConnectWizard()}
                      className="text-teal-400 hover:text-teal-300 font-sans font-semibold"
                    >
                      Change Setup →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION: Provider Marketplace & Active Adapters */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Provider Adapter Marketplace & Directory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Connect external platforms, configure secrets, and inspect real-time ping latency.
            </p>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search providers (e.g. Shopify, Stripe)..."
            className="w-full sm:w-64 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-teal-400' : 'text-slate-500'}`} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onConfigure={(p) => setSelectedProvider(p)}
              onConnect={(p) => handleOpenConnectWizard(p)}
              onTestPing={(p) => handleTestConnection(p)}
              isTesting={testingId === provider.id}
            />
          ))}
        </div>
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

      {/* 5-Step Integration Wizard Modal */}
      <IntegrationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialProvider={wizardTargetProvider}
        onComplete={(newProv) => {
          onAddCustomProvider(newProv);
          setIsWizardOpen(false);
          toast.success(
            'Provider Successfully Connected',
            `${newProv.name} has completed handshake and is actively syncing.`
          );
        }}
      />

      {/* Custom Provider Studio Modal */}
      <CustomProviderStudio
        isOpen={isCustomStudioOpen}
        onClose={() => setIsCustomStudioOpen(false)}
        onActivate={(newProv) => {
          onAddCustomProvider(newProv);
          setIsCustomStudioOpen(false);
        }}
      />
    </div>
  );
};
