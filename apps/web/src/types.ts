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

// --------------------------------------------------------------------------
// ServiceNow Workflow Studio Canonical Types
// --------------------------------------------------------------------------
export interface ActionInputField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  description?: string;
  default?: any;
}

export interface ActionOutputField {
  name: string;
  label: string;
  type: string;
  description?: string;
}

export interface ActionDefinition {
  id: string;
  organization_id: string;
  key: string;
  name: string;
  description?: string;
  category: 'CRM' | 'OMS' | 'ERP' | 'BI' | 'NOTIFICATIONS' | 'PROVIDERS' | 'UTILITIES';
  input_schema: ActionInputField[];
  output_schema: ActionOutputField[];
  execution_type: 'INTERNAL_CAPABILITY' | 'PROVIDER_CAPABILITY' | 'WORKFLOW_UTILITY';
  capability_reference: string;
  connection_type_required?: string;
  version: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
  usage_count: number;
  created_at: string;
}

export interface SubflowDefinition {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  input_schema: ActionInputField[];
  output_schema: ActionOutputField[];
  steps: any[];
  active_version_id?: string;
  draft_version_id?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
  created_at: string;
}

export interface ConditionRule {
  field_ref: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'CONTAINS' | 'IS_EMPTY';
  value: any;
}

export interface ConditionGroup {
  operator: 'AND' | 'OR';
  rules: ConditionRule[];
}

export interface StepDefinition {
  step_key: string;
  step_type: 'ACTION' | 'CONDITION' | 'FOR_EACH' | 'SUBFLOW' | 'WAIT' | 'APPROVAL';
  name: string;
  action_key?: string;
  connection_reference?: string;
  inputs?: Record<string, any>;
  condition_group?: ConditionGroup;
  true_steps?: StepDefinition[];
  false_steps?: StepDefinition[];
  for_each_collection?: string;
  for_each_item_var?: string;
  for_each_steps?: StepDefinition[];
  subflow_id?: string;
  subflow_inputs?: Record<string, any>;
  wait_type?: 'DURATION' | 'UNTIL_DATETIME' | 'EVENT';
  wait_duration_sec?: number;
  wait_event_type?: string;
  approval_role?: string;
  approval_timeout_sec?: number;
  on_error_policy?: 'FAIL_FLOW' | 'RETRY_THEN_FAIL' | 'CONTINUE';
  timeout_seconds?: number;
  retry_max_attempts?: number;
  retry_backoff?: 'EXPONENTIAL' | 'FIXED';
}

export interface TriggerDefinition {
  trigger_type: 'DOMAIN_EVENT' | 'SCHEDULE' | 'MANUAL' | 'WEBHOOK';
  event_name?: string;
  schedule_frequency?: 'ONCE' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  schedule_time?: string;
  schedule_cron?: string;
  webhook_path?: string;
  manual_input_schema?: ActionInputField[];
  conditions?: ConditionGroup;
  enabled: boolean;
}

export interface FlowVersion {
  id: string;
  flow_definition_id: string;
  version_number: number;
  state: 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED';
  trigger_definition: TriggerDefinition;
  flow_structure: StepDefinition[];
  created_by: string;
  created_at: string;
  published_at?: string;
}

export interface FlowDefinition {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  category: string;
  owner_name: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  active_version_id?: string;
  draft_version_id?: string;
  active_version?: FlowVersion;
  draft_version?: FlowVersion;
  last_run_at?: string;
  last_run_status?: string;
  run_count: number;
  created_at: string;
  updated_at: string;
}

export interface StepRun {
  id: string;
  flow_run_id: string;
  step_key: string;
  step_type: string;
  step_name: string;
  status: 'PENDING' | 'RUNNING' | 'WAITING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED' | 'CANCELLED';
  attempt: number;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  resolved_inputs: Record<string, any>;
  outputs: Record<string, any>;
  error_code?: string;
  error_message?: string;
}

export interface FlowRun {
  id: string;
  organization_id: string;
  flow_definition_id: string;
  flow_version_id: string;
  flow_name: string;
  version_number: number;
  trigger_type: string;
  trigger_reference?: string;
  status: 'QUEUED' | 'RUNNING' | 'WAITING' | 'PAUSED' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  current_step_key?: string;
  error_summary?: string;
  correlation_id: string;
  step_runs: StepRun[];
  created_at: string;
}

