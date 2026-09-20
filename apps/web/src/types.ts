export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  created_at: string;
  total_spent?: number;
  orders_count?: number;
}

export interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  company_name: string;
  job_title?: string;
  email?: string;
  phone?: string;
  source: string;
  status: 'NEW' | 'CONTACTED' | 'QUALIFYING' | 'QUALIFIED' | 'UNQUALIFIED' | 'CONVERTED';
  estimated_value: number;
  notes?: string;
  owner_id: string;
  organization_id: string;
  provider_reference?: string;
  sync_status: 'HEALTHY' | 'PENDING' | 'FAILED';
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: number;
  name: string;
  account_type: 'PROSPECT' | 'CUSTOMER' | 'PARTNER' | 'SUPPLIER_RELATIONSHIP' | 'OTHER';
  industry?: string;
  website?: string;
  phone?: string;
  billing_address?: string;
  shipping_address?: string;
  status: string;
  segment: string;
  owner_id: string;
  organization_id: string;
  provider_reference?: string;
  sync_status: 'HEALTHY' | 'PENDING' | 'FAILED';
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  job_title?: string;
  department?: string;
  email?: string;
  phone?: string;
  is_primary: boolean;
  account_id?: number;
  owner_id: string;
  organization_id: string;
  provider_reference?: string;
  sync_status: 'HEALTHY' | 'PENDING' | 'FAILED';
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: number;
  name: string;
  account_id?: number;
  stage: 'PROSPECTING' | 'QUALIFICATION' | 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  amount: number;
  currency: string;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  source?: string;
  loss_reason?: string;
  owner_id: string;
  organization_id: string;
  provider_reference?: string;
  sync_status: 'HEALTHY' | 'PENDING' | 'FAILED';
  created_at: string;
  updated_at: string;
}

export interface OpportunityContactRole {
  id: number;
  opportunity_id: number;
  contact_id: number;
  role: 'DECISION_MAKER' | 'INFLUENCER' | 'CHAMPION' | 'PROCUREMENT' | 'TECHNICAL_CONTACT' | 'OTHER';
  is_primary: boolean;
}

export interface Activity {
  id: number;
  subject: string;
  type: 'TASK' | 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE' | 'SYSTEM_EVENT';
  status: 'COMPLETED' | 'SCHEDULED' | 'OVERDUE';
  account_id?: number;
  contact_id?: number;
  lead_id?: number;
  opportunity_id?: number;
  owner_id: string;
  due_at?: string;
  completed_at?: string;
  body?: string;
  metadata_json?: string;
  created_at: string;
}


export type DealStage =
  | 'DISCOVERY'
  | 'VALIDATION'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export interface Deal {
  id: string;
  customer_id: number;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  expected_close: string;
  created_at: string;
}

export type ActivityType = 'CALL' | 'EMAIL' | 'NOTE' | 'MEETING';

export interface CustomerActivity {
  id: string;
  customer_id: number;
  type: ActivityType;
  title: string;
  description: string;
  actor: string;
  timestamp: string;
  status: 'COMPLETED' | 'SCHEDULED';
}

export interface CustomerDocument {
  id: string;
  customer_id: number;
  name: string;
  type: string;
  size: string;
  uploaded_at: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  cost: number;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  warehouse: string;
  quantity: number;
  reorder_level: number;
  max_capacity?: number;
  updated_at?: string;
}

export interface InventoryMovement {
  id: string;
  product_id: number;
  sku: string;
  product_name: string;
  quantity_delta: number;
  previous_stock: number;
  new_stock: number;
  warehouse: string;
  reason: string;
  user: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  type: 'REVENUE' | 'COGS' | 'EXPENSE' | 'ASSET';
  account: string;
  description: string;
  amount: number;
  isCredit: boolean;
  status: 'POSTED' | 'DRAFT';
}

export type OrderState = 'OPEN' | 'CANCELLED' | 'ARCHIVED';
export type PaymentState = 'UNPAID' | 'PENDING' | 'AUTHORIZED' | 'PARTIALLY_PAID' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED' | 'VOIDED';
export type FulfillmentState = 'UNFULFILLED' | 'PARTIALLY_FULFILLED' | 'FULFILLED' | 'ON_HOLD' | 'CANCELLED';
export type ReturnState = 'NONE' | 'REQUESTED' | 'IN_PROGRESS' | 'INSPECTION_COMPLETE' | 'COMPLETED' | 'DECLINED';
export type SyncStatus = 'HEALTHY' | 'PENDING' | 'SYNCING' | 'DEGRADED' | 'FAILED' | 'DISCONNECTED';

