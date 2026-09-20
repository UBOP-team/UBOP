import React from 'react';
import { PaymentState, FulfillmentState, ReturnState, SyncStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant: 'green' | 'blue' | 'yellow' | 'amber' | 'purple' | 'gray' | 'red';
  dot?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ children, variant, dot = true }) => {
  const variantStyles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    blue: 'bg-sky-50 text-sky-700 border-sky-200/80',
    yellow: 'bg-amber-50 text-amber-800 border-amber-200/80',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    gray: 'bg-slate-50 text-slate-600 border-slate-200/80',
    red: 'bg-rose-50 text-rose-700 border-rose-200/80',
  };

  const dotStyles = {
    green: 'bg-emerald-500',
    blue: 'bg-sky-500',
    yellow: 'bg-amber-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    gray: 'bg-slate-400',
    red: 'bg-rose-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} select-none`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} />}
      {children}
    </span>
  );
};

export const PaymentStateBadge: React.FC<{ state?: PaymentState | string }> = ({ state }) => {
  const normalized = (state || 'UNPAID').toUpperCase();
  switch (normalized) {
    case 'PAID':
      return <Badge variant="green">Paid</Badge>;
    case 'PARTIALLY_PAID':
      return <Badge variant="blue">Partially Paid</Badge>;
    case 'AUTHORIZED':
      return <Badge variant="blue">Authorized</Badge>;
    case 'PENDING':
      return <Badge variant="yellow">Payment Pending</Badge>;
    case 'PARTIALLY_REFUNDED':
      return <Badge variant="purple">Partially Refunded</Badge>;
    case 'REFUNDED':
      return <Badge variant="gray">Refunded</Badge>;
    case 'VOIDED':
      return <Badge variant="gray">Voided</Badge>;
    case 'UNPAID':
    default:
      return <Badge variant="amber">Unpaid</Badge>;
  }
};

export const FulfillmentStateBadge: React.FC<{ state?: FulfillmentState | string }> = ({ state }) => {
  const normalized = (state || 'UNFULFILLED').toUpperCase();
  switch (normalized) {
    case 'FULFILLED':
      return <Badge variant="green">Fulfilled</Badge>;
    case 'PARTIALLY_FULFILLED':
      return <Badge variant="blue">Partially Fulfilled</Badge>;
    case 'ON_HOLD':
      return <Badge variant="yellow">Fulfillment On Hold</Badge>;
    case 'CANCELLED':
      return <Badge variant="red">Cancelled</Badge>;
    case 'UNFULFILLED':
    default:
      return <Badge variant="amber">Unfulfilled</Badge>;
  }
};

export const ReturnStateBadge: React.FC<{ state?: ReturnState | string }> = ({ state }) => {
  const normalized = (state || 'NONE').toUpperCase();
  if (normalized === 'NONE') return null;

  switch (normalized) {
    case 'REQUESTED':
      return <Badge variant="amber">Return Requested</Badge>;
    case 'APPROVED':
    case 'IN_PROGRESS':
      return <Badge variant="blue">Return In Progress</Badge>;
    case 'INSPECTION_COMPLETE':
      return <Badge variant="purple">Inspected</Badge>;
    case 'COMPLETED':
      return <Badge variant="green">Return Completed</Badge>;
    case 'DECLINED':
      return <Badge variant="red">Return Declined</Badge>;
    default:
      return <Badge variant="gray">{normalized}</Badge>;
  }
};

export const SyncStatusBadge: React.FC<{ status?: SyncStatus | string }> = ({ status }) => {
  const normalized = (status || 'HEALTHY').toUpperCase();
  switch (normalized) {
    case 'HEALTHY':
      return <Badge variant="green">Synced</Badge>;
    case 'SYNCING':
    case 'PENDING':
      return <Badge variant="blue">Syncing</Badge>;
    case 'DEGRADED':
      return <Badge variant="yellow">Sync Degraded</Badge>;
    case 'FAILED':
    case 'DISCONNECTED':
      return <Badge variant="red">Sync Failed</Badge>;
    default:
      return <Badge variant="gray">{normalized}</Badge>;
  }
};