export interface ApprovalRequest {
  id: string;
  organization_id: string;
  flow_run_id: string;
  step_run_id: string;
  flow_name: string;
  approver_type: string;
  approver_reference: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  decision?: string;
  comment?: string;
  entity_reference: {
    entity_type?: string;
    entity_id?: string;
    order_number?: string;
    customer_name?: string;
    amount?: number;
    currency?: string;
    summary?: string;
    [key: string]: any;
  };
  requested_at: string;
  responded_at?: string;
  responded_by?: string;
}

export interface FlowTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  trigger_summary: string;
  template_structure: {
    trigger: TriggerDefinition;
    steps: StepDefinition[];
  };
  created_at: string;
}

export interface FlowValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
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

// ====================================================================
// CANONICAL ERP DOMAIN TYPES (SAP Fiori / S/4HANA Interaction Patterns)
// ====================================================================

export interface StorageLocation {
  id: number;
  warehouse_id: number;
  code: string;
  name: string;
  type: 'MAIN' | 'RETURNS' | 'QUALITY_INSPECTION' | 'BLOCKED_STOCK';
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  address?: string;
  timezone: string;
  provider_reference?: string;
  sync_status: 'SYNCED' | 'PENDING' | 'FAILED';
  created_at: string;
  storage_locations?: StorageLocation[];
}

export interface InventoryPosition {
  id: number;
  organization_id: string;
  product_reference: string;
  product_name?: string;
  warehouse_id: number;
  storage_location_id?: number;
  on_hand_quantity: number;
  reserved_quantity: number;
  blocked_quantity: number;
  incoming_quantity: number;
  available_quantity: number;
  unit: string;
  reorder_threshold: number;
  unit_cost: number;
  stock_status: 'HEALTHY' | 'LOW' | 'OUT_OF_STOCK' | 'BLOCKED' | 'OVERSTOCK';
  version: number;
  created_at: string;
  updated_at?: string;
}

export interface GoodsMovement {
  id: number;
  movement_number: string;
  movement_type:
    | 'GOODS_RECEIPT'
    | 'GOODS_ISSUE'
    | 'TRANSFER_OUT'
    | 'TRANSFER_IN'
    | 'ADJUSTMENT_IN'
    | 'ADJUSTMENT_OUT'
    | 'RETURN_TO_SUPPLIER'
    | 'RESERVATION_CONSUMPTION';
  product_reference: string;
  quantity: number;
  unit: string;
  from_warehouse_id?: number;
  to_warehouse_id?: number;
  reference_type?: string;
  reference_id?: string;
  reason_code?: string;
  note?: string;
  actor_id: string;
  posted_at: string;
  sync_status: string;
}

export interface Supplier {
  id: number;
  supplier_code: string;
  name: string;
  status: 'ACTIVE' | 'ON_HOLD' | 'INACTIVE';
  tax_identifier?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms: string;
  currency: string;
  provider_reference?: string;
  sync_status: 'SYNCED' | 'PENDING' | 'FAILED';
  created_at: string;
}

export interface PurchaseRequisitionLine {
  id: number;
  requisition_id: number;
  product_reference: string;
  description_snapshot?: string;
  quantity: number;
  ordered_quantity: number;
  unit: string;
  estimated_unit_cost: number;
  currency: string;
  preferred_supplier_id?: number;
  warehouse_id?: number;
}

export interface PurchaseRequisition {
  id: number;
  requisition_number: string;
  requester_id: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PARTIALLY_ORDERED' | 'ORDERED' | 'CANCELLED';
  needed_by?: string;
  reason?: string;
  rejection_reason?: string;
  created_at: string;
  lines: PurchaseRequisitionLine[];
}

export interface PurchaseOrderLine {
  id: number;
  purchase_order_id: number;
  product_reference: string;
  description_snapshot?: string;
  ordered_quantity: number;
  received_quantity: number;
  unit: string;
  unit_cost: number;
  line_total: number;
  expected_delivery_date?: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  buyer_id: string;
  status:
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'SENT'
    | 'PARTIALLY_RECEIVED'
    | 'RECEIVED'
    | 'CANCELLED'
    | 'CLOSED';
  currency: string;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  grand_total: number;
  order_date: string;
  expected_delivery_date?: string;
  warehouse_id: number;
  provider_reference?: string;
  sync_status: 'SYNCED' | 'PENDING' | 'FAILED';
  notes?: string;
  created_at: string;
  lines: PurchaseOrderLine[];
  supplier?: Supplier;
}

