import React, { useState } from 'react';
import {
  CreditCard,
  Truck,
  RotateCcw,
  Ban,
  Radio,
  FileText,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  DollarSign,
} from 'lucide-react';
import { OrderTimelineEvent } from '../../types';

interface OrderTimelineProps {
  events: OrderTimelineEvent[];
  onAddNote?: (note: string) => void;
}

export const OrderTimeline: React.FC<OrderTimelineProps> = ({ events, onAddNote }) => {
  const [newNote, setNewNote] = useState('');

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !onAddNote) return;
    onAddNote(newNote.trim());
    setNewNote('');
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'ORDER_CREATED':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'PAYMENT_RECORDED':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
      case 'FULFILLMENT_CREATED':
        return <Truck className="w-3.5 h-3.5 text-sky-600" />;
      case 'RETURN_REQUESTED':
        return <RotateCcw className="w-3.5 h-3.5 text-amber-600" />;
      case 'RETURN_RECEIVED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'REFUND_CREATED':
        return <DollarSign className="w-3.5 h-3.5 text-purple-600" />;
      case 'ORDER_CANCELLED':
        return <Ban className="w-3.5 h-3.5 text-rose-600" />;
      case 'PROVIDER_SYNC_SUCCEEDED':
        return <Radio className="w-3.5 h-3.5 text-emerald-600" />;
      case 'PROVIDER_SYNC_FAILED':
        return <Radio className="w-3.5 h-3.5 text-rose-600" />;
      case 'NOTE_ADDED':
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200/80 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center justify-between">
        <span>Order Timeline & History</span>
        <span className="text-xs text-slate-400 font-normal">{events.length} events</span>
      </h3>

      {/* Note composer */}
      {onAddNote && (
        <form onSubmit={handleSubmitNote} className="mb-4">
          <div className="relative">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Leave an internal operational note..."
              rows={2}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none placeholder:text-slate-400"
            />
            {newNote.trim() && (
              <button
                type="submit"
                className="absolute right-2 bottom-2 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-medium inline-flex items-center gap-1 shadow-sm transition-colors"
              >
                <Send className="w-3 h-3" />
                Post Note
              </button>
            )}
          </div>
        </form>
      )}

      {/* Chronological list */}
      <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-100">
        {sortedEvents.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">No timeline events recorded yet.</p>
        ) : (
          sortedEvents.map((ev, idx) => (
            <div key={ev.id || idx} className="relative flex items-start gap-3 text-xs">
              <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 z-10 shadow-xs">
                {getEventIcon(ev.event_type)}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium text-slate-800 leading-snug">{ev.summary}</p>
                  <time className="text-[11px] text-slate-400 shrink-0 font-mono">
                    {new Date(ev.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
                {ev.metadata_json && (
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono">{ev.metadata_json}</p>
                )}
                <span className="text-[10px] text-slate-400">by {ev.actor_id} · {new Date(ev.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
