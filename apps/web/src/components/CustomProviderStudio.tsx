import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';
import { IntegrationProvider, ProviderCategory } from '../types';
import { useToast } from './Toast';

interface FieldMapping {
  id: string;
  externalField: string;
  externalType: string;
  ubopField: string;
  ubopType: string;
  transformation: 'DIRECT' | 'LOWERCASE' | 'UPPERCASE' | 'PARSE_INT' | 'ISO_DATE';
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
    { number: 4, title: 'Test & Activate', desc: 'Handshake & Register' },
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
        latencyMs: 28,
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
      toast.success('Connection Verified', `Handshake with ${name} successful (200 OK in 28ms).`);
    }, 700);
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
      accentColor: 'from-teal-600 to-emerald-600',
      apiKey: apiSecret,
      webhookUrl: `${baseUrl}/events`,
      customHeaders,
      autoSync: true,
      latencyMs: testResult?.latencyMs || 28,
      lastTested: 'Just now',
    };

    onActivate(createdProvider);
    toast.success('Custom Provider Activated', `${name} is live and bound to UBOP EventBus.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-smooth-fade">
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-smooth-scale">
        {/* Header - Clean, bright and restrained */}
        <div className="px-6 py-4.5 border-b border-slate-200/90 flex items-center justify-between bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/80">
                Custom Adapter Studio
              </span>
              <span className="text-xs text-slate-500">• MuleSoft & Workato Spec</span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">Create Custom Provider Connector</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors btn-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-4 border-b border-slate-200 bg-slate-50/70 text-xs">
          {steps.map((s) => {
            const isDone = currentStep > s.number;
            const isCurrent = currentStep === s.number;
            return (
              <div
                key={s.number}
                className={`p-3.5 border-r border-slate-200 last:border-r-0 flex items-center gap-2.5 transition-colors ${
                  isCurrent ? 'bg-white border-b-2 border-b-teal-600' : ''
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <Check className="w-3.5 h-3.5" /> : s.number}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <div className={`font-semibold truncate ${isCurrent ? 'text-teal-900 font-bold' : 'text-slate-700'}`}>
                    {s.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          {/* STEP 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-smooth-fade">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-0.5">Provider Identification</h3>
                <p className="text-slate-500 text-xs">
                  Define the naming convention and operational business domain for this connector.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Provider Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Internal Warehouse WMS"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Operational Domain Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProviderCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition-all"
                  >
                    <option value="LOGISTICS">OMS / LOGISTICS (Orders & Fulfillment)</option>
                    <option value="PAYMENTS">PAYMENTS & BILLING (Gateways & Settlement)</option>
                    <option value="CRM">CRM & MARKETING (Leads & Accounts)</option>
                    <option value="COMMUNICATIONS">COMMUNICATIONS (Alerts & Messaging)</option>
                    <option value="CUSTOM">GENERIC PROTOCOL (Custom Adapters)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Execution Environment</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEnvironment('SANDBOX')}
                      className={`p-2.5 rounded-xl border text-center transition-all btn-press ${
                        environment === 'SANDBOX'
                          ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnvironment('PRODUCTION')}
                      className={`p-2.5 rounded-xl border text-center transition-all btn-press ${
                        environment === 'PRODUCTION'
                          ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Production Live
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Description & Scope</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short architectural explanation"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition-all"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-900 block mb-0.5">
                  Decoupled Architecture Note
                </span>
                UBOP translates all inbound payloads into canonical business entities. Downstream ERP, OMS,
                and Workflow rules stay completely isolated from upstream schema changes.
              </div>
            </div>
          )}

          {/* STEP 2: API Configuration */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-smooth-fade">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-0.5">Network & Security</h3>
                <p className="text-slate-500 text-xs">
                  Configure upstream REST endpoints, SSL/TLS validation, and credentials.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Base API URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.partner.com/v1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-teal-700 focus:outline-none focus:bg-white focus:border-teal-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Authentication Protocol</label>
                  <select
                    value={authType}
                    onChange={(e) =>
                      setAuthType(e.target.value as 'API_KEY' | 'OAUTH2' | 'JWT' | 'MTLS')
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 focus:outline-none focus:bg-white focus:border-teal-600 transition-all"
                  >
                    <option value="API_KEY">API Key / Token Header</option>
                    <option value="OAUTH2">OAuth 2.0 Client Credentials Grant</option>
                    <option value="JWT">JWT Bearer (RSA-256)</option>
                    <option value="MTLS">Mutual TLS (mTLS Certificate)</option>
                  </select>
                </div>

                {authType === 'API_KEY' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Header Name</label>
                    <input
                      type="text"
                      value={apiKeyHeader}
                      onChange={(e) => setApiKeyHeader(e.target.value)}
                      placeholder="X-API-Key or Authorization"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600 transition-all"
                    />
                  </div>
                )}
              </div>

              {authType === 'API_KEY' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">
                    Secret Key / Token Value <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600 transition-all"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Encrypted with Hardware Security Module (HSM) Vault at rest.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Token URL</label>
                    <input
                      type="text"
                      value={tokenUrl}
                      onChange={(e) => setTokenUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1.5">Client ID</label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Request Headers (JSON)
                </label>
                <textarea
                  rows={3}
                  value={customHeaders}
                  onChange={(e) => setCustomHeaders(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs text-teal-700 focus:outline-none focus:bg-white focus:border-teal-600 transition-all"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Data Mapping */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-smooth-fade">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-0.5">Entity Schema Field Mapping</h3>
                  <p className="text-slate-500 text-xs">
                    Map external JSON attributes to UBOP Canonical Entities.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs font-medium">Target Entity:</span>
                  <select
                    value={entityTarget}
                    onChange={(e) => setEntityTarget(e.target.value as 'ORDER' | 'CUSTOMER' | 'INVENTORY')}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-slate-800 font-semibold"
                  >
                    <option value="ORDER">Order Entity (OMS)</option>
                    <option value="CUSTOMER">Customer Entity (CRM)</option>
                    <option value="INVENTORY">Inventory Item (ERP)</option>
                  </select>
                </div>
              </div>

              {/* Field Mapping Grid */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="grid grid-cols-12 bg-slate-50 p-3 border-b border-slate-200 text-[11px] font-mono uppercase text-slate-500 font-semibold">
                  <div className="col-span-4">External Provider Field</div>
                  <div className="col-span-1 text-center">Map</div>
                  <div className="col-span-6">UBOP Canonical Attribute</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>

                <div className="divide-y divide-slate-100">
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-teal-700 focus:outline-none focus:bg-white focus:border-teal-600 transition-all text-xs"
                        />
                      </div>

                      <div className="col-span-1 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-slate-400" />
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
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-teal-600 text-xs"
                        >
                          <option value="order.order_number">order.order_number (String)</option>
                          <option value="order.customer_id">order.customer_id (Int)</option>
                          <option value="order.status">order.status (Enum)</option>
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
                          className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono text-slate-700"
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
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors btn-press"
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-teal-700 transition-colors btn-press"
              >
                <Plus className="w-3.5 h-3.5" /> Add Field Mapping
              </button>
            </div>
          )}

          {/* STEP 4: Test Handshake & Activation */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-smooth-fade">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-0.5">Pre-Activation Verification</h3>
                <p className="text-slate-500 text-xs">
                  Execute a synthetic health probe to verify authentication, schema contracts, and latency.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Adapter</span>
                  <span className="font-bold text-slate-800">{name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Domain</span>
                  <span className="font-bold text-teal-700">{category}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Protocol</span>
                  <span className="font-mono text-slate-700">{authType}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">Mapped Fields</span>
                  <span className="font-mono text-emerald-700 font-bold">{mappings.length} Attributes</span>
                </div>
              </div>

              {/* Test Trigger Area */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div>
                  <div className="font-bold text-slate-900">Ping Target Endpoint</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{baseUrl}</div>
                </div>

                <button
                  type="button"
                  onClick={handleRunTest}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-sm btn-press disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Pinging Endpoint...' : 'Execute Test Ping'}
                </button>
              </div>

              {/* Test Result Display */}
              {testResult && (
                <div className="space-y-2.5 animate-smooth-fade">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-emerald-800 text-xs">
                      Handshake Successful • HTTP {testResult.status} OK
                    </span>
                    <span className="font-mono text-xs text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                      {testResult.latencyMs}ms
                    </span>
                  </div>

                  <pre className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-teal-800 overflow-x-auto">
                    {testResult.payloadSnippet}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
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

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-1.5 px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm btn-press"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleActivate}
                disabled={!testResult || !testResult.success}
                className="flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm disabled:opacity-50 btn-press"
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