export interface GoodsReceiptLine {
  id: number;
  goods_receipt_id: number;
  purchase_order_line_id?: number;
  product_reference: string;
  expected_quantity: number;
  received_quantity: number;
  accepted_quantity: number;
  blocked_quantity: number;
  damaged_quantity: number;
  unit: string;
  storage_location_id?: number;
  note?: string;
}

export interface GoodsReceipt {
  id: number;
  receipt_number: string;
  purchase_order_id?: number;
  warehouse_id: number;
  status: 'DRAFT' | 'POSTED' | 'REVERSED';
  received_at: string;
  received_by: string;
  supplier_delivery_reference?: string;
  note?: string;
  provider_reference?: string;
  sync_status: string;
  created_at: string;
  lines: GoodsReceiptLine[];
}

export interface StockTransferLine {
  id: number;
  stock_transfer_id: number;
  product_reference: string;
  requested_quantity: number;
  shipped_quantity: number;
  received_quantity: number;
  unit: string;
}

export interface StockTransfer {
  id: number;
  transfer_number: string;
  from_warehouse_id: number;
  to_warehouse_id: number;
  status: 'DRAFT' | 'READY' | 'IN_TRANSIT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  requested_at: string;
  shipped_at?: string;
  received_at?: string;
  created_by: string;
  notes?: string;
  created_at: string;
  lines: StockTransferLine[];
}

export interface SupplierInvoice {
  id: number;
  invoice_number: string;
  supplier_id: number;
  purchase_order_id?: number;
  status:
    | 'DRAFT'
    | 'PENDING_REVIEW'
    | 'MATCHED'
    | 'MISMATCH'
    | 'APPROVED'
    | 'PAYMENT_READY'
    | 'PAID'
    | 'CANCELLED';
  invoice_date: string;
  due_date?: string;
  currency: string;
  subtotal: number;
  tax_total: number;
  grand_total: number;
  matched_amount: number;
  variance_amount: number;
  match_status: 'PENDING' | 'MATCHED' | 'QUANTITY_MISMATCH' | 'PRICE_MISMATCH' | 'MISSING_RECEIPT' | 'MISSING_PO';
  resolution_note?: string;
  provider_reference?: string;
  sync_status: string;
  created_at: string;
  supplier?: Supplier;
}

export interface CostTransaction {
  id: number;
  type: 'PURCHASE_COST' | 'SHIPPING_COST' | 'HANDLING_COST' | 'ADJUSTMENT_COST';
  reference_type: string;
  reference_id: string;
  amount: number;
  currency: string;
  category: string;
  posted_at: string;
  note?: string;
  created_at: string;
}

export interface ErpOverviewMetrics {
  total_stock_value: number;
  low_stock_count: number;
  blocked_stock_count: number;
  incoming_quantity: number;
  open_pos_count: number;
  open_pos_value: number;
  pos_awaiting_approval: number;
  pos_overdue: number;
  invoices_awaiting_review: number;
  invoices_mismatch: number;
  transfers_in_transit: number;
}

// ==========================================
// CANONICAL BI DOMAIN TYPES (POWER BI REFERENCE)
// ==========================================

export type VisualType = 'KPI' | 'LINE' | 'BAR' | 'COLUMN' | 'AREA' | 'TABLE' | 'MATRIX' | 'DONUT' | 'FUNNEL';

export interface VisualConfig {
  measures?: string[];
  dimensions?: string[];
  sort_by?: string;
  sort_direction?: 'ASC' | 'DESC';
  format?: 'CURRENCY' | 'INTEGER' | 'PERCENTAGE' | 'DECIMAL' | 'STRING';
  colors?: string[];
  chart_subtitle?: string;
  show_legend?: boolean;
  comparison_enabled?: boolean;
  comparison_target?: number;
  comparison_text?: string;
  drill_enabled?: boolean;
  drill_hierarchy?: string[];
  operational_link_type?: 'CRM_ACCOUNT' | 'OMS_ORDER' | 'ERP_ITEM' | string;
  source_report_id?: string;
  page_id?: string;
  value?: string;
  change?: string;
  subtext?: string;
}