export interface OrderItem {
  id?: number;
  product_id?: number;
  variant_id?: number;
  quantity: number;
  unit_price: number;
  name?: string;
  product_name?: string;
  sku?: string;
  line_total?: number;
  fulfilled_quantity?: number;
  returned_quantity?: number;
  refunded_quantity?: number;
}

export interface OrderTransaction {
  id: number;
  order_id: number;
  type: string;
  status: string;
  amount: number;
  currency: string;
  payment_method: string;
  provider_transaction_id?: string;
  processed_at: string;
  reference?: string;
  notes?: string;
}

export interface OrderFulfillment {
  id: number;
  order_id: number;
  status: string;
  location_reference: string;
  tracking_company?: string;
  tracking_number?: string;
  tracking_url?: string;
  shipped_at?: string;
  delivered_at?: string;
  sync_status: string;
  created_at: string;
}

export interface OrderReturnLine {
  id: number;
  return_id: number;
  order_line_id: number;
  quantity: number;
  reason: string;
  condition: string;
  restock_disposition: string;
}

export interface OrderReturn {
  id: number;
  order_id: number;
  return_number: string;
  status: string;
  reason_summary?: string;
  requested_at: string;
  approved_at?: string;
  received_at?: string;
  closed_at?: string;
  sync_status: string;
  lines: OrderReturnLine[];
}

export interface OrderRefund {
  id: number;
  order_id: number;
  return_id?: number;
  refund_number: string;
  amount: number;
  currency: string;
  status: string;
  reason?: string;
  refund_method: string;
  processed_at: string;
  created_at: string;
}

export interface OrderTimelineEvent {
  id: number;
  order_id: number;
  event_type: string;
  actor_id: string;
  summary: string;
  metadata_json?: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id?: number;
  customer_name?: string;
  customer_email?: string;
  customer_snapshot?: Record<string, any>;
  currency?: string;
  subtotal?: number;
  discount_total?: number;
  shipping_total?: number;
  tax_total?: number;
  grand_total?: number;
  total_amount: number;

  order_state?: OrderState;
  payment_state?: PaymentState;
  fulfillment_state?: FulfillmentState;
  return_state?: ReturnState;
  sync_status?: SyncStatus;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

  source_type?: string;
  source_provider_id?: string;
  external_order_id?: string;
  shipping_address?: string;
  payment_method?: string;
  provider?: string;
  carrier?: string;
  tracking_number?: string;
  cancellation_reason?: string;
  notes?: string;
  tags?: string;
  placed_at?: string;
  cancelled_at?: string;
  archived_at?: string;
  last_synced_at?: string;
  created_at: string;
  updated_at?: string;

  items: OrderItem[];
  lines?: OrderItem[];
  transactions?: OrderTransaction[];
  fulfillments?: OrderFulfillment[];
  returns?: OrderReturn[];
  refunds?: OrderRefund[];
  events?: OrderTimelineEvent[];
}

export interface KpiSummary {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  total_customers: number;
  low_stock_count: number;
}

export interface WorkflowRule {
  id: number;
  name: string;
  event_pattern: string;
  action_type: string;
  action_payload: string;
  is_active: boolean;
  created_at: string;
  description?: string;
}

export interface WorkflowLog {
  id: number;
  rule_name: string;
  event_name: string;
  status: string;
  output: string;
  created_at: string;
}

export type ProviderCategory = 'PAYMENTS' | 'COMMUNICATIONS' | 'LOGISTICS' | 'CRM' | 'CUSTOM';

export interface IntegrationProvider {
  id: string;
  name: string;
  category: ProviderCategory;
  description: string;
  status: 'CONNECTED' | 'CONFIGURED' | 'AVAILABLE';
  environment: 'SANDBOX' | 'PRODUCTION';
  iconType: string;
  accentColor: string;
  apiKey?: string;
  webhookUrl?: string;
  signingSecret?: string;
  autoSync: boolean;
  latencyMs?: number;
  lastTested?: string;
  customHeaders?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  linkTab?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: 'Platform Admin' | 'Operations Manager' | 'Financial Controller' | 'Security Auditor';
  avatarInitials: string;
  organization: string;
}
