import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  CreditCard,
  PackageCheck,
  RotateCcw,
  Ban,
  Archive,
  Printer,
  DollarSign,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { Order } from '../../types';
import {
  PaymentStateBadge,
  FulfillmentStateBadge,
  ReturnStateBadge,
  SyncStatusBadge,
} from './OrderStatusBadge';

interface OrderHeaderProps {
  order: Order;
  onBack: () => void;
  onRecordPayment: () => void;
  onFulfill: () => void;
  onCancel: () => void;
  onCreateReturn: () => void;
  onReviewReturn?: () => void;
  onIssueRefund: () => void;
  onArchive: () => void;
  onPrintInvoice: () => void;
}

export const OrderHeader: React.FC<OrderHeaderProps> = ({
  order,
  onBack,
  onRecordPayment,
  onFulfill,
  onCancel,
  onCreateReturn,
  onReviewReturn,
  onIssueRefund,
  onArchive,
  onPrintInvoice,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const orderState = order.order_state || (order.status === 'CANCELLED' ? 'CANCELLED' : 'OPEN');
  const paymentState = order.payment_state || 'UNPAID';
  const fulfillmentState = order.fulfillment_state || (order.status === 'SHIPPED' || order.status === 'DELIVERED' ? 'FULFILLED' : 'UNFULFILLED');
  const returnState = order.return_state || 'NONE';

  // Determine Contextual Primary Action (Section 8.2)
  const renderPrimaryAction = () => {
    if (orderState === 'CANCELLED' || orderState === 'ARCHIVED') {
      return null;
    }

    if (returnState === 'REQUESTED' && onReviewReturn) {
      return (
        <button
          onClick={onReviewReturn}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Review Return
        </button>
      );
    }

    if (paymentState === 'UNPAID' || paymentState === 'PENDING') {
      return (
        <button
          onClick={onRecordPayment}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors"
        >
          <CreditCard className="w-3.5 h-3.5" />
          Record Payment
        </button>
      );
    }

    if (fulfillmentState === 'PARTIALLY_FULFILLED') {
      return (
        <button
          onClick={onFulfill}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors"
        >
          <PackageCheck className="w-3.5 h-3.5" />
          Fulfill Remaining
        </button>
      );
    }

    if (fulfillmentState === 'UNFULFILLED') {
      return (
        <button
          onClick={onFulfill}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md shadow-sm transition-colors"
        >
          <PackageCheck className="w-3.5 h-3.5" />
          Fulfill Items
        </button>
      );
    }

    return null;
  };

  const isFulfilledOrPartial = fulfillmentState === 'FULFILLED' || fulfillmentState === 'PARTIALLY_FULFILLED';
  const hasPaidFunds = paymentState === 'PAID' || paymentState === 'PARTIALLY_PAID' || paymentState === 'PARTIALLY_REFUNDED';

  return (
    <div className="bg-white border-b border-slate-200/80 px-6 py-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2.5"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Orders
      </button>

      {/* Header main row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-mono">
              #{order.order_number}
            </h1>
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                orderState === 'OPEN'
                  ? 'bg-slate-100 text-slate-700'
                  : orderState === 'CANCELLED'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {orderState}
            </span>
          </div>

          {/* Status cluster badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <PaymentStateBadge state={paymentState} />
            <span className="text-slate-300">·</span>
            <FulfillmentStateBadge state={fulfillmentState} />
            {returnState !== 'NONE' && (
              <>
                <span className="text-slate-300">·</span>
                <ReturnStateBadge state={returnState} />
              </>
            )}
            <span className="text-slate-300">·</span>
            <SyncStatusBadge status={order.sync_status || 'HEALTHY'} />
          </div>
        </div>

        {/* Action button cluster */}
        <div className="flex items-center gap-2.5">
          {renderPrimaryAction()}

          {/* More actions dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md shadow-sm transition-colors"
            >
              More Actions
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isMoreOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-30 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onRecordPayment();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  Record Payment
                </button>

                {isFulfilledOrPartial && (
                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      onCreateReturn();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-400" />
                    Create Return
                  </button>
                )}

                {hasPaidFunds && (
                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      onIssueRefund();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    Issue Refund
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsMoreOpen(false);
                    onPrintInvoice();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <Printer className="w-4 h-4 text-slate-400" />
                  Print Packing Slip / Invoice
                </button>

                <div className="border-t border-slate-100 my-1" />

                {orderState === 'OPEN' && (
                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      onCancel();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2.5"
                  >
                    <Ban className="w-4 h-4 text-rose-500" />
                    Cancel Order
                  </button>
                )}

                {orderState !== 'ARCHIVED' && (
                  <button
                    onClick={() => {
                      setIsMoreOpen(false);
                      onArchive();
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-500"
                  >
                    <Archive className="w-4 h-4 text-slate-400" />
                    Archive Order
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary metadata rail */}
      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-3 text-xs text-slate-500">
        <span>
          Placed: <span className="text-slate-700 font-medium">{new Date(order.placed_at || order.created_at).toLocaleString()}</span>
        </span>
        <span className="text-slate-300">•</span>
        <span className="inline-flex items-center gap-1">
          <Radio className="w-3.5 h-3.5 text-emerald-500" />
          Channel: <span className="text-slate-700 font-medium">{order.source_type || 'INTERNAL'}</span>
        </span>
        {order.external_order_id && (
          <>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1 font-mono">
              <ExternalLink className="w-3 h-3 text-slate-400" />
              Ext ID: <span className="text-slate-700 font-medium">{order.external_order_id}</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};