export interface VisualInteractionConfig {
  target_mode: 'FILTER' | 'HIGHLIGHT' | 'NONE';
  drillthrough_page_id?: string;
}

export interface ReportVisual {
  id: string;
  report_page_id: string;
  visual_type: VisualType;
  title: string;
  configuration: VisualConfig;
  position: {
    col_span: number;
    row_span: number;
    x?: number;
    y?: number;
  };
  interaction_config: VisualInteractionConfig;
}

export interface ReportPage {
  id: string;
  report_id: string;
  name: string;
  order_index: number;
  page_question?: string;
  layout: {
    columns?: number;
    spacing?: string;
  };
  default_filter_state: AnalyticalFilter[];
  visuals: ReportVisual[];
}

export interface Report {
  id: string;
  organization_id: string;
  semantic_model_id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  owner_id: string;
  default_page_id?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  pages: ReportPage[];
}

export interface DashboardTile {
  id: string;
  dashboard_id: string;
  title: string;
  tile_type: 'METRIC_CARD' | 'REPORT_VISUAL' | 'SAVED_QUERY';
  source_ref_id?: string;
  configuration: VisualConfig;
  position: {
    col_span: number;
    row_span: number;
  };
}

export interface Dashboard {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  is_executive: boolean;
  owner_id: string;
  last_refreshed_at: string;
  created_at: string;
  updated_at: string;
  tiles: DashboardTile[];
}

export interface SemanticField {
  id: string;
  semantic_entity_id: string;
  name: string;
  display_name: string;
  data_type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN';
  field_type: 'DIMENSION' | 'MEASURE' | 'DATE' | 'IDENTIFIER';
  aggregation_default: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'NONE';
  format_type: 'CURRENCY' | 'PERCENTAGE' | 'INTEGER' | 'DECIMAL' | 'DATE' | 'STRING';
  is_hidden: boolean;
}

export interface SemanticEntity {
  id: string;
  semantic_model_id: string;
  name: string;
  display_name: string;
  source_table: string;
  description?: string;
  fields: SemanticField[];
}

export interface MetricDefinition {
  id: string;
  semantic_model_id: string;
  name: string;
  display_name: string;
  description?: string;
  expression: string;
  format_type: 'CURRENCY' | 'PERCENTAGE' | 'INTEGER' | 'DECIMAL' | 'STRING';
  unit: string;
  lineage_source: string;
  used_in_reports_count?: number;
}

export interface SemanticModel {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  owner_id: string;
  source_type: 'OMS' | 'CRM' | 'ERP' | 'COMPOSITE';
  refresh_mode: 'SCHEDULED' | 'MANUAL' | 'EVENT_DRIVEN';
  last_refresh_at?: string;
  last_successful_refresh_at?: string;
  refresh_status: 'NEVER_RUN' | 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'STALE';
  created_at: string;
  updated_at: string;
  entities_count?: number;
  measures_count?: number;
  entities?: SemanticEntity[];
  metrics?: MetricDefinition[];
}

export interface AnalyticalFilter {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'IN' | 'NOT_IN' | 'BETWEEN' | 'CONTAINS';
  values: any[];
  scope: 'VISUAL' | 'PAGE' | 'REPORT' | 'DRILLTHROUGH';
  display_label?: string;
}

export interface AnalyticalBookmark {
  id: string;
  report_id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  state: {
    active_page_id?: string;
    slicers?: Record<string, any>;
    filters?: AnalyticalFilter[];
  };
  created_at: string;
}

export interface RefreshRun {
  id: string;
  semantic_model_id: string;
  semantic_model_name?: string;
  status: 'QUEUED' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'STALE';
  triggered_by: 'EVENT' | 'MANUAL' | 'SCHEDULE' | string;
  duration_ms: number;
  rows_processed: number;
  error_message?: string;
  started_at: string;
  finished_at: string;
}

export interface BIContentCard {
  id: string;
  title: string;
  type: 'DASHBOARD' | 'REPORT' | 'METRIC' | 'MODEL';
  description?: string;
  last_modified: string;
  author: string;
  is_favorite?: boolean;
  status?: string;
}

export interface BIHomeSummary {
  favorites: BIContentCard[];
  recents: BIContentCard[];
  shared_with_me: BIContentCard[];
  data_health: {
    total_models: number;
    healthy_count: number;
    stale_count: number;
    recent_runs: RefreshRun[];
    last_synced_at: string;
  };
}


