import React, { useState, useEffect } from 'react';
import {
  Plus,
  Building,
  Search,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Users,
  Briefcase,
  LayoutGrid,
  List,
  Clock,
  ShieldCheck,
  History,
} from 'lucide-react';
import {
  Customer,
  Lead,
  Account,
  Contact,
  Opportunity,
  Activity,
  Order,
} from '../types';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { StagePath } from '../components/crm/StagePath';
import { RecordHeader } from '../components/crm/RecordHeader';
import { ActivityTimeline } from '../components/crm/ActivityTimeline';
import { LeadConversionWizard } from '../components/crm/LeadConversionWizard';
import { OpportunityKanban } from '../components/crm/OpportunityKanban';

interface CrmViewProps {
  customers: Customer[];
  orders?: Order[];
  onCreateCustomer?: (customer: Partial<Customer>) => Promise<void>;
  onUpdateCustomer?: (customerId: number, customer: Partial<Customer>) => Promise<void>;
  onDeleteCustomer?: (customerId: number) => Promise<void>;
  onSelectCustomerForOrder?: (customerId: number) => void;
  activeSubNav?: string;
  onSubNavChange?: (subTab: string) => void;
}

export const CrmView: React.FC<CrmViewProps> = ({
  customers: _customers,
  orders: _orders = [],
  activeSubNav,
  onSubNavChange,
}) => {
  const toast = useToast();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'LEADS' | 'ACCOUNTS' | 'CONTACTS' | 'OPPORTUNITIES' | 'ACTIVITIES'
  >('OVERVIEW');

  // Synchronize with parent sidebar subnavigation
  useEffect(() => {
    if (!activeSubNav) return;
    const tabMap: Record<string, typeof activeTab> = {
      OVERVIEW: 'OVERVIEW',
      LEADS: 'LEADS',
      ACCOUNTS: 'ACCOUNTS',
      CUSTOMERS: 'ACCOUNTS',
      CONTACTS: 'CONTACTS',
      OPPORTUNITIES: 'OPPORTUNITIES',
      DEALS: 'OPPORTUNITIES',
      ACTIVITIES: 'ACTIVITIES',
    };
    if (tabMap[activeSubNav]) {
      setActiveTab(tabMap[activeSubNav]);
    }
  }, [activeSubNav]);

  const switchTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (onSubNavChange) onSubNavChange(tab);
  };

  // ==========================================
  // Canonical CRM State
  // ==========================================

  const [leads, setLeads] = useState<Lead[]>([
    {
      id: 1,
      first_name: 'Minh',
      last_name: 'Nguyen',
      company_name: 'ABC Logistics Packaging',
      job_title: 'Procurement Director',
      email: 'minh.nguyen@abcpackaging.vn',
      phone: '+84 901 234 567',
      source: 'WEBSITE',
      status: 'QUALIFIED',
      estimated_value: 150000000,
      notes: 'Requires 50,000 corrugated cartons monthly with custom moisture seal.',
      owner_id: '1',
      organization_id: 'default',
      sync_status: 'HEALTHY',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 2,
      last_name: 'Tran',
      first_name: 'Lan',
      company_name: 'Delta Tech Solutions',
      job_title: 'VP of Infrastructure',
      email: 'lan.tran@deltatech.io',
      phone: '+84 912 345 678',
      source: 'REFERRAL',
      status: 'CONTACTED',
      estimated_value: 280000000,
      notes: 'Interested in dual Xeon server racks and 48-port core switches.',
      owner_id: '1',
      organization_id: 'default',
      sync_status: 'HEALTHY',
      created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 3,
      first_name: 'Hoang',
      last_name: 'Pham',
      company_name: 'Starlight Retail Global',
      job_title: 'Operations Manager',
      email: 'h.pham@starlight.com',
      phone: '+84 988 776 554',
      source: 'EVENT',
      status: 'NEW',
      estimated_value: 90000000,
      notes: 'Met at Vietnam Supply Chain Expo 2026.',
      owner_id: '1',
      organization_id: 'default',
      sync_status: 'HEALTHY',
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ]);

  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: 1,
      name: 'Apex Global Enterprises',
      account_type: 'CUSTOMER',
      industry: 'Enterprise Technology',
      website: 'https://apex.io',
      phone: '+1 555-0199',
      billing_address: 'Suite 400, Financial Tower, HCMC',
      status: 'ACTIVE',
      segment: 'ENTERPRISE',
      owner_id: '1',
      organization_id: 'default',
      provider_reference: 'SF-ACC-009182',
      sync_status: 'HEALTHY',
      created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 2,
      name: 'Vinh Phát Distribution Co.',
      account_type: 'PROSPECT',
      industry: 'Wholesale & Distribution',
      website: 'https://vinhphat.vn',
      phone: '+84 28 3822 9900',
      billing_address: 'District 7 Logistics Hub, HCMC',
      status: 'ACTIVE',
      segment: 'MID_MARKET',
      owner_id: '1',
      organization_id: 'default',
      sync_status: 'HEALTHY',
      created_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ]);

  const [contacts, setContacts] = useState<Contact[]>([
    {
      id: 1,
      account_id: 1,
      first_name: 'Linh',
      last_name: 'Tran',
      job_title: 'Procurement Director',
      department: 'Supply Chain',
      email: 'linh.tran@apex.io',
      phone: '+1 555-0199 ext 402',
      is_primary: true,
      owner_id: '1',
      organization_id: 'default',
      sync_status: 'HEALTHY',
      created_at: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      account_id: 2,
      first_name: 'Dung',
      last_name: 'Vo',
      job_title: 'Warehouse Chief',
      department: 'Logistics',
      email: 'dung.vo@vinhphat.vn',
      phone: '+84 909 112 233',
      is_primary: true,
      owner_id: '1',
      organization_id: 'default',
      sync_status: 'HEALTHY',
      created_at: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const [opportunities, setOpportunities] = useState<Opportunity[]>([
    {
      id: 1,
      account_id: 1,
      name: 'Enterprise Rack Server Expansion 2026',
      stage: 'PROPOSAL',
      amount: 450000000,
      currency: 'VND',
      probability: 60,
      expected_close_date: '2026-10-15',
      source: 'EXISTING_CUSTOMER',
      owner_id: '1',
      organization_id: 'default',
      sync_status: 'HEALTHY',
      created_at: new Date(Date.now() - 3600000 * 24 * 10).toISOString(),
      updated_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    },
    {
      id: 2,
      account_id: 1,
      name: 'Annual Custom Connector SLA',
      stage: 'NEGOTIATION',
      amount: 180000000,
      currency: 'VND',
      probability: 80,
      expected_close_date: '2026-09-30',
      source: 'ACCOUNT_MANAGEMENT',
      owner_id: '1',
      organization_id: 'default',
      sync_status: 'HEALTHY',
      created_at: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 3,
      account_id: 2,
      name: 'Automated Barcode Bins Trial',
      stage: 'DISCOVERY',
      amount: 120000000,
      currency: 'VND',
      probability: 40,
      expected_close_date: '2026-11-20',
      source: 'INBOUND',
      owner_id: '1',
      organization_id: 'default',
      sync_status: 'HEALTHY',
      created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: 1,
      subject: 'Discovery Call with Minh Nguyen',
      type: 'CALL',
      status: 'COMPLETED',
      lead_id: 1,
      owner_id: '1',
      body: 'Discussed required box dimensions and test shipment in October.',
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 2,
      subject: 'Status changed: NEW → CONTACTED',
      type: 'SYSTEM_EVENT',
      status: 'COMPLETED',
      lead_id: 2,
      owner_id: '1',
      body: 'Stage updated following phone touchpoint.',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
    {
      id: 3,
      subject: 'Proposal Sent: Enterprise Server Expansion',
      type: 'EMAIL',
      status: 'COMPLETED',
      account_id: 1,
      opportunity_id: 1,
      owner_id: '1',
      body: 'Formal quote sent to Linh Tran for dual Xeon servers.',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
  ]);

  // Fetch live canonical data from backend on mount
  useEffect(() => {
    const fetchCanonicalCrm = async () => {
      try {
        const [leadsRes, accountsRes, contactsRes, oppsRes, actsRes] = await Promise.allSettled([
          fetch('/api/v1/crm/leads').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/v1/crm/accounts').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/v1/crm/contacts').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/v1/crm/opportunities').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/v1/crm/activities').then((r) => (r.ok ? r.json() : null)),
        ]);

        if (leadsRes.status === 'fulfilled' && leadsRes.value?.length > 0) setLeads(leadsRes.value);
        if (accountsRes.status === 'fulfilled' && accountsRes.value?.length > 0)
          setAccounts(accountsRes.value);
        if (contactsRes.status === 'fulfilled' && contactsRes.value?.length > 0)
          setContacts(contactsRes.value);
        if (oppsRes.status === 'fulfilled' && oppsRes.value?.length > 0)
          setOpportunities(oppsRes.value);
        if (actsRes.status === 'fulfilled' && actsRes.value?.length > 0)
          setActivities(actsRes.value);
      } catch {
        // Keep optimistic state
      }
    };
    fetchCanonicalCrm();
  }, []);

  // Selected Record States for Workspaces
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Modals
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isNewContactModalOpen, setIsNewContactModalOpen] = useState(false);
  const [isNewOpportunityModalOpen, setIsNewOpportunityModalOpen] = useState(false);
  const [isConversionWizardOpen, setIsConversionWizardOpen] = useState(false);
  const [isClosedLostModalOpen, setIsClosedLostModalOpen] = useState(false);
  const [lostOppTarget, setLostOppTarget] = useState<Opportunity | null>(null);
  const [lossReasonInput, setLossReasonInput] = useState('Price');
  const [lossNotesInput, setLossNotesInput] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [leadSavedView, setLeadSavedView] = useState<'ALL' | 'NEW' | 'QUALIFIED' | 'CONVERTED'>(
    'ALL'
  );
  const [accountSavedView, setAccountSavedView] = useState<
    'ALL' | 'CUSTOMERS' | 'PROSPECTS' | 'STRATEGIC'
  >('ALL');
  const [oppSavedView, setOppSavedView] = useState<
    'ALL' | 'OPEN' | 'CLOSING_SOON' | 'WON' | 'LOST'
  >('ALL');
  const [oppViewMode, setOppViewMode] = useState<'TABLE' | 'KANBAN'>('KANBAN');

  // ==========================================
  // Handlers for Leads
  // ==========================================

  const handleCreateLead = async (leadData: Partial<Lead>) => {
    try {
      const res = await fetch('/api/v1/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData),
      });
      if (res.ok) {
        const created = await res.json();
        setLeads((prev) => [created, ...prev]);
        toast.success(`Lead for ${created.company_name} created.`);
        setIsNewLeadModalOpen(false);
        return;
      }
    } catch {}

    const localNew: Lead = {
      id: Date.now(),
      first_name: leadData.first_name || '',
      last_name: leadData.last_name || 'Prospect',
      company_name: leadData.company_name || 'New Enterprise',
      job_title: leadData.job_title,
      email: leadData.email,
      phone: leadData.phone,
      source: leadData.source || 'WEBSITE',
      status: 'NEW',
      estimated_value: leadData.estimated_value || 50000000,
      notes: leadData.notes,
      owner_id: '1',
      organization_id: 'default',
      sync_status: 'HEALTHY',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setLeads((prev) => [localNew, ...prev]);
    toast.success(`Lead created: ${localNew.first_name} ${localNew.last_name}`);
    setIsNewLeadModalOpen(false);
  };

  const handleTransitionLeadStatus = async (leadId: number, targetStatus: string) => {
    try {
      const res = await fetch(`/api/v1/crm/leads/${leadId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, reason: 'Status advanced from Path' }),
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
        if (selectedLead?.id === leadId) setSelectedLead(updated);
        toast.success(`Lead status updated to ${targetStatus}`);
        return;
      }
    } catch {}

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: targetStatus as any } : l))
    );
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, status: targetStatus as any } : null));
    }
    toast.success(`Lead status updated to ${targetStatus}`);
  };

  const handleExecuteLeadConversion = async (params: any) => {
    if (!selectedLead) throw new Error('No lead selected for conversion');

    try {
      const res = await fetch(`/api/v1/crm/leads/${selectedLead.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        // Update local status
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, status: 'CONVERTED' } : l))
        );
        setSelectedLead((prev) => (prev ? { ...prev, status: 'CONVERTED' } : null));
        toast.success('Lead successfully converted into Account & Contact!');
        return data;
      }
    } catch {}

    // Optimistic conversion
    const newAccId = Date.now();
    const newContId = Date.now() + 1;
    const newOppId = params.create_opportunity ? Date.now() + 2 : undefined;

    const newAcc: Account = {
      id: newAccId,
      name: params.account_name || selectedLead.company_name,
      account_type: 'CUSTOMER',
      phone: selectedLead.phone,
      status: 'ACTIVE',
      segment: 'MID_MARKET',
      owner_id: '1',
      organization_id: 'default',
      sync_status: 'HEALTHY',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setAccounts((prev) => [newAcc, ...prev]);

    const newCont: Contact = {
      id: newContId,
      account_id: newAccId,
      first_name: selectedLead.first_name,
      last_name: selectedLead.last_name,
      job_title: selectedLead.job_title,
      email: selectedLead.email,
      phone: selectedLead.phone,
      is_primary: true,
      owner_id: '1',
      organization_id: 'default',
      sync_status: 'HEALTHY',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setContacts((prev) => [newCont, ...prev]);

    if (newOppId) {
      const newOpp: Opportunity = {
        id: newOppId,
        account_id: newAccId,
        name: params.opportunity_name || `${newAcc.name} Initial Deal`,
        stage: params.initial_stage || 'QUALIFICATION',
        amount: params.opportunity_amount || selectedLead.estimated_value || 100000000,
        currency: 'VND',
        probability: 25,
        expected_close_date: params.expected_close_date,
        owner_id: '1',
        organization_id: 'default',
        sync_status: 'HEALTHY',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setOpportunities((prev) => [newOpp, ...prev]);
    }

    setLeads((prev) =>
      prev.map((l) => (l.id === selectedLead.id ? { ...l, status: 'CONVERTED' } : l))
    );
    setSelectedLead((prev) => (prev ? { ...prev, status: 'CONVERTED' } : null));
    toast.success('Lead converted successfully!');
    return { account_id: newAccId, contact_id: newContId, opportunity_id: newOppId };
  };

  // ==========================================
  // Handlers for Opportunities & Stages
  // ==========================================

  const handleCreateOpportunity = async (oppData: Partial<Opportunity>) => {
    try {
      const res = await fetch('/api/v1/crm/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(oppData),
      });
      if (res.ok) {
        const created = await res.json();
        setOpportunities((prev) => [created, ...prev]);
        toast.success(`Opportunity '${created.name}' created.`);
        setIsNewOpportunityModalOpen(false);
        return;
      }
    } catch {}

    const localNew: Opportunity = {
      id: Date.now(),
      name: oppData.name || 'New Deal',
      account_id: oppData.account_id,
      stage: oppData.stage || 'PROSPECTING',
      amount: oppData.amount || 100000000,
      currency: 'VND',
      probability: 10,
      expected_close_date: oppData.expected_close_date,
      owner_id: '1',
      organization_id: 'default',
      sync_status: 'HEALTHY',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setOpportunities((prev) => [localNew, ...prev]);
    toast.success(`Opportunity created: ${localNew.name}`);
    setIsNewOpportunityModalOpen(false);
  };

  const handleTransitionOpportunityStage = async (oppId: number, targetStage: string) => {
    try {
      const res = await fetch(`/api/v1/crm/opportunities/${oppId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: targetStage }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOpportunities((prev) => prev.map((o) => (o.id === oppId ? updated : o)));
        if (selectedOpportunity?.id === oppId) setSelectedOpportunity(updated);
        toast.success(`Stage transitioned to ${targetStage}`);
        return;
      }
    } catch {}

    const probMap: Record<string, number> = {
      PROSPECTING: 10,
      QUALIFICATION: 25,
      DISCOVERY: 40,
      PROPOSAL: 60,
      NEGOTIATION: 80,
      CLOSED_WON: 100,
      CLOSED_LOST: 0,
    };
    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === oppId
          ? {
              ...o,
              stage: targetStage as any,
              probability: probMap[targetStage] ?? o.probability,
            }
          : o
      )
    );
    if (selectedOpportunity?.id === oppId) {
      setSelectedOpportunity((prev) =>
        prev
          ? {
              ...prev,
              stage: targetStage as any,
              probability: probMap[targetStage] ?? prev.probability,
            }
          : null
      );
    }
    toast.success(`Deal stage moved to ${targetStage}`);
  };

  const handleCloseWonOpportunity = async (oppId: number) => {
    try {
      const res = await fetch(`/api/v1/crm/opportunities/${oppId}/close-won`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const updated = await res.json();
        setOpportunities((prev) => prev.map((o) => (o.id === oppId ? updated : o)));
        if (selectedOpportunity?.id === oppId) setSelectedOpportunity(updated);
        toast.success('Deal marked as CLOSED WON! 🏆');
        return;
      }
    } catch {}

    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === oppId
          ? {
              ...o,
              stage: 'CLOSED_WON',
              probability: 100,
              actual_close_date: new Date().toISOString(),
            }
          : o
      )
    );
    if (selectedOpportunity?.id === oppId) {
      setSelectedOpportunity((prev) =>
        prev
          ? {
              ...prev,
              stage: 'CLOSED_WON',
              probability: 100,
              actual_close_date: new Date().toISOString(),
            }
          : null
      );
    }
    toast.success('Deal marked as CLOSED WON! 🏆');
  };

  const handleCloseLostOpportunity = async () => {
    if (!lostOppTarget) return;
    try {
      const res = await fetch(`/api/v1/crm/opportunities/${lostOppTarget.id}/close-lost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loss_reason: lossReasonInput, notes: lossNotesInput }),
      });
      if (res.ok) {
        const updated = await res.json();
        setOpportunities((prev) => prev.map((o) => (o.id === lostOppTarget.id ? updated : o)));
        if (selectedOpportunity?.id === lostOppTarget.id) setSelectedOpportunity(updated);
        toast.info(`Opportunity closed as Lost (${lossReasonInput})`);
        setIsClosedLostModalOpen(false);
        return;
      }
    } catch {}

    setOpportunities((prev) =>
      prev.map((o) =>
        o.id === lostOppTarget.id
          ? {
              ...o,
              stage: 'CLOSED_LOST',
              probability: 0,
              loss_reason: lossReasonInput,
            }
          : o
      )
    );
    if (selectedOpportunity?.id === lostOppTarget.id) {
      setSelectedOpportunity((prev) =>
        prev
          ? {
              ...prev,
              stage: 'CLOSED_LOST',
              probability: 0,
              loss_reason: lossReasonInput,
            }
          : null
      );
    }
    toast.info(`Opportunity closed as Lost (${lossReasonInput})`);
    setIsClosedLostModalOpen(false);
  };

  // ==========================================
  // Handlers for Logging Activities
  // ==========================================

  const handleLogActivity = async (data: {
    type: 'CALL' | 'TASK' | 'EMAIL' | 'MEETING' | 'NOTE';
    subject: string;
    body: string;
    status?: 'COMPLETED' | 'SCHEDULED';
  }) => {
    const payload: any = {
      ...data,
      owner_id: '1',
      lead_id: selectedLead?.id,
      account_id: selectedAccount?.id,
      opportunity_id: selectedOpportunity?.id,
      contact_id: selectedContact?.id,
    };

    try {
      const res = await fetch('/api/v1/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const created = await res.json();
        setActivities((prev) => [created, ...prev]);
        toast.success(`Activity logged: ${created.subject}`);
        return;
      }
    } catch {}

    const localAct: Activity = {
      id: Date.now(),
      subject: data.subject,
      type: data.type,
      status: data.status || 'COMPLETED',
      body: data.body,
      lead_id: selectedLead?.id,
      account_id: selectedAccount?.id,
      opportunity_id: selectedOpportunity?.id,
      contact_id: selectedContact?.id,
      owner_id: '1',
      created_at: new Date().toISOString(),
    };
    setActivities((prev) => [localAct, ...prev]);
    toast.success(`Activity recorded: ${localAct.subject}`);
  };

  // ==========================================
  // Filtered Lists & Metrics
  // ==========================================

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      searchQuery === '' ||
      lead.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (leadSavedView === 'NEW') return lead.status === 'NEW';
    if (leadSavedView === 'QUALIFIED') return lead.status === 'QUALIFIED';
    if (leadSavedView === 'CONVERTED') return lead.status === 'CONVERTED';
    return true;
  });

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      searchQuery === '' ||
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.industry && acc.industry.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    if (accountSavedView === 'CUSTOMERS') return acc.account_type === 'CUSTOMER';
    if (accountSavedView === 'PROSPECTS') return acc.account_type === 'PROSPECT';
    if (accountSavedView === 'STRATEGIC') return acc.segment === 'ENTERPRISE';
    return true;
  });

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      searchQuery === '' || opp.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (oppSavedView === 'OPEN')
      return opp.stage !== 'CLOSED_WON' && opp.stage !== 'CLOSED_LOST';
    if (oppSavedView === 'WON') return opp.stage === 'CLOSED_WON';
    if (oppSavedView === 'LOST') return opp.stage === 'CLOSED_LOST';
    return true;
  });

  // Overview metrics
  const totalPipelineValue = opportunities
    .filter((o) => o.stage !== 'CLOSED_LOST')
    .reduce((sum, o) => sum + (o.amount || 0), 0);
  const openDealsCount = opportunities.filter(
    (o) => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST'
  ).length;
  const newLeadsCount = leads.filter((l) => l.status === 'NEW').length;
  const pendingTasksCount = activities.filter((a) => a.status === 'SCHEDULED').length;

  // Opportunity stage steps definition
  const opportunitySteps = [
    { id: 'PROSPECTING', label: 'Prospecting' },
    { id: 'QUALIFICATION', label: 'Qualification' },
    { id: 'DISCOVERY', label: 'Discovery' },
    { id: 'PROPOSAL', label: 'Proposal' },
    { id: 'NEGOTIATION', label: 'Negotiation' },
    { id: 'CLOSED_WON', label: 'Closed Won' },
  ];

  // Lead status steps definition
  const leadSteps = [
    { id: 'NEW', label: 'New' },
    { id: 'CONTACTED', label: 'Contacted' },
    { id: 'QUALIFYING', label: 'Qualifying' },
    { id: 'QUALIFIED', label: 'Qualified' },
    { id: 'CONVERTED', label: 'Converted' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Context Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
                Commercial Relationship Lifecycle
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                <ShieldCheck className="w-2.5 h-2.5" /> Salesforce Lightning Standard
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Sales Command Surface & CRM Workspaces
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsNewLeadModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Lead
            </button>
            <button
              onClick={() => setIsNewOpportunityModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5 text-purple-600" /> New Opportunity
            </button>
            <button
              onClick={() => setIsNewAccountModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Building className="w-3.5 h-3.5 text-blue-600" /> Add Account
            </button>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex border-b border-slate-200 mt-4 overflow-x-auto scrollbar-thin">
          {[
            { id: 'OVERVIEW', label: 'Overview' },
            { id: 'LEADS', label: `Leads (${leads.length})` },
            { id: 'ACCOUNTS', label: `Accounts (${accounts.length})` },
            { id: 'CONTACTS', label: `Contacts (${contacts.length})` },
            { id: 'OPPORTUNITIES', label: `Opportunities (${opportunities.length})` },
            { id: 'ACTIVITIES', label: `Activities (${activities.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer shrink-0 ${
                activeTab === tab.id
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. OVERVIEW (Sales Command Surface)                                        */}
      {/* ========================================================================= */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Actionable KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div
              onClick={() => switchTab('OPPORTUNITIES')}
              className="cursor-pointer group bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-400 transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                <span>Total Pipeline Value</span>
                <DollarSign className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">
                {totalPipelineValue.toLocaleString('vi-VN')} VND
              </div>
              <div className="text-[11px] text-teal-600 font-medium mt-1 flex items-center gap-1">
                Click to view pipeline ➔
              </div>
            </div>

            <div
              onClick={() => switchTab('OPPORTUNITIES')}
              className="cursor-pointer group bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-400 transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                <span>Open Opportunities</span>
                <Briefcase className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">{openDealsCount} Deals</div>
              <div className="text-[11px] text-purple-600 font-medium mt-1 flex items-center gap-1">
                Active negotiations ➔
              </div>
            </div>

            <div
              onClick={() => {
                setLeadSavedView('NEW');
                switchTab('LEADS');
              }}
              className="cursor-pointer group bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-400 transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                <span>New Prospects / Leads</span>
                <Users className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">{newLeadsCount} Leads</div>
              <div className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
                Requiring initial follow-up ➔
              </div>
            </div>

            <div
              onClick={() => switchTab('ACTIVITIES')}
              className="cursor-pointer group bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-400 transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs font-medium mb-1">
                <span>Tasks Due & Follow-ups</span>
                <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-xl font-bold font-mono text-slate-900">
                {pendingTasksCount} Pending
              </div>
              <div className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
                Open work queue ➔
              </div>
            </div>
          </div>

          {/* 2-Column Command Surface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Pipeline by Stage & Deals at Risk */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pipeline Stage Breakdown */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Pipeline Progression by Stage
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Operational deal distribution across commercial stages
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setOppViewMode('KANBAN');
                      switchTab('OPPORTUNITIES');
                    }}
                    className="text-xs text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                  >
                    Open Kanban Board ➔
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'PROSPECTING', label: 'Prospecting' },
                    { id: 'QUALIFICATION', label: 'Qualification' },
                    { id: 'DISCOVERY', label: 'Discovery' },
                    { id: 'PROPOSAL', label: 'Proposal' },
                    { id: 'NEGOTIATION', label: 'Negotiation' },
                  ].map((st) => {
                    const stOpps = opportunities.filter((o) => o.stage === st.id);
                    const stSum = stOpps.reduce((acc, curr) => acc + (curr.amount || 0), 0);
                    const pct = totalPipelineValue > 0 ? (stSum / totalPipelineValue) * 100 : 0;

                    return (
                      <div
                        key={st.id}
                        onClick={() => switchTab('OPPORTUNITIES')}
                        className="group cursor-pointer p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
                      >
                        <div className="flex items-center justify-between text-xs font-medium mb-1">
                          <span className="font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">
                            {st.label} ({stOpps.length})
                          </span>
                          <span className="font-mono text-slate-900 font-bold">
                            {stSum.toLocaleString('vi-VN')} VND
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-900 rounded-full group-hover:bg-teal-600 transition-all"
                            style={{ width: `${Math.max(5, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Opportunities Requiring Action */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    High-Priority Deals Closing Soon
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">Q3/Q4 2026</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {opportunities.slice(0, 3).map((opp) => (
                    <div
                      key={opp.id}
                      onClick={() => {
                        setSelectedOpportunity(opp);
                        switchTab('OPPORTUNITIES');
                      }}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900 hover:text-teal-600">
                          {opp.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Stage: <span className="font-semibold text-slate-700">{opp.stage}</span> · Close Date: {opp.expected_close_date || 'TBD'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-slate-900">
                          {opp.amount.toLocaleString('vi-VN')} VND
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          {opp.probability}% Probability
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: My Work Queue & Recent Activity Timeline */}
            <div className="space-y-6">
              {/* My Work Queue */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  My Action Queue
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1">
                    <div className="font-semibold text-amber-900 flex items-center justify-between">
                      <span>Follow-up with Lan Tran</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">Overdue</span>
                    </div>
                    <p className="text-[11px] text-amber-800">
                      Delta Tech Solutions lead requested server spec quote.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1">
                    <div className="font-semibold text-blue-900 flex items-center justify-between">
                      <span>Qualify Lead: ABC Packaging</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-200 text-blue-900 font-bold">Ready to Convert</span>
                    </div>
                    <p className="text-[11px] text-blue-800">
                      BANT criteria verified. Move to Account + Deal conversion.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                    <div className="font-semibold text-slate-900 flex items-center justify-between">
                      <span>Contract review: Apex Global</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">This Week</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Negotiating custom SLA clause with Linh Tran.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feed: Recent Activities */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 mb-3 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  Recent Sales Timeline
                </h3>
                <div className="space-y-3">
                  {activities.slice(0, 4).map((a) => (
                    <div key={a.id} className="text-xs space-y-1 pb-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{a.subject}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {a.body && <p className="text-slate-600 text-[11px] line-clamp-2">{a.body}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LEADS WORKSPACE                                                        */}
      {/* ========================================================================= */}
      {activeTab === 'LEADS' && (
        <div className="space-y-4">
          {selectedLead ? (
            /* Lead Record Page Workspace (Salesforce Lightning Pattern) */
            <div className="space-y-5">
              <RecordHeader
                breadcrumbLabel="Back to All Leads"
                onBack={() => setSelectedLead(null)}
                title={`${selectedLead.first_name} ${selectedLead.last_name}`}
                subtitle={`${selectedLead.job_title || 'Contact'} at ${selectedLead.company_name}`}
                badge={{
                  text: selectedLead.status,
                  variant:
                    selectedLead.status === 'CONVERTED'
                      ? 'emerald'
                      : selectedLead.status === 'QUALIFIED'
                      ? 'teal'
                      : 'blue',
                }}
                syncStatus={selectedLead.sync_status}
                highlights={[
                  { label: 'Lead Owner', value: 'Huy Nguyen' },
                  { label: 'Phone', value: selectedLead.phone || 'N/A' },
                  { label: 'Email', value: selectedLead.email || 'N/A' },
                  { label: 'Source', value: selectedLead.source },
                  {
                    label: 'Est. Value',
                    value: `${selectedLead.estimated_value.toLocaleString('vi-VN')} VND`,
                  },
                  {
                    label: 'Created',
                    value: new Date(selectedLead.created_at).toLocaleDateString('vi-VN'),
                  },
                ]}
                actions={
                  selectedLead.status !== 'CONVERTED' ? (
                    <button
                      onClick={() => setIsConversionWizardOpen(true)}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Convert Lead
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                      ✓ Converted Account
                    </span>
                  )
                }
              />

              {/* Status Path Chevron Bar */}
              <StagePath
                steps={leadSteps}
                currentStepId={selectedLead.status}
                onSelectStep={(stepId) => {
                  if (selectedLead.status !== 'CONVERTED') {
                    handleTransitionLeadStatus(selectedLead.id, stepId);
                  }
                }}
                onMarkCurrentComplete={() => {
                  const idx = leadSteps.findIndex((s) => s.id === selectedLead.status);
                  if (idx >= 0 && idx < leadSteps.length - 1) {
                    handleTransitionLeadStatus(selectedLead.id, leadSteps[idx + 1].id);
                  }
                }}
                readOnly={selectedLead.status === 'CONVERTED'}
              />

              {/* Record Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Lead Information & Qualification */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                      Lead Details & Qualification
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">Company</span>
                        <span className="font-semibold text-slate-900">{selectedLead.company_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">Job Title</span>
                        <span className="font-semibold text-slate-900">{selectedLead.job_title || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">Email Address</span>
                        <span className="font-semibold text-slate-900">{selectedLead.email || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">Direct Phone</span>
                        <span className="font-semibold text-slate-900">{selectedLead.phone || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">Acquisition Channel</span>
                        <span className="font-semibold text-slate-900">{selectedLead.source}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">Estimated Pipeline Value</span>
                        <span className="font-semibold font-mono text-slate-900">
                          {selectedLead.estimated_value.toLocaleString('vi-VN')} VND
                        </span>
                      </div>
                    </div>

                    {selectedLead.notes && (
                      <div className="pt-3 border-t border-slate-100">
                        <span className="text-slate-400 block text-[11px] font-medium mb-1">
                          Prospect Notes & Requirements
                        </span>
                        <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                          {selectedLead.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Col: Activity Composer & Timeline */}
                <div>
                  <ActivityTimeline
                    activities={activities.filter((a) => a.lead_id === selectedLead.id)}
                    onLogActivity={handleLogActivity}
                  />
                </div>
              </div>

              {/* Conversion Wizard Modal */}
              <LeadConversionWizard
                isOpen={isConversionWizardOpen}
                onClose={() => setIsConversionWizardOpen(false)}
                lead={selectedLead}
                existingAccounts={accounts}
                onConvert={handleExecuteLeadConversion}
                onOpenRecord={(type, id) => {
                  if (type === 'OPPORTUNITY') {
                    const opp = opportunities.find((o) => o.id === id);
                    if (opp) {
                      setSelectedOpportunity(opp);
                      switchTab('OPPORTUNITIES');
                    }
                  } else {
                    const acc = accounts.find((a) => a.id === id);
                    if (acc) {
                      setSelectedAccount(acc);
                      switchTab('ACCOUNTS');
                    }
                  }
                }}
              />
            </div>
          ) : (
            /* Leads Index Table View */
            <div className="space-y-4">
              {/* Saved Views Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold mr-1.5 shrink-0">
                  Saved Views:
                </span>
                {[
                  { id: 'ALL', label: 'All Open Leads' },
                  { id: 'NEW', label: 'New Inbound' },
                  { id: 'QUALIFIED', label: 'Qualified for Conversion' },
                  { id: 'CONVERTED', label: 'Converted Leads' },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setLeadSavedView(v.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                      leadSavedView === v.id
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Search & Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search leads by name, company, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsNewLeadModalOpen(true)}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> + New Lead
                  </button>
                </div>
              </div>

              {/* Leads Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Lead Name</th>
                        <th className="py-3 px-4">Company</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Source</th>
                        <th className="py-3 px-4 font-mono">Est. Value</th>
                        <th className="py-3 px-4">Owner</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                              {lead.first_name} {lead.last_name}
                            </div>
                            <div className="text-[11px] text-slate-400">{lead.job_title || lead.email}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">{lead.company_name}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                lead.status === 'CONVERTED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : lead.status === 'QUALIFIED'
                                  ? 'bg-teal-50 text-teal-700 border-teal-200'
                                  : lead.status === 'CONTACTED'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{lead.source}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            {lead.estimated_value.toLocaleString('vi-VN')} VND
                          </td>
                          <td className="py-3 px-4 text-slate-600">Huy Nguyen</td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            {lead.status !== 'CONVERTED' && (
                              <button
                                onClick={() => {
                                  setSelectedLead(lead);
                                  setIsConversionWizardOpen(true);
                                }}
                                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded font-semibold text-[11px] transition-colors cursor-pointer"
                              >
                                Convert ➔
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ACCOUNTS (Customer 360 Workspace)                                      */}
      {/* ========================================================================= */}
      {activeTab === 'ACCOUNTS' && (
        <div className="space-y-4">
          {selectedAccount ? (
            <div className="space-y-5">
              <RecordHeader
                breadcrumbLabel="Back to All Accounts"
                onBack={() => setSelectedAccount(null)}
                title={selectedAccount.name}
                subtitle={`${selectedAccount.industry || 'Enterprise'} · ${selectedAccount.segment}`}
                badge={{ text: selectedAccount.account_type, variant: 'blue' }}
                syncStatus={selectedAccount.sync_status}
                highlights={[
                  { label: 'Account Owner', value: 'Huy Nguyen' },
                  { label: 'Direct Phone', value: selectedAccount.phone || 'N/A' },
                  { label: 'Website', value: selectedAccount.website || 'N/A' },
                  { label: 'Segment', value: selectedAccount.segment },
                  {
                    label: 'Open Pipeline',
                    value: `${opportunities
                      .filter((o) => o.account_id === selectedAccount.id && o.stage !== 'CLOSED_LOST')
                      .reduce((s, o) => s + (o.amount || 0), 0)
                      .toLocaleString('vi-VN')} VND`,
                  },
                  {
                    label: 'Contacts',
                    value: `${contacts.filter((c) => c.account_id === selectedAccount.id).length} Linked`,
                  },
                ]}
                actions={
                  <button
                    onClick={() => setIsNewOpportunityModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Opportunity
                  </button>
                }
              />

              {/* 2-Column Customer 360 Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Details, Related Contacts & Related Opportunities */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Related Contacts Table */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        Contacts at this Company
                      </h3>
                      <button
                        onClick={() => setIsNewContactModalOpen(true)}
                        className="text-xs text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                      >
                        + Add Contact
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {contacts
                        .filter((c) => c.account_id === selectedAccount.id)
                        .map((c) => (
                          <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-2">
                                <span>{c.first_name} {c.last_name}</span>
                                {c.is_primary && (
                                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold">
                                    Primary Decision Maker
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                {c.job_title || 'Contact'} · {c.email} · {c.phone}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Related Opportunities */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                        Commercial Opportunities
                      </h3>
                      <button
                        onClick={() => setIsNewOpportunityModalOpen(true)}
                        className="text-xs text-teal-700 hover:text-teal-900 font-semibold cursor-pointer"
                      >
                        + New Deal
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {opportunities
                        .filter((o) => o.account_id === selectedAccount.id)
                        .map((o) => (
                          <div
                            key={o.id}
                            onClick={() => {
                              setSelectedOpportunity(o);
                              switchTab('OPPORTUNITIES');
                            }}
                            className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-50 cursor-pointer p-1 rounded transition-colors"
                          >
                            <div>
                              <div className="font-semibold text-slate-900">{o.name}</div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                Stage: <span className="font-bold text-slate-700">{o.stage}</span> · Close: {o.expected_close_date}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold font-mono text-slate-900">
                                {o.amount.toLocaleString('vi-VN')} VND
                              </div>
                              <div className="text-[10px] text-slate-500">{o.probability}% win prob.</div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Right Col: Timeline */}
                <div>
                  <ActivityTimeline
                    activities={activities.filter((a) => a.account_id === selectedAccount.id)}
                    onLogActivity={handleLogActivity}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Accounts Index Table */
            <div className="space-y-4">
              {/* Saved Views */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold mr-1.5 shrink-0">
                  Saved Views:
                </span>
                {[
                  { id: 'ALL', label: 'All Accounts' },
                  { id: 'CUSTOMERS', label: 'Active Customers' },
                  { id: 'PROSPECTS', label: 'Commercial Prospects' },
                  { id: 'STRATEGIC', label: 'Enterprise Accounts' },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setAccountSavedView(v.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                      accountSavedView === v.id
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Accounts Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Account Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Industry</th>
                      <th className="py-3 px-4">Segment</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Sync Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAccounts.map((acc) => (
                      <tr
                        key={acc.id}
                        onClick={() => setSelectedAccount(acc)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                          {acc.name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {acc.account_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{acc.industry || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{acc.segment}</td>
                        <td className="py-3 px-4 text-slate-500">{acc.phone || 'N/A'}</td>
                        <td className="py-3 px-4 text-emerald-600 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Healthy
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. OPPORTUNITIES WORKSPACE (Kanban & Table)                              */}
      {/* ========================================================================= */}
      {activeTab === 'OPPORTUNITIES' && (
        <div className="space-y-4">
          {selectedOpportunity ? (
            /* Opportunity Record Page (Salesforce Lightning Stage-driven) */
            <div className="space-y-5">
              <RecordHeader
                breadcrumbLabel="Back to All Opportunities"
                onBack={() => setSelectedOpportunity(null)}
                title={selectedOpportunity.name}
                subtitle={`Commercial Deal · ${
                  accounts.find((a) => a.id === selectedOpportunity.account_id)?.name || 'Account'
                }`}
                badge={{
                  text: selectedOpportunity.stage,
                  variant:
                    selectedOpportunity.stage === 'CLOSED_WON'
                      ? 'emerald'
                      : selectedOpportunity.stage === 'CLOSED_LOST'
                      ? 'rose'
                      : 'teal',
                }}
                syncStatus={selectedOpportunity.sync_status}
                highlights={[
                  {
                    label: 'Amount',
                    value: `${selectedOpportunity.amount.toLocaleString('vi-VN')} ${
                      selectedOpportunity.currency
                    }`,
                  },
                  { label: 'Probability', value: `${selectedOpportunity.probability}%` },
                  { label: 'Expected Close', value: selectedOpportunity.expected_close_date || 'TBD' },
                  { label: 'Owner', value: 'Huy Nguyen' },
                  {
                    label: 'Account',
                    value:
                      accounts.find((a) => a.id === selectedOpportunity.account_id)?.name || 'N/A',
                  },
                  { label: 'Source', value: selectedOpportunity.source || 'Direct' },
                ]}
                actions={
                  selectedOpportunity.stage !== 'CLOSED_WON' &&
                  selectedOpportunity.stage !== 'CLOSED_LOST' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCloseWonOpportunity(selectedOpportunity.id)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        🏆 Mark as Won
                      </button>
                      <button
                        onClick={() => {
                          setLostOppTarget(selectedOpportunity);
                          setIsClosedLostModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Mark as Lost
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs font-bold text-slate-700">
                      Status: {selectedOpportunity.stage}
                    </span>
                  )
                }
              />

              {/* Interactive Stage Progression Path */}
              <StagePath
                steps={opportunitySteps}
                currentStepId={selectedOpportunity.stage}
                isTerminalWon={selectedOpportunity.stage === 'CLOSED_WON'}
                isTerminalLost={selectedOpportunity.stage === 'CLOSED_LOST'}
                onSelectStep={(stepId) =>
                  handleTransitionOpportunityStage(selectedOpportunity.id, stepId)
                }
                onMarkCurrentComplete={() => {
                  const idx = opportunitySteps.findIndex(
                    (s) => s.id === selectedOpportunity.stage
                  );
                  if (idx >= 0 && idx < opportunitySteps.length - 1) {
                    handleTransitionOpportunityStage(
                      selectedOpportunity.id,
                      opportunitySteps[idx + 1].id
                    );
                  }
                }}
              />

              {/* Workspace Split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Guidance for Current Stage */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                      Stage Guidance & Recommended Next Actions
                    </h3>
                    <div className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-lg text-xs space-y-2">
                      <div className="font-semibold text-teal-900">
                        Active Stage: {selectedOpportunity.stage}
                      </div>
                      <p className="text-teal-800 text-[11px]">
                        {selectedOpportunity.stage === 'PROPOSAL'
                          ? 'Review commercial terms and warranty conditions with the designated Decision Maker before proceeding to Negotiation.'
                          : selectedOpportunity.stage === 'NEGOTIATION'
                          ? 'Confirm executive purchase order signing and payment installment terms.'
                          : 'Gather customer operational requirements and map necessary product quantities.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <ActivityTimeline
                    activities={activities.filter(
                      (a) => a.opportunity_id === selectedOpportunity.id
                    )}
                    onLogActivity={handleLogActivity}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Opportunities Index (Switchable Kanban vs Table) */
            <div className="space-y-4">
              {/* Header with Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                {/* Saved Views Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold mr-1.5 shrink-0">
                    Filter:
                  </span>
                  {[
                    { id: 'ALL', label: 'All Deals' },
                    { id: 'OPEN', label: 'Open Pipeline' },
                    { id: 'WON', label: 'Closed Won' },
                    { id: 'LOST', label: 'Closed Lost' },
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setOppSavedView(v.id as any)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
                        oppSavedView === v.id
                          ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>

                {/* Table vs Kanban Toggle */}
                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                    <button
                      onClick={() => setOppViewMode('KANBAN')}
                      className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                        oppViewMode === 'KANBAN'
                          ? 'bg-white shadow-2xs text-slate-900 font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" /> Kanban
                    </button>
                    <button
                      onClick={() => setOppViewMode('TABLE')}
                      className={`p-1.5 rounded text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                        oppViewMode === 'TABLE'
                          ? 'bg-white shadow-2xs text-slate-900 font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" /> Table
                    </button>
                  </div>

                  <button
                    onClick={() => setIsNewOpportunityModalOpen(true)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> + New Opportunity
                  </button>
                </div>
              </div>

              {oppViewMode === 'KANBAN' ? (
                /* Interactive Stage Kanban */
                <OpportunityKanban
                  opportunities={filteredOpportunities}
                  accounts={accounts}
                  onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
                  onMoveStage={(oppId, targetStage) =>
                    handleTransitionOpportunityStage(oppId, targetStage)
                  }
                  onCloseLostPrompt={(opp) => {
                    setLostOppTarget(opp);
                    setIsClosedLostModalOpen(true);
                  }}
                />
              ) : (
                /* Opportunities Table */
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4">Opportunity</th>
                        <th className="py-3 px-4">Account</th>
                        <th className="py-3 px-4">Stage</th>
                        <th className="py-3 px-4 font-mono">Amount</th>
                        <th className="py-3 px-4">Win Prob.</th>
                        <th className="py-3 px-4">Expected Close</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOpportunities.map((opp) => (
                        <tr
                          key={opp.id}
                          onClick={() => setSelectedOpportunity(opp)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                            {opp.name}
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {accounts.find((a) => a.id === opp.account_id)?.name || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-100 text-slate-800 border-slate-200">
                              {opp.stage}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                            {opp.amount.toLocaleString('vi-VN')} {opp.currency}
                          </td>
                          <td className="py-3 px-4 font-mono">{opp.probability}%</td>
                          <td className="py-3 px-4 text-slate-500">{opp.expected_close_date || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CONTACTS WORKSPACE                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'CONTACTS' && (
        <div className="space-y-4">
          {selectedContact ? (
            <div className="space-y-5">
              <RecordHeader
                breadcrumbLabel="Back to All Contacts"
                onBack={() => setSelectedContact(null)}
                title={`${selectedContact.first_name} ${selectedContact.last_name}`}
                subtitle={`${selectedContact.job_title || 'Contact'} at ${
                  accounts.find((a) => a.id === selectedContact.account_id)?.name || 'Independent'
                }`}
                badge={{
                  text: selectedContact.is_primary ? 'Primary Decision Maker' : 'Contact Member',
                  variant: selectedContact.is_primary ? 'emerald' : 'slate',
                }}
                highlights={[
                  { label: 'Email', value: selectedContact.email || 'N/A' },
                  { label: 'Phone', value: selectedContact.phone || 'N/A' },
                  { label: 'Department', value: selectedContact.department || 'N/A' },
                  {
                    label: 'Associated Company',
                    value:
                      accounts.find((a) => a.id === selectedContact.account_id)?.name || 'N/A',
                  },
                ]}
              />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
                    Contact Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">First Name</span>
                      <span className="font-semibold text-slate-900">{selectedContact.first_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Last Name</span>
                      <span className="font-semibold text-slate-900">{selectedContact.last_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Job Title</span>
                      <span className="font-semibold text-slate-900">{selectedContact.job_title || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Department</span>
                      <span className="font-semibold text-slate-900">{selectedContact.department || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <ActivityTimeline
                    activities={activities.filter((a) => a.contact_id === selectedContact.id)}
                    onLogActivity={handleLogActivity}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Contacts Directory ({contacts.length})
                </span>
                <button
                  onClick={() => setIsNewContactModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> + New Contact
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Account</th>
                      <th className="py-3 px-4">Job Title</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contacts.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelectedContact(c)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                        <td className="py-3 px-4 font-semibold text-slate-900 group-hover:text-teal-600 transition-colors">
                          {c.first_name} {c.last_name}
                        </td>
                        <td className="py-3 px-4 text-blue-700 font-medium">
                          {accounts.find((a) => a.id === c.account_id)?.name || 'N/A'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{c.job_title || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-500">{c.email || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-500">{c.phone || 'N/A'}</td>
                        <td className="py-3 px-4">
                          {c.is_primary ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Primary Decision Maker
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Member</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ACTIVITIES WORKSPACE (Unified Feed)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'ACTIVITIES' && (
        <div className="space-y-4">
          <ActivityTimeline activities={activities} onLogActivity={handleLogActivity} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS: New Lead, New Account, New Contact, New Opp, Closed Lost         */}
      {/* ========================================================================= */}

      {/* New Lead Modal */}
      <Modal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        title="Create New Lead"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data = {
              first_name: (form.elements.namedItem('first_name') as HTMLInputElement).value,
              last_name: (form.elements.namedItem('last_name') as HTMLInputElement).value,
              company_name: (form.elements.namedItem('company_name') as HTMLInputElement).value,
              job_title: (form.elements.namedItem('job_title') as HTMLInputElement).value,
              email: (form.elements.namedItem('email') as HTMLInputElement).value,
              phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
              estimated_value: Number(
                (form.elements.namedItem('estimated_value') as HTMLInputElement).value || 50000000
              ),
              notes: (form.elements.namedItem('notes') as HTMLTextAreaElement).value,
              source: (form.elements.namedItem('source') as HTMLSelectElement).value,
            };
            handleCreateLead(data);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                required
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Company *</label>
            <input
              type="text"
              name="company_name"
              required
              className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Job Title</label>
              <input
                type="text"
                name="job_title"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Lead Source</label>
              <select
                name="source"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="WEBSITE">Website Form</option>
                <option value="REFERRAL">Referral / Partner</option>
                <option value="EVENT">Trade Expo</option>
                <option value="OUTBOUND">Outbound Campaign</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Estimated Value (VND)
            </label>
            <input
              type="number"
              name="estimated_value"
              defaultValue={50000000}
              className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsNewLeadModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
            >
              Create Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* New Opportunity Modal */}
      <Modal
        isOpen={isNewOpportunityModalOpen}
        onClose={() => setIsNewOpportunityModalOpen(false)}
        title="Create New Opportunity"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data = {
              name: (form.elements.namedItem('name') as HTMLInputElement).value,
              account_id: Number((form.elements.namedItem('account_id') as HTMLSelectElement).value),
              stage: (form.elements.namedItem('stage') as HTMLSelectElement).value as any,
              amount: Number((form.elements.namedItem('amount') as HTMLInputElement).value),
              expected_close_date: (form.elements.namedItem('close_date') as HTMLInputElement).value,
            };
            handleCreateOpportunity(data);
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Deal Title *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Q4 Logistics Equipment Expansion"
              className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Account *</label>
            <select
              name="account_id"
              className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 bg-white"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Deal Amount (VND)
              </label>
              <input
                type="number"
                name="amount"
                defaultValue={150000000}
                required
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Stage</label>
              <select
                name="stage"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="PROSPECTING">Prospecting (10%)</option>
                <option value="QUALIFICATION">Qualification (25%)</option>
                <option value="DISCOVERY">Discovery (40%)</option>
                <option value="PROPOSAL">Proposal (60%)</option>
                <option value="NEGOTIATION">Negotiation (80%)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Expected Close Date
            </label>
            <input
              type="date"
              name="close_date"
              defaultValue={new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]}
              className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsNewOpportunityModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
            >
              Create Deal
            </button>
          </div>
        </form>
      </Modal>

      {/* New Account Modal */}
      <Modal
        isOpen={isNewAccountModalOpen}
        onClose={() => setIsNewAccountModalOpen(false)}
        title="Add Commercial Account"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const newAcc: Account = {
              id: Date.now(),
              name: (form.elements.namedItem('name') as HTMLInputElement).value,
              account_type: (form.elements.namedItem('type') as HTMLSelectElement).value as any,
              industry: (form.elements.namedItem('industry') as HTMLInputElement).value,
              phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
              website: (form.elements.namedItem('website') as HTMLInputElement).value,
              segment: (form.elements.namedItem('segment') as HTMLSelectElement).value,
              status: 'ACTIVE',
              owner_id: '1',
              organization_id: 'default',
              sync_status: 'HEALTHY',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setAccounts((prev) => [newAcc, ...prev]);
            toast.success(`Account '${newAcc.name}' added.`);
            setIsNewAccountModalOpen(false);
          }}
          className="space-y-3 text-xs"
        >
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Account Name *
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Account Type
              </label>
              <select
                name="type"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="PROSPECT">Prospect</option>
                <option value="CUSTOMER">Customer</option>
                <option value="PARTNER">Partner</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Segment</label>
              <select
                name="segment"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="MID_MARKET">Mid-Market</option>
                <option value="ENTERPRISE">Enterprise</option>
                <option value="STRATEGIC">Strategic</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Industry</label>
              <input
                type="text"
                name="industry"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Website</label>
            <input
              type="text"
              name="website"
              placeholder="https://..."
              className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsNewAccountModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
            >
              Save Account
            </button>
          </div>
        </form>
      </Modal>

      {/* New Contact Modal */}
      <Modal
        isOpen={isNewContactModalOpen}
        onClose={() => setIsNewContactModalOpen(false)}
        title="Add Contact"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const newCont: Contact = {
              id: Date.now(),
              first_name: (form.elements.namedItem('first_name') as HTMLInputElement).value,
              last_name: (form.elements.namedItem('last_name') as HTMLInputElement).value,
              job_title: (form.elements.namedItem('job_title') as HTMLInputElement).value,
              email: (form.elements.namedItem('email') as HTMLInputElement).value,
              phone: (form.elements.namedItem('phone') as HTMLInputElement).value,
              account_id: Number(
                (form.elements.namedItem('account_id') as HTMLSelectElement).value
              ),
              is_primary: (form.elements.namedItem('is_primary') as HTMLInputElement).checked,
              owner_id: '1',
              organization_id: 'default',
              sync_status: 'HEALTHY',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setContacts((prev) => [newCont, ...prev]);
            toast.success(`Contact '${newCont.first_name} ${newCont.last_name}' added.`);
            setIsNewContactModalOpen(false);
          }}
          className="space-y-3 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                name="first_name"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="last_name"
                required
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Account *</label>
            <select
              name="account_id"
              className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 bg-white"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Job Title</label>
              <input
                type="text"
                name="job_title"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone</label>
              <input
                type="text"
                name="phone"
                className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
            />
          </div>
          <label className="flex items-center gap-2 pt-1 text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              name="is_primary"
              className="rounded border-slate-300 text-slate-900"
            />
            <span>Set as primary decision maker</span>
          </label>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsNewContactModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
            >
              Save Contact
            </button>
          </div>
        </form>
      </Modal>

      {/* Closed Lost Mandatory Loss Reason Modal */}
      <Modal
        isOpen={isClosedLostModalOpen}
        onClose={() => setIsClosedLostModalOpen(false)}
        title="Mark Opportunity as Closed Lost"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600 text-[11px]">
            Please specify the commercial reason for closing this opportunity as lost to maintain
            win/loss intelligence.
          </p>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Loss Reason *
            </label>
            <select
              value={lossReasonInput}
              onChange={(e) => setLossReasonInput(e.target.value)}
              className="w-full text-xs px-3 py-1.5 rounded border border-slate-300 bg-white"
            >
              <option value="Price">Price / Budget Constraint</option>
              <option value="Competitor">Lost to Competitor</option>
              <option value="Timing">Timing / Project Postponed</option>
              <option value="No decision">No Decision / Lack of Executive Buy-in</option>
              <option value="Other">Other Reason</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Additional Notes
            </label>
            <textarea
              rows={2}
              value={lossNotesInput}
              onChange={(e) => setLossNotesInput(e.target.value)}
              placeholder="Competitor name, feedback, or follow-up timeframe..."
              className="w-full text-xs px-3 py-1.5 rounded border border-slate-300"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsClosedLostModalOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCloseLostOpportunity}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
            >
              Confirm Closed Lost
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
