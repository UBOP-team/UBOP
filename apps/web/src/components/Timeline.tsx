import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  FileText,
  PhoneCall,
  Mail,
  Truck,
  DollarSign,
  Package,
  LucideIcon,
} from 'lucide-react';

export interface TimelineItem {
  id: string | number;
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'FAILED';
  iconType?: 'CHECK' | 'PHONE' | 'EMAIL' | 'TRUCK' | 'PAYMENT' | 'PACKAGE' | 'DOC' | 'CUSTOM';
  customIcon?: LucideIcon;
  badge?: string;
}

export interface TimelineProps {
  items: TimelineItem[];
  mode?: 'vertical' | 'horizontal_stepper';
  interactive?: boolean;
  onItemClick?: (item: TimelineItem) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  mode = 'vertical',
  interactive = false,
  onItemClick,
}) => {
  const getIcon = (item: TimelineItem) => {
    if (item.customIcon) {
      const Custom = item.customIcon;
      return <Custom className="w-3.5 h-3.5" />;
    }

    switch (item.iconType) {
      case 'PHONE':
        return <PhoneCall className="w-3.5 h-3.5" />;
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5" />;
      case 'TRUCK':
        return <Truck className="w-3.5 h-3.5" />;
      case 'PAYMENT':
        return <DollarSign className="w-3.5 h-3.5" />;
      case 'PACKAGE':
        return <Package className="w-3.5 h-3.5" />;
      case 'DOC':
        return <FileText className="w-3.5 h-3.5" />;
      default:
        if (item.status === 'COMPLETED') return <CheckCircle2 className="w-3.5 h-3.5" />;
        if (item.status === 'IN_PROGRESS') return <Clock className="w-3.5 h-3.5" />;
        if (item.status === 'FAILED') return <AlertCircle className="w-3.5 h-3.5" />;
        return <Circle className="w-3.5 h-3.5" />;
    }
  };

  const getStatusClasses = (status: TimelineItem['status']) => {
    switch (status) {
      case 'COMPLETED':
        return {
          node: 'bg-emerald-500 text-white ring-4 ring-emerald-100',
          line: 'bg-emerald-400',
          text: 'text-slate-900',
        };
      case 'IN_PROGRESS':
        return {
          node: 'bg-teal-600 text-white ring-4 ring-teal-100 animate-pulse',
          line: 'bg-slate-200',
          text: 'text-teal-700 font-semibold',
        };
      case 'FAILED':
        return {
          node: 'bg-rose-500 text-white ring-4 ring-rose-100',
          line: 'bg-slate-200',
          text: 'text-rose-700',
        };
      default: // PENDING
        return {
          node: 'bg-slate-100 text-slate-400 border border-slate-300',
          line: 'bg-slate-200',
          text: 'text-slate-500',
        };
    }
  };

  // Horizontal Stepper Mode (Shopify OMS order fulfillment tracker)
  if (mode === 'horizontal_stepper') {
    return (
      <div className="w-full py-3">
        <div className="flex items-center justify-between relative">
          {/* Background Track Line */}
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />

          {items.map((item) => {
            const classes = getStatusClasses(item.status);
            return (
              <div
                key={item.id}
                onClick={() => interactive && onItemClick && onItemClick(item)}
                className={`flex flex-col items-center relative z-10 ${
                  interactive ? 'cursor-pointer group' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${classes.node}`}
                >
                  {getIcon(item)}
                </div>

                <div className="text-center mt-2">
                  <div className={`text-xs font-semibold ${classes.text} whitespace-nowrap`}>
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {item.timestamp}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Vertical Activity Timeline (Salesforce Lightning CRM style)
  return (
    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {items.map((item) => {
        const classes = getStatusClasses(item.status);

        return (
          <div
            key={item.id}
            onClick={() => interactive && onItemClick && onItemClick(item)}
            className={`relative group ${interactive ? 'cursor-pointer' : ''}`}
          >
            {/* Left Node Dot */}
            <div
              className={`absolute -left-[27px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${classes.node}`}
            >
              {getIcon(item)}
            </div>

            {/* Content Card */}
            <div className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-3.5 transition-colors shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${classes.text}`}>{item.title}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-teal-800 border border-slate-200 font-medium">
                      {item.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  {item.actor && <span className="text-slate-600 font-sans">by {item.actor}</span>}
                  <span>•</span>
                  <span>{item.timestamp}</span>
                </div>
              </div>

              {item.description && (
                <p className="text-xs text-slate-500 leading-relaxed mt-1">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
