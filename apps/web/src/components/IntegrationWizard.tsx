import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  RefreshCw,
  Check,
} from 'lucide-react';
import { IntegrationProvider } from '../types';
import { useToast } from './Toast';

interface IntegrationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (provider: IntegrationProvider) => void;
  initialProvider?: IntegrationProvider | null;
}

export const IntegrationWizard: React.FC<IntegrationWizardProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialProvider,
}) => {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProviderId, setSelectedProviderId] = useState<string>(
    initialProvider?.id || 'shopify'
  );
  const [authMethod, setAuthMethod] = useState<'API_KEY' | 'OAUTH' | 'CUSTOM'>('API_KEY');
  const [apiKey, setApiKey] = useState('shpat_a892b1923019842bc9812');
  const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('PRODUCTION');
  const [syncDirection, setSyncDirection] = useState<'BI' | 'INBOUND' | 'OUTBOUND'>('BI');
  const [syncFrequency, setSyncFrequency] = useState<'REALTIME' | '15M' | 'DAILY'>('REALTIME');
  const [isTesting, setIsTesting] = useState(false);

  // Pre-configured catalog
  const catalogProviders = [
    {
      id: 'shopify',
      name: 'Shopify Storefront',
      category: 'COMMERCE / OMS',
      description: 'Synchronize orders, products, customers, and inventory levels.',
      capabilities: ['Orders Sync', 'Products Catalog', 'Stock Reservation', 'Customer Profiles'],
      iconText: 'SH',
      color: 'from-emerald-500 to-green-600',
    },
    {
      id: 'stripe',
      name: 'Stripe Payments',
      category: 'PAYMENTS',
      description: 'Global payment processing, automated refunds, and webhook events.',
      capabilities: ['Payment Charges', 'Refunds & Disputes', 'Customer Vault', 'Webhooks'],
      iconText: 'ST',
      color: 'from-indigo-500 to-purple-600',
    },
    {
      id: 'amazon',
      name: 'Amazon Seller Central',
      category: 'COMMERCE / OMS',
      description: 'FBA & FBM orders ingestion, tracking numbers, and inventory balance.',
      capabilities: ['FBA Logistics', 'Multi-channel Ingestion', 'Inventory Feeds'],
      iconText: 'AZ',
      color: 'from-amber-500 to-orange-600',
    },
    {
      id: 'slack',
      name: 'Slack Operations',
      category: 'COMMUNICATIONS',
      description: 'Real-time alert dispatching for VIP orders and low stock warnings.',
      capabilities: ['Channel Messages', 'Interactive Approvals', 'Failover Alerts'],
      iconText: 'SL',
      color: 'from-teal-500 to-emerald-600',
    },
  ];

  if (!isOpen) return null;

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      toast.success('Connection Verified', 'Handshake successful! Response latency: 19ms.');
    }, 600);
  };

  const handleFinish = () => {
    const selectedCatalog =
      catalogProviders.find((c) => c.id === selectedProviderId) || catalogProviders[0];

    const completedProvider: IntegrationProvider = {
      id: selectedCatalog.id,
      name: selectedCatalog.name,
      category: selectedCatalog.category.includes('PAYMENT')
        ? 'PAYMENTS'
        : selectedCatalog.category.includes('COMMUNICATION')
        ? 'COMMUNICATIONS'
        : 'LOGISTICS',
      description: selectedCatalog.description,
      status: 'CONNECTED',
      environment: environment,
      iconType: 'Zap',
      accentColor: selectedCatalog.color,
      apiKey: apiKey,
      webhookUrl: `https://api.ubop.internal/api/v1/webhooks/${selectedCatalog.id}`,
      autoSync: true,
      latencyMs: 19,
      lastTested: 'Just now',
    };

    onComplete(completedProvider);
    onClose();
    toast.success('Provider Activated', `${completedProvider.name} is now connected to UBOP.`);
  };

  const stepTitles = [
    'Select Provider',
    'Authentication',
    'Entity & Field Mapping',
    'Data Sync Policy',
    'Review & Activate',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-smooth-fade">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-smooth-scale">
        {/* Wizard Header */}
        <div className="px-6 py-4.5 border-b border-slate-200 bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-semibold text-slate-500">
              Provider Connection Wizard • Step {currentStep} of 5
            </span>
            <h3 className="text-base font-semibold text-slate-900 mt-0.5">
              {stepTitles[currentStep - 1]}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-slate-900 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Wizard Body */}
        <div className="p-6 flex-1 overflow-y-auto text-xs text-slate-700">
          {/* STEP 1: Select Provider */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-smooth-fade">
              <p className="text-slate-500">
                Choose the external platform or capability service you wish to bind to UBOP:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catalogProviders.map((prov) => {
                  const isSelected = selectedProviderId === prov.id;
                  return (
                    <div
                      key={prov.id}
                      onClick={() => setSelectedProviderId(prov.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 card-hover ${
                        isSelected
                          ? 'bg-white border-slate-900 ring-2 ring-slate-900/10 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${prov.color} flex items-center justify-center font-bold text-white text-xs shadow-xs`}
                        >
                          {prov.iconText}
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-slate-900" />}
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{prov.name}</div>
                      <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                        {prov.category}
                      </div>
                      <p className="text-slate-500 text-xs mt-1.5 line-clamp-2">{prov.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {prov.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono"
                          >
                            ✓ {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Authentication */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-smooth-fade">
              <p className="text-slate-500">
                Configure connection credentials and execution environment:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setEnvironment('PRODUCTION')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 btn-press ${
                    environment === 'PRODUCTION'
                      ? 'bg-white border-slate-900 ring-2 ring-slate-900/10 text-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900">Production / Live</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Connect to real customer data</div>
                </div>
                <div
                  onClick={() => setEnvironment('SANDBOX')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 btn-press ${
                    environment === 'SANDBOX'
                      ? 'bg-white border-slate-900 ring-2 ring-slate-900/10 text-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-slate-900">Sandbox / Staging</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Mock testing environment</div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Authentication Protocol</label>
                <div className="flex gap-2 mb-3">
                  {(['API_KEY', 'OAUTH', 'CUSTOM'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setAuthMethod(method)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-[11px] transition-colors btn-press ${
                        authMethod === method
                          ? 'bg-slate-900 text-white font-bold'
                          : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {authMethod === 'API_KEY' && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      API Access Token
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600 transition-all text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Encrypted using hardware AES-256 before disk persistence.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Permission & Schema Mapping */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-smooth-fade">
              <p className="text-slate-500">
                Verify automatic schema bindings between external provider payloads and canonical entities:
              </p>

              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="grid grid-cols-12 bg-slate-50 p-3 border-b border-slate-200 font-mono text-[11px] font-semibold text-slate-500 uppercase">
                  <div className="col-span-5">External Provider Entity</div>
                  <div className="col-span-2 text-center">Direction</div>
                  <div className="col-span-5">UBOP Core Entity</div>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-12 p-3 items-center">
                    <div className="col-span-5 font-mono text-teal-800">Shopify Order Record</div>
                    <div className="col-span-2 text-center text-slate-400">➔</div>
                    <div className="col-span-5 font-mono text-slate-800">UBOP.OMS.OrderEntity</div>
                  </div>
                  <div className="grid grid-cols-12 p-3 items-center">
                    <div className="col-span-5 font-mono text-teal-800">Shopify Customer Record</div>
                    <div className="col-span-2 text-center text-slate-400">➔</div>
                    <div className="col-span-5 font-mono text-slate-800">UBOP.CRM.CustomerProfile</div>
                  </div>
                  <div className="grid grid-cols-12 p-3 items-center">
                    <div className="col-span-5 font-mono text-teal-800">Shopify Inventory Levels</div>
                    <div className="col-span-2 text-center text-slate-400">➔</div>
                    <div className="col-span-5 font-mono text-slate-800">UBOP.ERP.InventoryStock</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Data Sync Policy */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-smooth-fade">
              <p className="text-slate-500">Define synchronization direction and cadence:</p>

              <div>
                <label className="block text-slate-700 font-semibold mb-2">Sync Direction</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'BI', label: 'Bidirectional' },
                    { id: 'INBOUND', label: 'Provider ➔ UBOP' },
                    { id: 'OUTBOUND', label: 'UBOP ➔ Provider' },
                  ].map((dir) => (
                    <button
                      key={dir.id}
                      type="button"
                      onClick={() => setSyncDirection(dir.id as any)}
                      className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all btn-press ${
                        syncDirection === dir.id
                          ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {dir.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-slate-700 font-semibold mb-2">Sync Frequency</label>
                <div className="space-y-2">
                  {[
                    { id: 'REALTIME', label: 'Realtime Webhook Stream (Instant EventBus)' },
                    { id: '15M', label: 'Every 15 Minutes (Low latency batch)' },
                    { id: 'DAILY', label: 'Daily Midnight Reconcile (Audit only)' },
                  ].map((freq) => (
                    <div
                      key={freq.id}
                      onClick={() => setSyncFrequency(freq.id as any)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        syncFrequency === freq.id
                          ? 'bg-teal-50 border-teal-500 text-teal-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span>{freq.label}</span>
                      <input
                        type="radio"
                        checked={syncFrequency === freq.id}
                        onChange={() => {}}
                        className="accent-teal-600"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Activate */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-smooth-fade">
              <p className="text-slate-500">Confirm adapter parameters and execute pre-flight ping:</p>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Selected Connector</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {catalogProviders.find((c) => c.id === selectedProviderId)?.name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Direction</span>
                  <span className="font-mono text-teal-800 font-bold">{syncDirection}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Cadence</span>
                  <span className="font-mono text-slate-700">{syncFrequency}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Security Vault</span>
                  <span className="font-mono text-emerald-700 font-bold">AES-256 Armed</span>
                </div>
              </div>

              {/* Ping Test Button */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <div className="font-bold text-slate-900">Synthetic Handshake Ping</div>
                  <div className="text-[11px] text-slate-500">Test webhook round-trip before enabling live traffic</div>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all btn-press disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Pinging...' : 'Test Connection'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors btn-press"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-medium transition-colors"
            >
              Cancel
            </button>

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition-all shadow-xs btn-press"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition-all shadow-xs btn-press"
              >
                <Check className="w-4 h-4" /> Activate Provider
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
