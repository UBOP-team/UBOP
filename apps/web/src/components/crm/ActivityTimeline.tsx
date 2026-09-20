import React, { useState } from 'react';
import {
  PhoneCall,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Send,
  History,
} from 'lucide-react';
import { Activity } from '../../types';

interface ActivityTimelineProps {
  activities: Activity[];
  onLogActivity: (data: {
    type: 'CALL' | 'TASK' | 'EMAIL' | 'MEETING' | 'NOTE';
    subject: string;
    body: string;
    status?: 'COMPLETED' | 'SCHEDULED';
  }) => Promise<void>;
  loading?: boolean;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  onLogActivity,
}) => {
  const [composerType, setComposerType] = useState<'CALL' | 'TASK' | 'MEETING' | 'NOTE'>('CALL');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    setIsSubmitting(true);
    try {
      await onLogActivity({
        type: composerType,
        subject: subject.trim(),
        body: body.trim(),
        status: composerType === 'TASK' || composerType === 'MEETING' ? 'SCHEDULED' : 'COMPLETED',
      });
      setSubject('');
      setBody('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <PhoneCall className="w-3.5 h-3.5 text-blue-600" />;
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-amber-600" />;
      case 'MEETING':
        return <Calendar className="w-3.5 h-3.5 text-purple-600" />;
      case 'TASK':
        return <Clock className="w-3.5 h-3.5 text-emerald-600" />;
      case 'SYSTEM_EVENT':
        return <History className="w-3.5 h-3.5 text-slate-500" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'CALL':
        return 'bg-blue-50 border-blue-200';
      case 'EMAIL':
        return 'bg-amber-50 border-amber-200';
      case 'MEETING':
        return 'bg-purple-50 border-purple-200';
      case 'TASK':
        return 'bg-emerald-50 border-emerald-200';
      case 'SYSTEM_EVENT':
        return 'bg-slate-100 border-slate-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Activity Composer Box */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Quick action switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          {[
            { id: 'CALL', label: 'Log Call', icon: PhoneCall },
            { id: 'TASK', label: 'New Task', icon: Clock },
            { id: 'MEETING', label: 'Schedule Meeting', icon: Calendar },
            { id: 'NOTE', label: 'Add Note', icon: FileText },
          ].map((action) => {
            const Icon = action.icon;
            const isSelected = composerType === action.id;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  setComposerType(action.id as any);
                  if (!subject) {
                    setSubject(
                      action.id === 'CALL'
                        ? 'Discovery Call'
                        : action.id === 'TASK'
                        ? 'Follow-up proposal review'
                        : action.id === 'MEETING'
                        ? 'Product Demo'
                        : 'Commercial notes'
                    );
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-slate-900 text-slate-900 font-semibold bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {action.label}
              </button>
            );
          })}
        </div>

        {/* Composer Form */}
        <form onSubmit={handleSubmit} className="p-3.5 space-y-2.5">
          <input
            type="text"
            placeholder={`Subject for ${composerType.toLowerCase()}...`}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            required
          />
          <textarea
            rows={2}
            placeholder="Details, next actions, discussion summary..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !subject.trim()}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              Save {composerType === 'TASK' ? 'Task' : 'Activity'}
            </button>
          </div>
        </form>
      </div>

      {/* Timeline Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-500" />
            Activity Timeline ({activities.length})
          </h3>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">No activity logged yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Log a call, schedule a meeting, or add a note using the composer above.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {activities.map((act) => {
              const isSystem = act.type === 'SYSTEM_EVENT';
              return (
                <div key={act.id} className="relative group">
                  {/* Timeline node icon */}
                  <div
                    className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${getActivityBadgeColor(
                      act.type
                    )}`}
                  >
                    {getActivityIcon(act.type)}
                  </div>

                  {/* Card Content */}
                  <div
                    className={`rounded-lg p-2.5 text-xs transition-colors border ${
                      isSystem
                        ? 'bg-slate-50/70 border-slate-200 text-slate-700'
                        : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="truncate">{act.subject}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-normal uppercase tracking-wider ${
                            isSystem ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {act.type}
                        </span>
                      </div>
                      <time className="text-[10px] text-slate-400 shrink-0">
                        {new Date(act.created_at).toLocaleString('vi-VN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>

                    {act.body && (
                      <p className="text-slate-600 text-[11px] mt-1 whitespace-pre-wrap">
                        {act.body}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                      <span>By: Owner #{act.owner_id}</span>
                      {act.status && (
                        <span
                          className={`inline-flex items-center gap-1 ${
                            act.status === 'COMPLETED' ? 'text-emerald-600' : 'text-purple-600'
                          }`}
                        >
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          {act.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
