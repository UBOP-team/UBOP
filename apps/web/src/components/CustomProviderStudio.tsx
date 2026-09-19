import React, { useState } from 'react';
import {
  Code2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  Trash2,
  Play,
  Check,
  Cpu,
  Layers,
} from 'lucide-react';
import { IntegrationProvider, ProviderCategory } from '../types';
import { useToast } from './Toast';

interface FieldMapping {
  id: string;
  externalField: string;
  externalType: string;
  ubopField: string;
  ubopType: string;
  transformation: 'DIRECT' | 'LOWERCASE' | 'UPPERCASE' | 'PARSE_INT' | 'ISO_DATE' | 'CUSTOM';
}

interface CustomProviderStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (provider: IntegrationProvider) => void;
}

export const CustomProviderStudio: React.FC<CustomProviderStudioProps> = ({
  isOpen,
  onClose,
  onActivate,
}) => {
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Basic Information
  const [name, setName] = useState('Internal Warehouse System');
  const [category, setCategory] = useState<ProviderCategory>('LOGISTICS');
  const [description, setDescription] = useState(
    'Enterprise high-density warehouse dispatch adapter with RFID barcode validation.'
  );
  const [environment, setEnvironment] = useState<'SANDBOX' | 'PRODUCTION'>('PRODUCTION');

  // Step 2: API Configuration
  const [baseUrl, setBaseUrl] = useState('https://wms.enterprise.internal/api/v2');
  const [authType, setAuthType] = useState<'API_KEY' | 'OAUTH2' | 'JWT' | 'MTLS'>('API_KEY');
  const [apiKeyHeader, setApiKeyHeader] = useState('X-Warehouse-Api-Key');
  const [apiSecret, setApiSecret] = useState('sec_live_90fbc982a1734bc7e8201');
  const [tokenUrl, setTokenUrl] = useState('https://auth.enterprise.internal/oauth/token');
  const [clientId, setClientId] = useState('ubop_client_service_prod');
  const [customHeaders, setCustomHeaders] = useState('{\n  "X-System-Origin": "UBOP-Core",\n  "Accept-Encoding": "gzip"\n}');

  // Step 3: Data Mapping
  const [entityTarget, setEntityTarget] = useState<'ORDER' | 'CUSTOMER' | 'INVENTORY'>('ORDER');
  const [mappings, setMappings] = useState<FieldMapping[]>([
    {
      id: 'map_1',
      externalField: 'order_number_ext',
      externalType: 'STRING',
      ubopField: 'order.order_number',
      ubopType: 'STRING',
      transformation: 'DIRECT',
    },
    {
      id: 'map_2',
      externalField: 'customer_ext_id',
      externalType: 'INTEGER',
      ubopField: 'order.customer_id',
      ubopType: 'INTEGER',
      transformation: 'PARSE_INT',
    },
    {
      id: 'map_3',
      externalField: 'current_shipment_status',
      externalType: 'STRING',
      ubopField: 'order.status',
      ubopType: 'ENUM',
      transformation: 'UPPERCASE',
    },
    {
      id: 'map_4',
      externalField: 'item_total_cost',
      externalType: 'FLOAT',
      ubopField: 'order.total_amount',
      ubopType: 'DECIMAL',
      transformation: 'DIRECT',
    },
  ]);

  // Step 4: Test Handshake
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    status: number;
    latencyMs: number;
    payloadSnippet: string;
    fieldsMapped: number;
  } | null>(null);

  const steps = [
    { number: 1, title: 'Basic Information', desc: 'Metadata & Category' },
    { number: 2, title: 'API Configuration', desc: 'Auth & Base URL' },
    { number: 3, title: 'Data Schema Mapping', desc: 'Entity Field Bindings' },
    { number: 4, title: 'Test & Activate', desc: 'Handshake & Registration' },
  ];

  if (!isOpen) return null;

  const handleAddMapping = () => {
    const newId = `map_${Date.now()}`;
    setMappings([
      ...mappings,
      {
        id: newId,
        externalField: 'new_attribute',
        externalType: 'STRING',
        ubopField: 'order.shipping_address',
        ubopType: 'STRING',
        transformation: 'DIRECT',
      },
    ]);
  };

  const handleRemoveMapping = (id: string) => {
    if (mappings.length <= 1) {
      toast.info('Mapping Required', 'At least one field mapping is required.');
      return;
    }
    setMappings(mappings.filter((m) => m.id !== id));
  };

  const handleRunTest = () => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        success: true,
        status: 200,
        latencyMs: 38,
        payloadSnippet: JSON.stringify(
          {
            status: 'HEALTHY',
            system: name,
            schema_version: '2.4.1',
            verified_fields: mappings.length,
            records_scanned: 1,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        ),
        fieldsMapped: mappings.length,
      });
      toast.success('Connection Verified', `Handshake with ${name} successful (200 OK in 38ms).`);
    }, 900);
  };

  const handleActivate = () => {
    const createdProvider: IntegrationProvider = {
      id: `custom_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
      name,
      category,
      description,
      status: 'CONNECTED',
      environment,
      iconType: 'Code2',
      accentColor: 'from-cyan-500 to-blue-600',
      apiKey: apiSecret,
      webhookUrl: `${baseUrl}/events`,
      customHeaders,
      autoSync: true,
      latencyMs: testResult?.latencyMs || 42,
      lastTested: 'Just now',
    };

    onActivate(createdProvider);
    toast.success('Custom Provider Activated', `${name} is now live and bonded to UBOP EventBus.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Code2 className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Custom Adapter Studio
                </span>
                <span className="text-xs text-slate-500">• MuleSoft / Workato Spec</span>
              </div>
              <h2 className="text-base font-bold text-slate-100">Create Enterprise Custom Provider</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-4 border-b border-slate-800 bg-slate-950/40 text-xs">
          {steps.map((s) => {
            const isDone = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            return (
              <div
                key={s.number}
                className={`p-3 border-r border-slate-800/80 last:border-r-0 flex items-center gap-2.5 transition-colors ${
                  isCurrent ? 'bg-cyan-500/10 border-b-2 border-b-cyan-400' : ''
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                    isDone
                      ? 'bg-emerald-500 text-slate-950'
                      : isCurrent
                      ? 'bg-cyan-500 text-slate-950 ring-2 ring-cyan-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : s.number}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <div className={`font-semibold truncate ${isCurrent ? 'text-cyan-300' : 'text-slate-300'}`}>
                    {s.title}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-300">
          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-1">Provider Identification</h3>
                <p className="text-slate-400 text-xs">
                  Define the naming convention and operational business module for this integration.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Provider Adapter Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Internal Warehouse WMS"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Operational Domain Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProviderCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="LOGISTICS">OMS / LOGISTICS (Orders & Warehousing)</option>
                    <option value="PAYMENTS">PAYMENTS & BILLING (Gateways & Escrow)</option>
                    <option value="CRM">CRM & MARKETING (Leads & Contacts)</option>
                    <option value="COMMUNICATIONS">COMMUNICATIONS (Slack, SMS, Alerts)</option>
                    <option value="CUSTOM">GENERIC / ENTERPRISE BUS (Custom Protocol)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">Execution Environment</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEnvironment('SANDBOX')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        environment === 'SANDBOX'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Sandbox / Staging
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnvironment('PRODUCTION')}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        environment === 'PRODUCTION'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      Production Live
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">Description & Purpose</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short architectural explanation of adapter"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex items-start gap-3 mt-2">
                <Layers className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Decoupled Adapter Architecture</div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    UBOP standardizes all inbound payloads into canonical business entities. You can
                    switch or replace this adapter without affecting downstream ERP, OMS, or Workflow
                    rules.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: API Configuration */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-1">Network & Security Credentials</h3>
                <p className="text-slate-400 text-xs">
                  Configure upstream REST/GraphQL endpoints, SSL/TLS validation, and authentication tokens.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Base API URL <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.partner.com/v1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">Authentication Protocol</label>
                  <select
                    value={authType}
                    onChange={(e) =>
                      setAuthType(e.target.value as 'API_KEY' | 'OAUTH2' | 'JWT' | 'MTLS')
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="API_KEY">API Key / Static Token Header</option>
                    <option value="OAUTH2">OAuth 2.0 Client Credentials Grant</option>
                    <option value="JWT">JWT Bearer (RSA-256 Signed)</option>
                    <option value="MTLS">Mutual TLS (mTLS Enterprise Certificate)</option>
                  </select>
                </div>

                {authType === 'API_KEY' && (
                  <div>
                    <label className="block font-medium text-slate-300 mb-1.5">Header Name</label>
                    <input
                      type="text"
                      value={apiKeyHeader}
                      onChange={(e) => setApiKeyHeader(e.target.value)}
                      placeholder="X-API-Key or Authorization"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                )}
              </div>

              {authType === 'API_KEY' ? (
                <div>
                  <label className="block font-medium text-slate-300 mb-1.5">
                    Secret Key / Token Value <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Encrypted with Hardware Security Module (HSM) Vault at rest.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1.5">OAuth Token Endpoint</label>
                    <input
                      type="text"
                      value={tokenUrl}
                      onChange={(e) => setTokenUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1.5">Client ID</label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">
                  Static HTTP Request Headers (JSON)
                </label>
                <textarea
                  rows={3}
                  value={customHeaders}
                  onChange={(e) => setCustomHeaders(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-teal-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Data Mapping */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 mb-1">Entity Schema Field Mapping</h3>
                  <p className="text-slate-400 text-xs">
                    Map external JSON attributes to UBOP Canonical Entities.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Target Entity:</span>
                  <select
                    value={entityTarget}
                    onChange={(e) => setEntityTarget(e.target.value as 'ORDER' | 'CUSTOMER' | 'INVENTORY')}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 font-semibold"
                  >
                    <option value="ORDER">Order Entity (OMS)</option>
                    <option value="CUSTOMER">Customer Entity (CRM)</option>
                    <option value="INVENTORY">Inventory Item (ERP)</option>
                  </select>
                </div>
              </div>

              {/* Field Mapping Grid */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                <div className="grid grid-cols-12 bg-slate-950 p-3 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <div className="col-span-4">External Provider Field</div>
                  <div className="col-span-1 text-center">Transform</div>
                  <div className="col-span-6">UBOP Canonical Attribute</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {mappings.map((m) => (
                    <div key={m.id} className="grid grid-cols-12 p-3 items-center gap-2">
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={m.externalField}
                          onChange={(e) =>
                            setMappings(
                              mappings.map((item) =>
                                item.id === m.id ? { ...item, externalField: e.target.value } : item
                              )
                            )
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="col-span-1 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-slate-600" />
                      </div>

                      <div className="col-span-6 flex gap-2">
                        <select
                          value={m.ubopField}
                          onChange={(e) =>
                            setMappings(
                              mappings.map((item) =>
                                item.id === m.id ? { ...item, ubopField: e.target.value } : item
                              )
                            )
                          }
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                        >
                          <option value="order.order_number">order.order_number (String)</option>
                          <option value="order.customer_id">order.customer_id (Int)</option>
                          <option value="order.status">order.status (Enum: PENDING|SHIPPED|...)</option>
                          <option value="order.total_amount">order.total_amount (Decimal)</option>
                          <option value="order.shipping_address">order.shipping_address (String)</option>
                          <option value="order.payment_method">order.payment_method (String)</option>
                          <option value="customer.email">customer.email (String)</option>
                          <option value="inventory.quantity">inventory.quantity (Int)</option>
                        </select>

                        <select
                          value={m.transformation}
                          onChange={(e) =>
                            setMappings(
                              mappings.map((item) =>
                                item.id === m.id
                                  ? {
                                      ...item,
                                      transformation: e.target.value as FieldMapping['transformation'],
                                    }
                                  : item
                              )
                            )
                          }
                          className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] font-mono text-teal-400"
                        >
                          <option value="DIRECT">Direct</option>
                          <option value="UPPERCASE">Uppercase</option>
                          <option value="LOWERCASE">Lowercase</option>
                          <option value="PARSE_INT">Parse Int</option>
                          <option value="ISO_DATE">ISO Date</option>
                        </select>
                      </div>

                      <div className="col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveMapping(m.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddMapping}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-cyan-400 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Field Mapping
              </button>
            </div>
          )}

          {/* STEP 4: Test Connection & Activation */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-100 mb-1">Pre-Activation Validation</h3>
                <p className="text-slate-400 text-xs">
                  Execute a synthetic health-probe request to verify authentication, schema contracts,
                  and network latency.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Adapter</span>
                  <span className="font-bold text-slate-200">{name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Domain</span>
                  <span className="font-bold text-cyan-400">{category}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Protocol</span>
                  <span className="font-mono text-slate-300">{authType}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Mapped Fields</span>
                  <span className="font-mono text-emerald-400 font-bold">{mappings.length} Attributes</span>
                </div>
              </div>

              {/* Test Trigger Area */}
              <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    Ping Target Base URL
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{baseUrl}</div>
                </div>

                <button
                  type="button"
                  onClick={handleRunTest}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg transition-all"
                >
                  <Play className={`w-4 h-4 fill-current ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Validating Handshake...' : 'Execute Test Ping'}
                </button>
              </div>

              {/* Test Result Display */}
              {testResult && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span className="font-bold text-emerald-300">
                        Handshake Successful • HTTP {testResult.status} OK
                      </span>
                    </div>
                    <span className="font-mono text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                      Latency: {testResult.latencyMs}ms
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block mb-1">
                      Validated Inbound Telemetry Payload
                    </span>
                    <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-teal-400 overflow-x-auto">
                      {testResult.payloadSnippet}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-1.5 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-cyan-500/20"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleActivate}
                disabled={!testResult || !testResult.success}
                className="flex items-center gap-1.5 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" /> Activate Custom Provider
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
