import React from 'react';
import { Calendar, X } from 'lucide-react';

interface SlicerProps {
  timeHorizon: '7D' | '30D' | '90D' | 'YTD';
  onChangeTimeHorizon: (h: '7D' | '30D' | '90D' | 'YTD') => void;
  selectedChannel: string;
  onChangeChannel: (ch: string) => void;
  selectedRegion: string;
  onChangeRegion: (r: string) => void;
  onResetSlicers: () => void;
  isFiltered: boolean;
}

export const Slicer: React.FC<SlicerProps> = ({
  timeHorizon,
  onChangeTimeHorizon,
  selectedChannel,
  onChangeChannel,
  selectedRegion,
  onChangeRegion,
  onResetSlicers,
  isFiltered,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Date / Horizon Slicer */}
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Period:
          </span>
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
            {(['7D', '30D', '90D', 'YTD'] as const).map((h) => (
              <button
                key={h}
                onClick={() => onChangeTimeHorizon(h)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  timeHorizon === h
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Channel Slicer */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Channel:
          </span>
          <select
            value={selectedChannel}
            onChange={(e) => onChangeChannel(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-500 shadow-2xs"
          >
            <option value="ALL">All Channels (Consolidated)</option>
            <option value="Shopify">Shopify Storefront</option>
            <option value="Direct B2B">Direct Enterprise B2B</option>
            <option value="Amazon Marketplace">Amazon Marketplace</option>
          </select>
        </div>

        {/* Geographic Region Slicer */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Region:
          </span>
          <select
            value={selectedRegion}
            onChange={(e) => onChangeRegion(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium focus:outline-none focus:border-teal-500 shadow-2xs"
          >
            <option value="ALL">All Regions (Global)</option>
            <option value="Vietnam">Vietnam (Domestic)</option>
            <option value="APAC">Asia-Pacific (APAC)</option>
            <option value="North America">North America (NA)</option>
            <option value="EMEA">Europe & Middle East (EMEA)</option>
          </select>
        </div>
      </div>

      {/* Clear/Reset Slicers Button */}
      {isFiltered && (
        <button
          onClick={onResetSlicers}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors cursor-pointer"
          title="Restore report default slicer settings"
        >
          <X className="w-3.5 h-3.5 text-slate-500" />
          Clear Slicers
        </button>
      )}
    </div>
  );
};
