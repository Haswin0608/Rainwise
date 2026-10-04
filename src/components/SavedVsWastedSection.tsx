import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplets, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Info,
  Calendar,
  Sliders,
  RotateCcw,
  Check,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  CalculationResult, 
  CalculatorInputs, 
  CalculationPeriod,
  StorageTankItem,
  PeriodWaterSummary
} from '../types';
import { 
  calcWaterSummary, 
  normalizeTanks, 
  getTotalTankCapacity, 
  MONTH_NAMES 
} from '../utils/calculations';
import { useAppSettings } from '../context/AppSettingsContext';
import { HelpExplainButton } from './HelpExplainButton';
import { WaterSummaryCard } from './WaterSummaryCard';

interface SavedVsWastedSectionProps {
  result: CalculationResult;
  inputs: CalculatorInputs;
  onOpenAssumptions?: () => void;
  onUpdateTanks?: (newTanks: StorageTankItem[], noTankYet: boolean) => void;
  onGoToRoofInput?: () => void;
  onGoToLocation?: () => void;
}

export const SavedVsWastedSection: React.FC<SavedVsWastedSectionProps> = ({
  result,
  inputs,
  onOpenAssumptions,
  onUpdateTanks,
}) => {
  const { period, setPeriod, formatVolume } = useAppSettings();

  // Tank capacity setup
  const { tanks: normalizedTanks, noTankYet } = normalizeTanks(inputs.tanks, inputs.tankCapacity, inputs.noTankYet);
  const actualTankInfo = getTotalTankCapacity(normalizedTanks, noTankYet, 2000, 'metric');
  const actualTankCapacityL = noTankYet ? 0 : actualTankInfo.totalLitres;

  // Tank Slider preview state (defaults to actual building tank capacity)
  const [previewTankL, setPreviewTankL] = useState<number>(actualTankCapacityL);

  useEffect(() => {
    setPreviewTankL(actualTankCapacityL);
  }, [actualTankCapacityL]);

  // Compute live water summary based on previewTankL
  const summary = calcWaterSummary(inputs, 'metric', inputs.assumptions, previewTankL);
  // Real water summary for difference comparison
  const realSummary = calcWaterSummary(inputs, 'metric', inputs.assumptions, actualTankCapacityL);

  const isPreviewing = previewTankL !== actualTankCapacityL;
  const savedDiffB = summary.year.keptBuckets - realSummary.year.keptBuckets;

  // Active period summary
  const activePeriodSummary: PeriodWaterSummary = 
    period === 'week' ? summary.week : period === 'month' ? summary.month : summary.year;

  // Grown-up details collapse state
  const [showGrownUpDetails, setShowGrownUpDetails] = useState(false);

  // Graph state: "Saved vs wasted" (default) or "Total rain only"
  const [chartMode, setChartMode] = useState<'stacked' | 'total'>('stacked');
  const [showSavedSeries, setShowSavedSeries] = useState(true);
  const [showWastedSeries, setShowWastedSeries] = useState(true);

  // Month selection: default to current calendar month
  const currentMonthIdx = new Date().getMonth();
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number>(currentMonthIdx);

  const monthlyBreakdown = summary.monthlyBreakdown || [];
  const selectedMonthData = monthlyBreakdown[selectedMonthIdx] || monthlyBreakdown[0];

  // Max rain month / min rain month determination
  let maxRainIdx = 0;
  let minRainIdx = 0;
  let maxVal = -1;
  let minVal = Infinity;

  monthlyBreakdown.forEach((m, idx) => {
    if (m.rainfallMm > maxVal) {
      maxVal = m.rainfallMm;
      maxRainIdx = idx;
    }
    if (m.rainfallMm < minVal) {
      minVal = m.rainfallMm;
      minRainIdx = idx;
    }
  });

  // Maximum buckets for graph scaling
  const maxMonthlyBuckets = Math.max(1, ...monthlyBreakdown.map(m => m.rainOnRoofBuckets));

  // Tank slider range: 0 to max(5000, 5 * actualTankCapacityL)
  const sliderMax = Math.max(5000, Math.ceil((actualTankCapacityL * 5) / 500) * 500);

  // Keyboard navigation for month bars
  const handleKeyDownMonth = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSelectedMonthIdx((idx - 1 + 12) % 12);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSelectedMonthIdx((idx + 1) % 12);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedMonthIdx(idx);
    }
  };

  // Biggest cause tip for "What does a tank do?" card
  let causeTip = '';
  if (activePeriodSummary.lostOnRoof > activePeriodSummary.spilled && activePeriodSummary.lostOnRoof > 0) {
    causeTip = 'Clean the roof and gutters so more rain reaches your tank.';
  } else if (activePeriodSummary.spilled >= activePeriodSummary.lostOnRoof && activePeriodSummary.spilled > 0) {
    causeTip = 'Your tank fills up too fast. A bigger tank keeps more.';
  } else {
    causeTip = 'Great! Your tank is a good size.';
  }

  // Wasted explanation modal/tooltip toggle
  const [showWastedHelp, setShowWastedHelp] = useState(false);

  return (
    <div className="space-y-8 text-left">
      {/* ────────────────────────────────────────────────────────────
          CARD A: 📊 YOUR WATER SUMMARY (ALWAYS VISIBLE DIRECTLY UNDER SELECTOR)
          ──────────────────────────────────────────────────────────── */}
      <WaterSummaryCard
        summary={summary}
        activePeriod={period}
        onSelectPeriod={(p) => setPeriod(p)}
      />

      {/* ────────────────────────────────────────────────────────────
          CARD B: 🛢️ WHAT DOES A TANK DO?
          ──────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-7 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🛢️</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-['Outfit',sans-serif] text-white flex items-center gap-2">
                <span>What does a tank do?</span>
                <HelpExplainButton termKey="tank_capacity" />
              </h2>
              <p className="text-xs text-slate-300">
                Comparing no storage vs having a rainwater tank for {activePeriodSummary.periodLabel.toLowerCase()}.
              </p>
            </div>
          </div>

          {isPreviewing && (
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-extrabold text-xs border border-amber-500/40 animate-pulse">
              🔍 Previewing {previewTankL.toLocaleString()} L Tank
            </span>
          )}
        </div>

        {/* Two Big Side-By-Side Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: NO TANK */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-rose-900/50 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-bold">
                <span>❌ No tank</span>
              </div>
              <p className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <span>🌧️💨</span>
                <span>Rain runs away</span>
              </p>
            </div>

            <div className="pt-2">
              <span className="text-xs text-slate-400 block font-medium">You keep:</span>
              <span className="text-2xl sm:text-3xl font-black text-rose-400 font-['Outfit',sans-serif]">
                0 buckets
              </span>
            </div>
          </div>

          {/* Card 2: WITH YOUR TANK */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-teal-500/50 flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-bold">
                <span>✅ With your tank</span>
              </div>
              <p className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <span>🌧️🛢️</span>
                <span>Rain is kept for you</span>
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div>
                <span className="text-xs text-slate-400 block font-medium">You keep:</span>
                <span className="text-2xl sm:text-3xl font-black text-teal-300 font-['Outfit',sans-serif]">
                  about {activePeriodSummary.keptBuckets.toLocaleString()} buckets
                </span>
              </div>

              {/* Second line in orange: You waste: about X buckets */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#1e293b]">
                <span className="text-sm font-bold text-orange-400 font-['Outfit',sans-serif]">
                  You waste: about {activePeriodSummary.wastedBuckets.toLocaleString()} buckets
                </span>

                <button
                  type="button"
                  onClick={() => setShowWastedHelp(!showWastedHelp)}
                  className="w-5 h-5 rounded-full bg-orange-950/80 border border-orange-500/40 text-orange-300 text-xs font-bold flex items-center justify-center hover:bg-orange-900 transition cursor-pointer shrink-0"
                  title="What is wasted water?"
                  aria-label="Explain wasted water"
                >
                  ?
                </button>
              </div>

              {/* Wasted explanation popup/notice */}
              {showWastedHelp && (
                <div className="p-2.5 rounded-xl bg-orange-950/60 border border-orange-500/40 text-xs text-orange-200">
                  💡 <strong>Wasted</strong> = rain that soaks into the roof or spills out of a full tank.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Friendly Line & Biggest Cause Tip */}
        <div className="p-4 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-1.5 text-center">
          <p className="text-base sm:text-lg font-bold text-teal-300 font-['Outfit',sans-serif]">
            {activePeriodSummary.spilled === 0 && activePeriodSummary.kept > 0
              ? 'Great! Your tank is a good size.'
              : `Your tank helps you keep about ${activePeriodSummary.keptBuckets.toLocaleString()} more buckets!`}
          </p>

          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            💡 {causeTip}
          </p>
        </div>

        {/* Collapsible Grown-Up Details */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowGrownUpDetails(!showGrownUpDetails)}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer min-h-[44px]"
          >
            <span>👨‍👩‍👧 Grown-up details (litres &amp; math)</span>
            {showGrownUpDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {showGrownUpDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-4 sm:p-5 rounded-2xl bg-[#0b1120] border border-[#24354c] text-xs text-slate-300 space-y-3"
              >
                <div className="space-y-2">
                  {/* Row 1: Total Rain */}
                  <div className="p-3 rounded-xl bg-[#131d2e] border border-[#24354c] flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0 select-none">🌧️</span>
                      <span className="text-slate-300 font-semibold truncate">Total rain on roof</span>
                    </div>
                    <div className="text-right shrink-0">
                      <strong className="text-white font-mono text-sm block">
                        {activePeriodSummary.rainOnRoof.toLocaleString()} L
                      </strong>
                      <span className="text-[10px] text-slate-400 font-normal block">
                        ~{activePeriodSummary.rainOnRoofBuckets.toLocaleString()} buckets
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Caught by Roof */}
                  <div className="p-3 rounded-xl bg-[#131d2e] border border-[#24354c] flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0 select-none">🏠</span>
                      <span className="text-slate-300 font-semibold truncate">Caught by the roof</span>
                    </div>
                    <div className="text-right shrink-0">
                      <strong className="text-sky-300 font-mono text-sm block">
                        {activePeriodSummary.caught.toLocaleString()} L
                      </strong>
                      <span className="text-[10px] text-sky-400/80 font-normal block">
                        ~{activePeriodSummary.caughtBuckets.toLocaleString()} buckets
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Lost on Roof */}
                  <div className="p-3 rounded-xl bg-[#131d2e] border border-[#24354c] flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0 select-none">🍂</span>
                      <span className="text-slate-300 font-semibold truncate">Lost on the roof (soaks in)</span>
                    </div>
                    <div className="text-right shrink-0">
                      <strong className="text-amber-300 font-mono text-sm block">
                        {activePeriodSummary.lostOnRoof.toLocaleString()} L
                      </strong>
                      <span className="text-[10px] text-amber-400/80 font-normal block">
                        ~{activePeriodSummary.lostOnRoofBuckets.toLocaleString()} {activePeriodSummary.lostOnRoofBuckets === 1 ? 'bucket' : 'buckets'}
                      </span>
                    </div>
                  </div>

                  {/* Row 4: Kept in Tank */}
                  <div className="p-3 rounded-xl bg-[#131d2e] border border-teal-500/40 flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0 select-none">🟢</span>
                      <span className="text-teal-300 font-bold truncate">Kept in the tank</span>
                    </div>
                    <div className="text-right shrink-0">
                      <strong className="text-teal-300 font-mono text-sm block">
                        {activePeriodSummary.kept.toLocaleString()} L
                      </strong>
                      <span className="text-[10px] text-teal-400/80 font-normal block">
                        ~{activePeriodSummary.keptBuckets.toLocaleString()} {activePeriodSummary.keptBuckets === 1 ? 'bucket' : 'buckets'}
                      </span>
                    </div>
                  </div>

                  {/* Row 5: Spilled */}
                  <div className="p-3 rounded-xl bg-[#131d2e] border border-orange-500/40 flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0 select-none">🌊</span>
                      <span className="text-orange-300 font-bold truncate">Spilled (tank was full)</span>
                    </div>
                    <div className="text-right shrink-0">
                      <strong className="text-orange-400 font-mono text-sm block">
                        {activePeriodSummary.spilled.toLocaleString()} L
                      </strong>
                      <span className="text-[10px] text-orange-400/80 font-normal block">
                        ~{activePeriodSummary.spilledBuckets.toLocaleString()} {activePeriodSummary.spilledBuckets === 1 ? 'bucket' : 'buckets'}
                      </span>
                    </div>
                  </div>

                  {/* Row 6: Wasted in Total */}
                  <div className="p-3 rounded-xl bg-[#131d2e] border border-rose-500/40 flex flex-row items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0 select-none">🟠</span>
                      <span className="text-rose-300 font-bold truncate">Wasted in total</span>
                    </div>
                    <div className="text-right shrink-0">
                      <strong className="text-rose-300 font-mono text-sm block">
                        {activePeriodSummary.wasted.toLocaleString()} L
                      </strong>
                      <span className="text-[10px] text-rose-400/80 font-normal block">
                        ~{activePeriodSummary.wastedBuckets.toLocaleString()} {activePeriodSummary.wastedBuckets === 1 ? 'bucket' : 'buckets'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 italic pt-1 border-t border-[#1e293b]">
                  Invariant Check: Kept ({activePeriodSummary.kept.toLocaleString()} L) + Spilled ({activePeriodSummary.spilled.toLocaleString()} L) + Lost on Roof ({activePeriodSummary.lostOnRoof.toLocaleString()} L) = Total Rain on Roof ({activePeriodSummary.rainOnRoof.toLocaleString()} L).
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>


      {/* ────────────────────────────────────────────────────────────
          CARD C: 📅 WHICH MONTHS BRING THE MOST RAIN? (INTERACTIVE GRAPH)
          ──────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-7 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📅</span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-['Outfit',sans-serif] text-white">
                Which months bring the most rain?
              </h2>
              <p className="text-xs text-slate-300">
                Tap or click any month bar to see exact buckets saved and wasted.
              </p>
            </div>
          </div>

          {/* Toggle: Total rain only | Saved vs wasted */}
          <div className="inline-flex p-1 rounded-2xl bg-[#0b1120] border border-[#24354c] text-xs font-bold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartMode('total')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer min-h-[36px] ${
                chartMode === 'total' 
                  ? 'bg-sky-500 text-slate-950 shadow' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Total rain only
            </button>
            <button
              type="button"
              onClick={() => setChartMode('stacked')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer min-h-[36px] ${
                chartMode === 'stacked' 
                  ? 'bg-teal-400 text-slate-950 shadow' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Saved vs wasted
            </button>
          </div>
        </div>

        {/* Legend Chips (Clickable in stacked mode) */}
        {chartMode === 'stacked' && (
          <div className="flex items-center gap-3 text-xs font-bold">
            <button
              type="button"
              onClick={() => setShowSavedSeries(!showSavedSeries)}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                showSavedSeries 
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/50' 
                  : 'bg-[#0b1120] text-slate-500 border-[#24354c] line-through'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-teal-400 inline-block" />
              <span>🟢 Saved</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWastedSeries(!showWastedSeries)}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                showWastedSeries 
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/50' 
                  : 'bg-[#0b1120] text-slate-500 border-[#24354c] line-through'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
              <span>🟠 Wasted</span>
            </button>

            <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">
              (Tap legend to show/hide series)
            </span>
          </div>
        )}

        {/* 12 Interactive Month Bars */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1120] border border-[#24354c] relative overflow-hidden">
          <div 
            className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2 items-end min-h-[220px] pt-8 pb-2"
            role="region"
            aria-label="Monthly Rainfall Interactive Chart"
          >
            {monthlyBreakdown.map((m, idx) => {
              const isSelected = selectedMonthIdx === idx;
              const isRainiest = idx === maxRainIdx && m.rainfallMm > 0;
              const isDriest = idx === minRainIdx;

              const totalB = m.rainOnRoofBuckets;
              const savedB = m.keptBuckets;
              const wastedB = m.wastedBuckets;

              // Bar height % relative to peak month
              const barHeightPct = maxMonthlyBuckets > 0 
                ? Math.min(100, Math.max(10, Math.round((totalB / maxMonthlyBuckets) * 100))) 
                : 10;

              const savedPctOfBar = totalB > 0 ? (savedB / totalB) * 100 : 0;
              const wastedPctOfBar = totalB > 0 ? (wastedB / totalB) * 100 : 0;

              return (
                <button
                  key={m.monthName}
                  type="button"
                  onClick={() => setSelectedMonthIdx(idx)}
                  onKeyDown={(e) => handleKeyDownMonth(e, idx)}
                  tabIndex={0}
                  aria-label={`${m.monthName}: ${savedB} buckets saved, ${wastedB} wasted`}
                  className={`flex flex-col items-center gap-1.5 w-full transition-all focus:outline-none group cursor-pointer min-h-[44px] ${
                    isSelected ? 'scale-105 z-10' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Bucket Number Above Bar */}
                  <span className={`text-[10px] sm:text-xs font-bold font-mono transition-colors ${
                    isSelected ? 'text-teal-300 scale-110' : 'text-slate-300'
                  }`}>
                    {totalB}
                  </span>

                  {/* Vertical Bar Container */}
                  <div className={`w-full bg-[#131d2e] rounded-xl h-36 flex items-end justify-center p-1 relative overflow-hidden transition-all ${
                    isSelected ? 'ring-2 ring-teal-400 shadow-lg shadow-teal-500/20' : 'border border-transparent'
                  }`}>
                    <div
                      style={{ height: `${barHeightPct}%` }}
                      className="w-full rounded-lg overflow-hidden flex flex-col justify-end transition-all duration-300"
                    >
                      {chartMode === 'total' ? (
                        <div className="w-full h-full bg-sky-500 rounded-lg shadow-sm" />
                      ) : (
                        /* Stacked Bar: Wasted on top, Saved on bottom */
                        <div className="w-full h-full flex flex-col justify-end">
                          {showWastedSeries && wastedB > 0 && (
                            <div
                              style={{ height: `${showSavedSeries ? wastedPctOfBar : 100}%` }}
                              className="w-full bg-gradient-to-t from-orange-600 to-amber-500 transition-all duration-300"
                            />
                          )}
                          {showSavedSeries && savedB > 0 && (
                            <div
                              style={{ height: `${showWastedSeries ? savedPctOfBar : 100}%` }}
                              className="w-full bg-gradient-to-t from-teal-500 to-emerald-400 transition-all duration-300"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Month Label */}
                  <span className={`text-xs font-extrabold ${
                    isSelected ? 'text-teal-300 underline underline-offset-4' : 'text-slate-300'
                  }`}>
                    {m.monthName}
                  </span>

                  {/* Kicker Badges */}
                  {isRainiest && (
                    <span className="text-[8px] sm:text-[9px] font-extrabold text-sky-300 bg-sky-950 border border-sky-800 px-1 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                      🌧️ Rainiest
                    </span>
                  )}
                  {isDriest && !isRainiest && (
                    <span className="text-[8px] sm:text-[9px] font-bold text-amber-300 bg-amber-950 border border-amber-800 px-1 py-0.5 rounded uppercase tracking-wider whitespace-nowrap">
                      ☀️ Driest
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Month Detail Panel */}
        <div className="p-5 rounded-2xl bg-[#0b1120] border border-teal-500/40 shadow-inner space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <h3 className="text-lg font-black font-['Outfit',sans-serif] text-white">
                Selected Month: <span className="text-teal-300">{selectedMonthData.monthName}</span>
              </h3>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <button
                type="button"
                onClick={() => setSelectedMonthIdx((selectedMonthIdx - 1 + 12) % 12)}
                className="p-1 rounded-lg bg-[#131d2e] hover:text-white transition cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>{selectedMonthIdx + 1} / 12</span>
              <button
                type="button"
                onClick={() => setSelectedMonthIdx((selectedMonthIdx + 1) % 12)}
                className="p-1 rounded-lg bg-[#131d2e] hover:text-white transition cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#131d2e] border border-[#24354c]">
              <span className="text-slate-400 block font-medium">🌧️ Rain on Roof</span>
              <strong className="text-base font-black text-white font-['Outfit',sans-serif] block mt-0.5">
                {selectedMonthData.rainOnRoofBuckets.toLocaleString()} {selectedMonthData.rainOnRoofBuckets === 1 ? 'bucket' : 'buckets'}
              </strong>
              <span className="text-[10px] text-slate-400 font-mono">
                {formatVolume(selectedMonthData.rainOnRoof)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#131d2e] border border-teal-500/30">
              <span className="text-teal-400 block font-bold">🟢 Saved Water</span>
              <strong className="text-base font-black text-teal-300 font-['Outfit',sans-serif] block mt-0.5">
                {selectedMonthData.keptBuckets.toLocaleString()} {selectedMonthData.keptBuckets === 1 ? 'bucket' : 'buckets'}
              </strong>
              <span className="text-[10px] text-teal-400/80 font-mono">
                {formatVolume(selectedMonthData.kept)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#131d2e] border border-amber-500/30">
              <span className="text-amber-400 block font-bold">Lost on roof</span>
              <strong className="text-base font-black text-amber-300 font-['Outfit',sans-serif] block mt-0.5">
                {selectedMonthData.lostOnRoofBuckets.toLocaleString()} {selectedMonthData.lostOnRoofBuckets === 1 ? 'bucket' : 'buckets'}
              </strong>
              <span className="text-[10px] text-amber-400/80 font-mono">
                {formatVolume(selectedMonthData.lostOnRoof)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#131d2e] border border-orange-500/30">
              <span className="text-orange-400 block font-bold">Spilled</span>
              <strong className="text-base font-black text-orange-400 font-['Outfit',sans-serif] block mt-0.5">
                {selectedMonthData.spilledBuckets.toLocaleString()} {selectedMonthData.spilledBuckets === 1 ? 'bucket' : 'buckets'}
              </strong>
              <span className="text-[10px] text-orange-400/80 font-mono">
                {formatVolume(selectedMonthData.spilled)}
              </span>
            </div>
          </div>

          <p className="text-sm font-bold text-slate-200 text-center font-['Outfit',sans-serif]">
            In {selectedMonthData.monthName} you save about{' '}
            <span className="text-teal-300">{selectedMonthData.keptBuckets.toLocaleString()} buckets</span> and waste about{' '}
            <span className="text-orange-400">{selectedMonthData.wastedBuckets.toLocaleString()} buckets</span>.
          </p>
        </div>


        {/* ────────────────────────────────────────────────────────────
            CARD D: 🛢️ "TRY A BIGGER TANK" SLIDER (WHAT-IF INTERACTIVE PREVIEW)
            ──────────────────────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-amber-500/40 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e293b] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛢️</span>
              <h3 className="text-base sm:text-lg font-black font-['Outfit',sans-serif] text-white flex items-center gap-2">
                <span>Try a different tank size</span>
                {isPreviewing && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/40">
                    Preview
                  </span>
                )}
              </h3>
            </div>

            <div className="text-xs font-bold text-amber-300">
              {savedDiffB > 0 ? (
                <span>+{savedDiffB.toLocaleString()} buckets saved with this tank!</span>
              ) : savedDiffB < 0 ? (
                <span className="text-rose-400">{savedDiffB.toLocaleString()} buckets saved</span>
              ) : (
                <span className="text-slate-400">Same savings as current tank</span>
              )}
            </div>
          </div>

          {/* Slider & Stepper Controls */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>Preview Tank Size: <strong className="text-sky-300 font-mono text-sm">{previewTankL.toLocaleString()} Litres</strong></span>
              <span className="text-slate-400 font-normal">Real building tank: {actualTankCapacityL.toLocaleString()} L</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPreviewTankL(Math.max(0, previewTankL - 250))}
                className="w-10 h-10 rounded-xl bg-[#131d2e] hover:bg-[#1f2d42] border border-[#24354c] text-white font-bold text-lg flex items-center justify-center cursor-pointer shrink-0"
                title="Decrease preview tank size"
              >
                −
              </button>

              <input
                type="range"
                min={0}
                max={sliderMax}
                step={250}
                value={previewTankL}
                onChange={(e) => setPreviewTankL(parseInt(e.target.value, 10) || 0)}
                className="w-full h-2.5 bg-[#131d2e] rounded-lg appearance-none cursor-pointer accent-teal-400"
              />

              <button
                type="button"
                onClick={() => setPreviewTankL(previewTankL + 250)}
                className="w-10 h-10 rounded-xl bg-[#131d2e] hover:bg-[#1f2d42] border border-[#24354c] text-white font-bold text-lg flex items-center justify-center cursor-pointer shrink-0"
                title="Increase preview tank size"
              >
                +
              </button>
            </div>

            {/* Slider Action Buttons */}
            {isPreviewing && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewTankL(actualTankCapacityL)}
                  className="px-3.5 py-2 rounded-xl bg-[#131d2e] hover:bg-[#1e293b] text-slate-300 border border-[#24354c] font-bold text-xs cursor-pointer flex items-center gap-1.5 min-h-[40px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateTanks) {
                      if (previewTankL === 0) {
                        onUpdateTanks([], true);
                      } else {
                        const newTanks: StorageTankItem[] = [
                          { id: 'tank_1', name: 'Tank 1', capacity: String(previewTankL) }
                        ];
                        onUpdateTanks(newTanks, false);
                      }
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-md min-h-[40px]"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Use this tank size ({previewTankL.toLocaleString()} L)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* ────────────────────────────────────────────────────────────
          CARD E: WHAT CAN YOU DO WITH THIS WATER? (THREE CARDS)
          ──────────────────────────────────────────────────────────── */}
      <div className="p-5 sm:p-7 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-xl space-y-6">
        <div className="flex items-center justify-between gap-2 border-b border-[#1e293b] pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💡</span>
            <h2 className="text-xl sm:text-2xl font-black font-['Outfit',sans-serif] text-white">
              What can you do with this water?
            </h2>
          </div>
        </div>

        {activePeriodSummary.keptBuckets <= 0 ? (
          <div className="p-6 rounded-2xl bg-[#0b1120] border border-[#24354c] text-center space-y-2">
            <span className="text-3xl">🌧️</span>
            <p className="text-base font-bold text-slate-300">
              No saved water in this period yet. Add or expand your tank to catch rain!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-2">
              <span className="text-3xl">🪣</span>
              <h3 className="text-xl font-black text-teal-300 font-['Outfit',sans-serif]">
                About {activePeriodSummary.keptBuckets.toLocaleString()} buckets
              </h3>
              <p className="text-xs text-slate-300">
                Like carrying {activePeriodSummary.keptBuckets.toLocaleString()} buckets of clean water home.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-2">
              <span className="text-3xl">🚽</span>
              <h3 className="text-xl font-black text-sky-300 font-['Outfit',sans-serif]">
                About {Math.round(activePeriodSummary.kept / 6).toLocaleString()} flushes
              </h3>
              <p className="text-xs text-slate-300">
                Enough to flush standard toilets {Math.round(activePeriodSummary.kept / 6).toLocaleString()} times.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-2">
              <span className="text-3xl">🏠</span>
              <h3 className="text-xl font-black text-amber-300 font-['Outfit',sans-serif]">
                Family Use
              </h3>
              <p className="text-xs text-slate-300">
                Covers non-drinking water needs (cleaning, washing, gardening) for your occupants.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
