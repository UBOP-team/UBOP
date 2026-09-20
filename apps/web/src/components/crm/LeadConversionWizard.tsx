import React, { useState } from 'react';
import {
  Check,
  Building,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import { Lead, Account } from '../../types';
import { Modal } from '../Modal';

interface LeadConversionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  existingAccounts: Account[];
  onConvert: (params: {
    create_new_account: boolean;
    account_id?: number;
    account_name?: string;
    create_new_contact: boolean;
    contact_id?: number;
    create_opportunity: boolean;
    opportunity_name?: string;
    opportunity_amount?: number;
    expected_close_date?: string;
    initial_stage: string;
  }) => Promise<{ account_id: number; contact_id: number; opportunity_id?: number }>;
  onOpenRecord?: (type: 'ACCOUNT' | 'OPPORTUNITY', id: number) => void;
}

export const LeadConversionWizard: React.FC<LeadConversionWizardProps> = ({
  isOpen,
  onClose,
  lead,
  existingAccounts,
  onConvert,
  onOpenRecord,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1); // 5 = success
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [conversionResult, setConversionResult] = useState<{
    account_id: number;
    contact_id: number;
    opportunity_id?: number;
  } | null>(null);

  // Step 1: Account
  const [accountMode, setAccountMode] = useState<'NEW' | 'EXISTING'>('NEW');
  const [accountName, setAccountName] = useState(lead.company_name || '');
  const [selectedAccountId, setSelectedAccountId] = useState<number>(
    existingAccounts[0]?.id || 0
  );

  // Step 2: Contact
  const contactMode = 'NEW';

  // Step 3: Opportunity
  const [createOpportunity, setCreateOpportunity] = useState(true);
  const [opportunityName, setOpportunityName] = useState(
    `${lead.company_name} — Initial Contract`
  );
  const [opportunityAmount, setOpportunityAmount] = useState<number>(
    lead.estimated_value || 100000000
  );
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    new Date(Date.now() + 30 * 24 * 3600000).toISOString().split('T')[0]
  );
  const [initialStage, setInitialStage] = useState('QUALIFICATION');

  // Duplicate hint calculation
  const matchedAccount = existingAccounts.find(
    (a) => a.name.toLowerCase().trim() === lead.company_name.toLowerCase().trim()
  );

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1 && accountMode === 'NEW' && !accountName.trim()) {
      setErrorMsg('Account name is required.');
      return;
    }
    if (step < 4) {
      setStep((prev) => (prev + 1) as any);
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (step > 1 && step < 5) {
      setStep((prev) => (prev - 1) as any);
    }
  };

  const handleExecuteConversion = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await onConvert({
        create_new_account: accountMode === 'NEW',
        account_name: accountName.trim(),
        account_id: accountMode === 'EXISTING' ? selectedAccountId : undefined,
        create_new_contact: contactMode === 'NEW',
        create_opportunity: createOpportunity,
        opportunity_name: createOpportunity ? opportunityName.trim() : undefined,
        opportunity_amount: createOpportunity ? Number(opportunityAmount) : undefined,
        expected_close_date: createOpportunity ? expectedCloseDate : undefined,
        initial_stage: initialStage,
      });
      setConversionResult(res);
      setStep(5);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Conversion failed. All changes have been rolled back.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={step === 5 ? 'Conversion Completed' : `Convert Lead: ${lead.first_name} ${lead.last_name}`}
    >
      {/* Wizard Progress Stepper */}
      {step < 5 && (
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          {[
            { num: 1, label: 'Account' },
            { num: 2, label: 'Contact' },
            { num: 3, label: 'Opportunity' },
            { num: 4, label: 'Review' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.num
                    ? 'bg-slate-900 text-white ring-2 ring-slate-300'
                    : step > s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
              </div>
              <span
                className={`text-xs font-medium hidden sm:inline ${
                  step === s.num ? 'text-slate-900 font-semibold' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {errorMsg && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: ACCOUNT */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Building className="w-4 h-4 text-blue-600" />
            <span>Select or Create Account</span>
          </div>

          {matchedAccount && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-2 text-xs text-amber-800">
              <div>
                <span className="font-semibold">Possible match found: </span>
                {matchedAccount.name} ({matchedAccount.segment})
              </div>
              <button
                type="button"
                onClick={() => {
                  setAccountMode('EXISTING');
                  setSelectedAccountId(matchedAccount.id);
                }}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded text-[11px] shrink-0 cursor-pointer"
              >
                Use Existing
              </button>
            </div>
          )}

          <div className="space-y-3">
            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="radio"
                name="acc_mode"
                checked={accountMode === 'NEW'}
                onChange={() => setAccountMode('NEW')}
                className="mt-0.5 text-slate-900"
              />
              <div className="space-y-2 flex-1">
                <span className="text-xs font-semibold text-slate-900">Create new Account</span>
                {accountMode === 'NEW' && (
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Account name..."
                    className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                )}
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="radio"
                name="acc_mode"
                checked={accountMode === 'EXISTING'}
                onChange={() => setAccountMode('EXISTING')}
                className="mt-0.5 text-slate-900"
              />
              <div className="space-y-2 flex-1">
                <span className="text-xs font-semibold text-slate-900">Attach to existing Account</span>
                {accountMode === 'EXISTING' && (
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                    className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  >
                    {existingAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.account_type})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </label>
          </div>
        </div>
      )}

      {/* STEP 2: CONTACT */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <User className="w-4 h-4 text-emerald-600" />
            <span>Contact Creation</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
            <div className="font-semibold text-slate-900">
              {lead.first_name} {lead.last_name}
            </div>
            <div className="text-slate-600">Job Title: {lead.job_title || 'N/A'}</div>
            <div className="text-slate-600">Email: {lead.email || 'N/A'}</div>
            <div className="text-slate-600">Phone: {lead.phone || 'N/A'}</div>
          </div>

          <div className="text-[11px] text-slate-500">
            A primary contact record will be created under the chosen Account with these verified lead details.
          </div>
        </div>
      )}

      {/* STEP 3: OPPORTUNITY */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <Briefcase className="w-4 h-4 text-purple-600" />
              <span>Create Opportunity</span>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={createOpportunity}
                onChange={(e) => setCreateOpportunity(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              Create commercial deal
            </label>
          </div>

          {createOpportunity && (
            <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Opportunity Name
                </label>
                <input
                  type="text"
                  value={opportunityName}
                  onChange={(e) => setOpportunityName(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Amount (VND)
                  </label>
                  <input
                    type="number"
                    value={opportunityAmount}
                    onChange={(e) => setOpportunityAmount(Number(e.target.value))}
                    className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={initialStage}
                    onChange={(e) => setInitialStage(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 bg-white"
                  >
                    <option value="QUALIFICATION">Qualification (25%)</option>
                    <option value="DISCOVERY">Discovery (40%)</option>
                    <option value="PROPOSAL">Proposal (60%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Expected Close Date
                </label>
                <input
                  type="date"
                  value={expectedCloseDate}
                  onChange={(e) => setExpectedCloseDate(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 bg-white"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 4: REVIEW */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-700">
            Review Transactional Conversion Summary
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Lead</span>
              <span className="font-semibold text-slate-900">
                {lead.first_name} {lead.last_name} ({lead.company_name})
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Target Account</span>
              <span className="font-semibold text-blue-700">
                {accountMode === 'NEW' ? `${accountName} (New)` : 'Existing Account'}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Target Contact</span>
              <span className="font-semibold text-emerald-700">
                {lead.first_name} {lead.last_name} (Decision Maker)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Opportunity</span>
              <span className="font-semibold text-purple-700">
                {createOpportunity
                  ? `${opportunityName} · ${opportunityAmount.toLocaleString()} VND`
                  : 'None'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: SUCCESS STATE */}
      {step === 5 && conversionResult && (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Lead Successfully Converted</h3>
            <p className="text-xs text-slate-500 mt-1">
              The prospect has been elevated to an active customer relationship.
            </p>
          </div>

          <div className="max-w-md mx-auto p-3 bg-slate-50 border border-slate-200 rounded-lg text-left text-xs space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <Check className="w-4 h-4" /> Account Created / Linked
            </div>
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <Check className="w-4 h-4" /> Contact Linked as Primary Decision Maker
            </div>
            {conversionResult.opportunity_id && (
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <Check className="w-4 h-4" /> Open Opportunity Created in Pipeline
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            {conversionResult.opportunity_id && onOpenRecord && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRecord('OPPORTUNITY', conversionResult.opportunity_id!);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Open Opportunity
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Footer Navigation */}
      {step < 5 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-5">
          <button
            type="button"
            onClick={step === 1 ? onClose : handleBack}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            {step === 1 ? 'Cancel' : <><ArrowLeft className="w-3.5 h-3.5" /> Back</>}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={step === 4 ? handleExecuteConversion : handleNext}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            {submitting
              ? 'Converting...'
              : step === 4
              ? 'Execute Conversion'
              : <>Next <ArrowRight className="w-3.5 h-3.5" /></>}
          </button>
        </div>
      )}
    </Modal>
  );
};
