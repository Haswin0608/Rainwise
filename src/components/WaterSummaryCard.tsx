import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp, Droplet, HelpCircle, Sparkles } from 'lucide-react';
import { FullWaterSummary, PeriodWaterSummary, CalculationPeriod } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';
import { HelpExplainButton } from './HelpExplainButton';

interface WaterSummaryCardProps {
  summary: FullWaterSummary;
  activePeriod: CalculationPeriod;
  onSelectPeriod?: (period: CalculationPeriod) => void;
}

export const WaterSummaryCard: React.FC<WaterSummaryCardProps> = ({
  summary,
  activePeriod,
  onSelectPeriod,
}) => {
  const { formatVolume } = useAppSettings();
  const [expandedPeriod, setExpandedPeriod] = useState<CalculationPeriod | null>(null);

  const periods: { key: CalculationPeriod; label: string; icon: string; data: PeriodWaterSummary }[] = [
    { key: 'week', label: 'This week', icon: '📅', data: summary.week },
    { key: 'month', label: summary.month.periodLabel || 'This month', icon: '🌙', data: summary.month },
    { key: 'year', label: 'Typical year', icon: '☀️', data: summary.year },
  ];

  const toggleExpand = (periodKey: CalculationPeriod) => {
    setExpandedPeriod(expandedPeriod === periodKey ? null : periodKey);
  };

  const yearSavedB = summary.year.keptBuckets;
  const yearWastedB = summary.year.wastedBuckets;

  return (
    <div className="p-5 sm:p-7 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-xl space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">📊</span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-['Outfit',sans-serif] text-white flex items-center gap-2">
              <span>Your Water Summary</span>
              <HelpExplainButton termKey="saved_vs_wasted" />
            </h2>
            <p className="text-xs text-slate-300">
              How much rain you keep and waste: this week, this month and this year.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium">
          1 bucket ≈ {summary.bucketSizeL} L
        </div>
      </div>

      {/* 3 Periods Stacked / Row Cards */}
      <div className="space-y-3">
        {periods.map(({ key, label, icon, data }) => {
          const isActive = activePeriod === key;
          const isExpanded = expandedPeriod === key;
          const hasRain = data.rainOnRoof > 0;

          // Saved vs Wasted ratio
          const savedDrops = data.rainOnRoofBuckets > 0 
            ? Math.round((data.keptBuckets / data.rainOnRoofBuckets) * 100) 
            : 0;

          return (
            <div
              key={key}
              onClick={() => {
                if (onSelectPeriod) onSelectPeriod(key);
                toggleExpand(key);
              }}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-[#0f172a] border-teal-500/70 shadow-lg ring-1 ring-teal-500/30'
                  : 'bg-[#0b1120] border-[#24354c] hover:border-slate-600'
              }`}
            >
              {/* Active Badge */}
              {isActive && (
                <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-teal-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow">
                  Active View
                </span>
              )}

              {/* Row Top: Period Title & Quick Stats */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <h3 className={`font-extrabold text-base sm:text-lg font-['Outfit',sans-serif] ${
                      isActive ? 'text-teal-300' : 'text-white'
                    }`}>
                      {label}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {data.rainfallMm} mm rainfall
                    </span>
                  </div>
                </div>

                {!hasRain ? (
                  <div className="text-sm font-semibold text-slate-400 italic py-1">
                    No rain expected.
                  </div>
                ) : (
                  /* 3 Columns: Rain on Roof | Saved | Wasted */
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 flex-1 max-w-xl">
                    {/* Column 1: Rain on Roof */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-[#131d2e] border border-[#24354c]">
                      <span className="text-[10px] sm:text-xs text-slate-400 font-medium block">
                        🌧️ Rain on Roof
                      </span>
                      <strong className="text-base sm:text-xl font-black text-white font-['Outfit',sans-serif] block mt-0.5">
                        {data.rainOnRoofBuckets.toLocaleString()} <span className="text-xs font-normal text-slate-400">{data.rainOnRoofBuckets === 1 ? 'bucket' : 'buckets'}</span>
                      </strong>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {formatVolume(data.rainOnRoof)}
                      </span>
                    </div>

                    {/* Column 2: Saved */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-[#131d2e] border border-teal-500/30">
                      <span className="text-[10px] sm:text-xs text-teal-400 font-bold block">
                        🟢 Saved
                      </span>
                      <strong className="text-base sm:text-xl font-black text-teal-300 font-['Outfit',sans-serif] block mt-0.5">
                        {data.keptBuckets.toLocaleString()} <span className="text-xs font-normal text-teal-500">{data.keptBuckets === 1 ? 'bucket' : 'buckets'}</span>
                      </strong>
                      <span className="text-[10px] text-teal-400/80 font-mono block">
                        {formatVolume(data.kept)}
                      </span>
                    </div>

                    {/* Column 3: Wasted */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-[#131d2e] border border-orange-500/30">
                      <span className="text-[10px] sm:text-xs text-orange-400 font-bold block">
                        🟠 Wasted
                      </span>
                      <strong className="text-base sm:text-xl font-black text-orange-400 font-['Outfit',sans-serif] block mt-0.5">
                        {data.wastedBuckets.toLocaleString()} <span className="text-xs font-normal text-orange-500">{data.wastedBuckets === 1 ? 'bucket' : 'buckets'}</span>
                      </strong>
                      <span className="text-[10px] text-orange-400/80 font-mono block">
                        {formatVolume(data.wasted)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar & Drops Text (If rain > 0) */}
              {hasRain && (
                <div className="mt-3 pt-2 border-t border-[#1e293b]/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-teal-300 flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 fill-teal-400 text-teal-400" />
                      Saved {savedDrops} out of 100 drops
                    </span>
                    <span className="text-slate-400 text-[11px] font-normal flex items-center gap-1">
                      <span>{isExpanded ? 'Hide details' : 'Tap for details'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </span>
                  </div>

                  {/* Dual-Color Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-[#1e293b] overflow-hidden flex">
                    <div
                      style={{ width: `${data.keptPercent}%` }}
                      className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-300"
                      title={`Saved: ${data.keptPercent}%`}
                    />
                    <div
                      style={{ width: `${data.wastedPercent}%` }}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-full transition-all duration-300"
                      title={`Wasted: ${data.wastedPercent}%`}
                    />
                  </div>
                </div>
              )}

              {/* Expanded Breakdown */}
              <AnimatePresence>
                {isExpanded && hasRain && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-[#24354c] text-xs space-y-2 text-slate-300"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-2.5 rounded-xl bg-[#131d2e] border border-[#24354c]">
                        <span className="text-slate-400 block font-medium">Roof Loss (soaks / evaporates):</span>
                        <strong className="text-amber-300 font-bold text-sm block mt-0.5">
                          {data.lostOnRoofBuckets.toLocaleString()} buckets
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({formatVolume(data.lostOnRoof)})
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#131d2e] border border-[#24354c]">
                        <span className="text-slate-400 block font-medium">Spilled Over (tank full):</span>
                        <strong className="text-orange-400 font-bold text-sm block mt-0.5">
                          {data.spilledBuckets.toLocaleString()} buckets
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({formatVolume(data.spilled)})
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Friendly Bottom Sentence */}
      <div className="p-4 rounded-2xl bg-[#0b1120] border border-[#24354c] text-center">
        <p className="text-sm sm:text-base font-bold text-slate-200 font-['Outfit',sans-serif]">
          This year you can save about{' '}
          <span className="text-teal-300 font-black">{yearSavedB.toLocaleString()} buckets</span> and waste about{' '}
          <span className="text-orange-400 font-black">{yearWastedB.toLocaleString()} buckets</span>.
        </p>
      </div>
    </div>
  );
};
