import React, { useState } from 'react';
import { UserCheck } from 'lucide-react';
import { ApprovalRequest } from '../../types';

interface ApprovalInboxProps {
  approvals: ApprovalRequest[];
  onDecide: (approvalId: string, decision: 'APPROVED' | 'REJECTED', comment?: string) => Promise<void>;
}

export const ApprovalInbox: React.FC<ApprovalInboxProps> = ({
  approvals,
  onDecide,
}) => {
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [selectedAppr, setSelectedAppr] = useState<ApprovalRequest | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredApprovals = approvals.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    return true;
  });

  const handleOpenDecisionModal = (appr: ApprovalRequest, type: 'APPROVED' | 'REJECTED') => {
    setSelectedAppr(appr);
    setDecisionType(type);
    setComment('');
  };

  const handleSubmitDecision = async () => {
    if (!selectedAppr) return;
    setIsSubmitting(true);
    try {
      await onDecide(selectedAppr.id, decisionType, comment.trim());
      setSelectedAppr(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <UserCheck className="w-6 h-6 text-amber-400" />
          Workflow Human Approvals Inbox
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review and approve pending human-in-the-loop workflow decisions across business operations
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-medium">
        {[
          { id: 'PENDING', label: 'Pending Review' },
          { id: 'APPROVED', label: 'Approved History' },
          { id: 'REJECTED', label: 'Rejected' },
          { id: 'ALL', label: 'All Requests' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              statusFilter === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {filteredApprovals.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
            No approval requests in this queue.
          </div>
        ) : (
          filteredApprovals.map((appr) => {
            const entity = appr.entity_reference || {};
            const isPending = appr.status === 'PENDING';

            return (
              <div
                key={appr.id}
                className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm text-white">{appr.flow_name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      Role: {appr.approver_reference}
                    </span>
                    {appr.status === 'PENDING' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Pending Decision
                      </span>
                    ) : appr.status === 'APPROVED' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Approved
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        Rejected
                      </span>
                    )}
                  </div>

                  {/* Entity Context */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs space-y-1">
                    <div className="flex items-center gap-3 font-semibold text-slate-200">
                      <span>Order #{entity.order_number || entity.entity_id || 'ORD-MAIN'}</span>
                      <span>•</span>
                      <span className="text-cyan-400">
                        ₫{(entity.amount || 0).toLocaleString()} {entity.currency || 'VND'}
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">{entity.customer_name || 'Enterprise Customer'}</span>
                    </div>
                    {entity.summary && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{entity.summary}</p>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-3">
                    <span>Requested: {new Date(appr.requested_at).toLocaleString()}</span>
                    {appr.responded_at && (
                      <>
                        <span>•</span>
                        <span>Responded: {new Date(appr.responded_at).toLocaleString()} by {appr.responded_by || 'Approver'}</span>
                      </>
                    )}
                    {appr.comment && (
                      <>
                        <span>•</span>
                        <span className="italic text-slate-400">"{appr.comment}"</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {isPending && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleOpenDecisionModal(appr, 'REJECTED')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleOpenDecisionModal(appr, 'APPROVED')}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition-colors"
                    >
                      Approve & Resume Flow
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Decision Modal */}
      {selectedAppr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              {decisionType === 'APPROVED' ? 'Confirm Approval' : 'Reject Workflow Request'}
            </h3>
            <p className="text-xs text-slate-400">
              {decisionType === 'APPROVED'
                ? 'Approving will resume the workflow along the approved branch.'
                : 'Rejecting will route the workflow along the reject or termination path.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Review Notes / Justification (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Add audit comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedAppr(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDecision}
                disabled={isSubmitting}
                className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg shadow-md ${
                  decisionType === 'APPROVED'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isSubmitting
                  ? 'Submitting...'
                  : decisionType === 'APPROVED'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
