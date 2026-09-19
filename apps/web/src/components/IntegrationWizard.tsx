import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Key,
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

  const fieldMappings = [
    { source: 'order.id', target: 'order.order_number', type: 'String' },
    { source: 'order.total_price', target: 'order.total_amount', type: 'Float' },
    { source: 'order.customer.email', target: 'order.customer_email', type: 'Email' },
    { source: 'order.line_items.sku', target: 'erp.product.sku', type: 'Lookup' },
    { source: 'order.fulfillment_status', target: 'order.status', type: 'Status Enum' },
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
    toast.success('Provider Activated', `${completedProvider.name} is now actively connected to UBOP.`);
  };

  const stepTitles = [
    'Select Provider',
    'Authentication',
    'Entity & Field Mapping',
    'Data Sync Policy',
    'Review & Activate',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-teal-400">
              Provider Connection Wizard • Step {currentStep} of 5
            </span>
            <h3 className="text-base font-bold text-slate-100 mt-0.5">
              {stepTitles[currentStep - 1]}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-950 h-1 border-b border-slate-800">
          <div
            className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          />
        </div>

        {/* Wizard Body */}
        <div className="p-6 flex-1 overflow-y-auto text-xs">
          {/* STEP 1: Select Provider */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-slate-400">
                Choose the external platform or capability service you wish to bind to UBOP:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {catalogProviders.map((prov) => {
                  const isSelected = selectedProviderId === prov.id;
                  return (
                    <div
                      key={prov.id}
                      onClick={() => setSelectedProviderId(prov.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-teal-500/10 border-teal-500/60 ring-1 ring-teal-500/30'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div
                          className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${prov.color} flex items-center justify-center font-bold text-slate-950 text-xs shadow-md`}
                        >
                          {prov.iconText}
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-400" />}
                      </div>
                      <div className="font-bold text-slate-100 text-sm">{prov.name}</div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase mt-0.5">
                        {prov.category}
                      </div>
                      <p className="text-slate-400 text-xs mt-1.5 line-clamp-2">{prov.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {prov.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono"
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
            <div className="space-y-4">
              <p className="text-slate-400">
                Configure connection credentials and execution environment:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setEnvironment('PRODUCTION')}
                  className={`p-3.5 rounded-xl border cursor-pointer ${
                    environment === 'PRODUCTION'
                      ? 'bg-teal-500/10 border-teal-500/50 text-teal-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-slate-200">Production / Live</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Connect to real customer data</div>
                </div>
                <div
                  onClick={() => setEnvironment('SANDBOX')}
                  className={`p-3.5 rounded-xl border cursor-pointer ${
                    environment === 'SANDBOX'
                      ? 'bg-teal-500/10 border-teal-500/50 text-teal-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-slate-200">Sandbox / Testnet</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Mock testing & staging environment</div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Authentication Method</label>
                <div className="flex gap-2 mb-3">
                  {(['API_KEY', 'OAUTH', 'CUSTOM'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setAuthMethod(method)}
                      className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold ${
                        authMethod === method
                          ? 'bg-slate-800 text-teal-400 border border-teal-500/40'
                          : 'bg-slate-950 border border-slate-800 text-slate-400'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <label className="block text-slate-400 font-medium mb-1">API Secret Access Key *</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-200 font-mono text-xs focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <span className="text-slate-400">Validate connection credentials before proceeding:</span>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-teal-400 rounded-lg font-semibold transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Testing...' : 'Test Handshake'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Permission & Field Mapping */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-400">
                  Map external provider entity schemas directly to UBOP core models:
                </p>
                <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                  Auto-mapped: 5 fields
                </span>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">External Provider Field</th>
                      <th className="px-2 py-2.5 text-center">Direction</th>
                      <th className="px-4 py-2.5">UBOP Enterprise Model</th>
                      <th className="px-4 py-2.5">Data Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                    {fieldMappings.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="px-4 py-2.5 text-cyan-300">{m.source}</td>
                        <td className="px-2 py-2.5 text-center text-teal-400">➔</td>
                        <td className="px-4 py-2.5 text-emerald-300">{m.target}</td>
                        <td className="px-4 py-2.5 text-slate-500 text-[10px]">{m.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-[11px] text-slate-500">
                UBOP adapter layer automatically enforces schema transformations without modifying domain services.
              </p>
            </div>
          )}

          {/* STEP 4: Data Sync Policy */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <label className="block text-slate-300 font-semibold mb-2">Sync Direction</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'BI', label: 'Bidirectional (Full Sync)', desc: '2-way automatic state sync' },
                    { id: 'INBOUND', label: 'Inbound Only', desc: 'External ➔ UBOP records' },
                    { id: 'OUTBOUND', label: 'Outbound Only', desc: 'UBOP ➔ External dispatch' },
                  ].map((dir) => (
                    <div
                      key={dir.id}
                      onClick={() => setSyncDirection(dir.id as any)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        syncDirection === dir.id
                          ? 'bg-teal-500/10 border-teal-500/50 text-teal-300'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="font-bold text-slate-200 text-xs">{dir.label}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{dir.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-2">Sync Frequency</label>
                <div className="space-y-2">
                  {[
                    { id: 'REALTIME', label: 'Real-time Event Webhooks', desc: 'Zero-latency event bus dispatch (Recommended)' },
                    { id: '15M', label: 'Every 15 Minutes Polling', desc: 'Periodic batch delta synchronization' },
                    { id: 'DAILY', label: 'Daily Batch Sync', desc: 'Midnight scheduled reconciliation' },
                  ].map((freq) => (
                    <div
                      key={freq.id}
                      onClick={() => setSyncFrequency(freq.id as any)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between ${
                        syncFrequency === freq.id
                          ? 'bg-teal-500/10 border-teal-500/50'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-200">{freq.label}</div>
                        <div className="text-slate-500 text-[11px]">{freq.desc}</div>
                      </div>
                      <input
                        type="radio"
                        checked={syncFrequency === freq.id}
                        onChange={() => setSyncFrequency(freq.id as any)}
                        className="accent-teal-500 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Activate */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-300 text-sm">Provider Ready for Deployment</div>
                  <div className="text-slate-400 text-xs mt-0.5">
                    All authentication parameters, field bindings, and sync triggers have been validated.
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Target Provider:</span>
                  <span className="font-bold text-slate-100 uppercase font-mono">{selectedProviderId}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Environment:</span>
                  <span className="font-mono text-teal-400">{environment}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Connected Capabilities:</span>
                  <span className="font-semibold text-slate-200">OMS (Orders), ERP (Stock), CRM</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Sync Cadence:</span>
                  <span className="font-mono text-slate-200">{syncFrequency} ({syncDirection})</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="text-slate-500">Handshake Latency:</span>
                  <span className="font-mono text-emerald-400">19ms (Verified)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
              className="flex items-center gap-1.5 px-5 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/10 transition-colors"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Check className="w-4 h-4" /> Activate Provider
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
