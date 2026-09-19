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

export interface OrderItem {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product_name?: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id: number;
  customer_name?: string;
  customer_email?: string;
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total_amount: number;
  created_at: string;
  items: OrderItem[];
  shipping_address?: string;
  payment_method?: string;
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
