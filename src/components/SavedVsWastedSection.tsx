import React from 'react';
import { motion } from 'motion/react';
import { 
  Droplet, 
  AlertTriangle, 
  Sparkles, 
  HelpCircle, 
  Check, 
  ArrowRight, 
  Info,
  Calendar,
  CloudRain,
  ShieldCheck,
  RotateCcw,
  Plus
} from 'lucide-react';
import { 
  CalculationResult, 
  CalculatorInputs, 
  EverydayConversionFactors 
} from '../types';
import { 
  calcSavedWasted, 
  toBuckets, 
  toWaterCans, 
  toFamilyBaths, 
  toToiletFlushes, 
  toTankerLoads, 
  toGardenAreaWatered, 
  toHouseholdDays, 
  getRelatableEverydayText, 
  getSavedWastedHeadlineSummary,
  DEFAULT_EVERYDAY_CONVERSIONS,
  MONTH_NAMES
} from '../utils/calculations';
import { useAppSettings } from '../context/AppSettingsContext';
import { PeriodSelector } from './PeriodSelector';

interface SavedVsWastedSectionProps {
  result: CalculationResult;
  inputs: CalculatorInputs;
  onOpenAssumptions?: () => void;
  onGoToLocation?: () => void;
  onGoToRoofInput?: () => void;
}

export const SavedVsWastedSection: React.FC<SavedVsWastedSectionProps> = ({
  result,
  inputs,
  onOpenAssumptions,
  onGoToLocation,
  onGoToRoofInput,
}) => {
  const { formatVolumeFull, formatVolume, formatArea, unit, period } = useAppSettings();

  const conversions: EverydayConversionFactors = 
    inputs.assumptions?.conversions || DEFAULT_EVERYDAY_CONVERSIONS;

  const householdSize = parseInt(inputs.householdSize || '4', 10);
  const dailyPerPersonL = inputs.assumptions?.demands
    ? inputs.assumptions.demands.toilet +
      inputs.assumptions.demands.cleaning +
      inputs.assumptions.demands.gardening +
      inputs.assumptions.demands.vehicle
    : 60;

  const recommendedTankL = result.householdPlan?.tankAdequacy.recommendedSize || 2000;

  // Active rainfall depending on period
  const rainfallMm = period === 'week' 
    ? (result.weeklyRainfallMm || 0) 
    : period === 'month'
    ? (result.monthlyRainfallMm ?? (result.scaledAnnualRainfallMm ? Math.round(result.scaledAnnualRainfallMm / 12) : 0))
    : (result.scaledAnnualRainfallMm || result.annualRainfallMm || 0);

  // Compute live breakdown using the calculation engine with multi-roofs and multi-tanks
  const breakdown = calcSavedWasted(
    period,
    result.roofsList && result.roofsList.length > 0 ? result.roofsList : inputs.roofs,
    rainfallMm,
    result.tanks && result.tanks.length > 0 ? result.tanks : inputs.tanks,
    inputs.noTankYet ?? result.isNoTankYet,
    recommendedTankL,
    result.hasLocation,
    inputs.assumptions,
    unit
  );

  // Headline summary at top
  const headlineInfo = getSavedWastedHeadlineSummary(breakdown, conversions);

  // Format buckets for display
  const savedBuckets = toBuckets(breakdown.savedL, conversions.bucketSizeL);
  const lostBuckets = toBuckets(breakdown.lostOnRoofL, conversions.bucketSizeL);
  const overflowBuckets = toBuckets(breakdown.overflowedL, conversions.bucketSizeL);
  const totalWastedBuckets = toBuckets(breakdown.totalWastedL, conversions.bucketSizeL);

  // ═══════════════════════════════════════════════════════════════════
  // CHART A: BIG DONUT CHART MATHS (SVG Arc calculation)
  // ═══════════════════════════════════════════════════════════════════
  const donutSize = 220;
  const strokeWidth = 32;
  const radius = (donutSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Percentages for arc offsets
  const savedPct = breakdown.savedPercentage / 100;
  const overflowPct = breakdown.overflowPercentage / 100;
  const lostPct = breakdown.lostPercentage / 100;

  const savedArc = savedPct * circumference;
  const overflowArc = overflowPct * circumference;
  const lostArc = lostPct * circumference;

  // ═══════════════════════════════════════════════════════════════════
  // CHART B: TANK CAPACITY & OVERFLOW ANIMATION VALUES
  // ═══════════════════════════════════════════════════════════════════
  const effectiveTank = breakdown.effectiveTankCapacityL || 2000;
  const isNoTank = Boolean(inputs.noTankYet || result.isNoTankYet);
  const hasOverflow = breakdown.overflowedL > 0;

  // Active period title for section headers
  const currentMonthName = MONTH_NAMES[new Date().getMonth()];
  const activePeriodTitle = period === 'week'
    ? 'Water you could save this week'
    : period === 'month'
    ? `Water you could save this month (${currentMonthName})`
    : 'Water you could save in a typical year';

  // ═══════════════════════════════════════════════════════════════════
  // CHART C: MONTHLY STACKED BAR CHART DATA
  // ═══════════════════════════════════════════════════════════════════
  const monthlyRainfall = inputs.typicalMonthlyRainfallMm || 
    result.simulation?.months.map(m => m.rainfallMm) || 
    new Array(12).fill(result.annualRainfallMm > 0 ? result.annualRainfallMm / 12 : 0);

  let bestMonthIndex = 0;
  let maxMonthRain = 0;

  const monthlyBars = monthlyRainfall.map((rain, idx) => {
    const monthRainOnRoof = Math.round(result.roofArea * rain);
    const monthCollected = Math.round(monthRainOnRoof * result.runoffCoefficient);
    const monthLost = Math.max(0, monthRainOnRoof - monthCollected);
    const monthSaved = Math.min(monthCollected, effectiveTank);
    const monthOverflow = Math.max(0, monthCollected - effectiveTank);
    const monthWasted = monthLost + monthOverflow;

    if (rain > maxMonthRain) {
      maxMonthRain = rain;
      bestMonthIndex = idx;
    }

    return {
      monthName: MONTH_NAMES[idx] || `M${idx + 1}`,
      rainMm: rain,
      totalL: monthRainOnRoof,
      savedL: monthSaved,
      wastedL: monthWasted,
      overflowL: monthOverflow,
      lostL: monthLost,
    };
  });

  const maxMonthTotalL = Math.max(1, ...monthlyBars.map(m => m.totalL));

  // ═══════════════════════════════════════════════════════════════════
  // BUCKET ICON VISUAL ROW (1 icon = 10 buckets)
  // ═══════════════════════════════════════════════════════════════════
  const totalBucketStacks = Math.floor(savedBuckets / 10);
  const remainderBuckets = savedBuckets % 10;
  const maxIconsToRender = 16;
  const renderedIconsCount = Math.min(totalBucketStacks, maxIconsToRender);
  const extraStacksCount = Math.max(0, totalBucketStacks - maxIconsToRender);

  return (
    <section 
      id="saved-vs-wasted-section"
      aria-label="Saved versus Wasted Water Visual Analysis"
      className="space-y-6"
    >
      {/* ═════════════════════════════════════════════════════════════
          4. HEADLINE SUMMARY AT THE TOP (Live Updating Banner)
          ═════════════════════════════════════════════════════════════ */}
      <div 
        className={`p-5 sm:p-6 rounded-3xl border shadow-sm transition-all ${
          !breakdown.hasLocation || !breakdown.hasRoofArea
            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
            : headlineInfo.isGood
            ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white dark:from-emerald-950/40 dark:via-slate-900 dark:to-slate-850 border-emerald-300 dark:border-emerald-800'
            : 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/60 dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-850 border-amber-300/80 dark:border-amber-800/80'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="text-3xl sm:text-4xl shrink-0 select-none" role="img" aria-label="Summary icon">
              {headlineInfo.icon}
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                  {period === 'week' ? '📅 Live Weekly View' : '🗓️ Typical Annual View'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Approximate estimate • Not guaranteed
                </span>
              </div>
              <h2 className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-slate-900 dark:text-white mt-1.5 leading-snug">
                {headlineInfo.headline}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                {headlineInfo.subtext}
              </p>
            </div>
          </div>

          {/* Quick jump actions if missing inputs */}
          {(!breakdown.hasLocation || !breakdown.hasRoofArea) && (
            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              {!breakdown.hasRoofArea && onGoToRoofInput && (
                <button
                  type="button"
                  onClick={onGoToRoofInput}
                  className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs shadow-md transition cursor-pointer min-h-[44px]"
                >
                  Enter Roof Size
                </button>
              )}
              {!breakdown.hasLocation && onGoToLocation && (
                <button
                  type="button"
                  onClick={onGoToLocation}
                  className="px-4 py-2.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs shadow-md transition cursor-pointer min-h-[44px]"
                >
                  Choose Location
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          SECTION HEADER + THREE-WAY PERIOD TOGGLE
          ═════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <h3 className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
              {activePeriodTitle}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            See exactly how much rainwater reaches your tank and how much spills or gets lost.
          </p>
        </div>

        {/* Three-way Global Period Selector: [ This week ] [ This month ] [ Typical year ] */}
        <PeriodSelector showDescriptions />
      </div>

      {/* ═════════════════════════════════════════════════════════════
          2. GRAPHICAL PRESENTATION: BUILD ALL FOUR (A, B, C, D)
          ═════════════════════════════════════════════════════════════ */}

      {/* ROW 1: Chart A (Big Donut Chart) + Chart B (Animated Water Tank Graphic) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ───────── CHART A: BIG DONUT CHART ───────── */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Visual Chart A
              </div>
              <h4 className="font-['Outfit',sans-serif] font-bold text-lg text-slate-900 dark:text-white">
                Rainfall Share on Your Roof
              </h4>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Total: {formatVolumeFull(breakdown.totalRainOnRoofL)}
            </span>
          </div>

          {/* Donut Graphic + Centre Text */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="relative shrink-0 flex items-center justify-center">
              <svg 
                width={donutSize} 
                height={donutSize} 
                viewBox={`0 0 ${donutSize} ${donutSize}`}
                role="img"
                aria-label={`Donut chart showing ${breakdown.savedPercentage}% saved, ${breakdown.overflowPercentage}% overflowed, and ${breakdown.lostPercentage}% lost on roof`}
                className="transform -rotate-90"
              >
                <defs>
                  {/* Pattern for Overflow (dotted orange) */}
                  <pattern id="overflowPattern" width="6" height="6" patternUnits="userSpaceOnUse">
                    <circle cx="3" cy="3" r="1.5" fill="#f97316" />
                  </pattern>
                  {/* Pattern for Lost on Roof (striped red/grey) */}
                  <pattern id="lostPattern" width="8" height="8" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="0" y2="8" stroke="#94a3b8" strokeWidth="2.5" />
                  </pattern>
                </defs>

                {/* Background base circle */}
                <circle
                  cx={donutSize / 2}
                  cy={donutSize / 2}
                  r={radius}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth={strokeWidth}
                  className="dark:stroke-slate-800"
                />

                {breakdown.totalRainOnRoofL > 0 ? (
                  <>
                    {/* 1. Saved Arc (Green) */}
                    <circle
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={radius}
                      fill="none"
                      stroke="#059669"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${savedArc} ${circumference}`}
                      strokeDashoffset={0}
                      className="transition-all duration-700 ease-out"
                    />

                    {/* 2. Overflowed Arc (Orange) */}
                    <circle
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={radius}
                      fill="none"
                      stroke="#ea580c"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${overflowArc} ${circumference}`}
                      strokeDashoffset={-savedArc}
                      className="transition-all duration-700 ease-out"
                    />

                    {/* 3. Lost on Roof Arc (Red/Grey) */}
                    <circle
                      cx={donutSize / 2}
                      cy={donutSize / 2}
                      r={radius}
                      fill="none"
                      stroke="#64748b"
                      strokeWidth={strokeWidth}
                      strokeDasharray={`${lostArc} ${circumference}`}
                      strokeDashoffset={-(savedArc + overflowArc)}
                      className="transition-all duration-700 ease-out"
                    />
                  </>
                ) : (
                  <circle
                    cx={donutSize / 2}
                    cy={donutSize / 2}
                    r={radius}
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth={strokeWidth}
                  />
                )}
              </svg>

              {/* Centre Text: "X% saved" */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-3">
                <span className="font-['Outfit',sans-serif] font-black text-3xl sm:text-4xl text-emerald-800 dark:text-emerald-400 leading-none">
                  {breakdown.savedPercentage}%
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-700 dark:text-slate-300 mt-1 uppercase tracking-wide">
                  Saved
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  of all rain
                </span>
              </div>
            </div>

            {/* Plain Words Legend with Litres & Buckets beside each slice */}
            <div className="w-full sm:w-auto space-y-2.5 text-xs sm:text-sm">
              {/* Green: Saved */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-700 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-emerald-950 dark:text-emerald-200">
                      💧 Saved (in tank):
                    </span>
                    <span className="font-mono font-black text-emerald-900 dark:text-emerald-300">
                      {breakdown.savedL.toLocaleString()} L
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-800 dark:text-emerald-400">
                    ≈ {savedBuckets.toLocaleString()} buckets ({breakdown.savedPercentage}%)
                  </span>
                </div>
              </div>

              {/* Orange: Overflowed */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-orange-50/80 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800">
                <div className="w-3.5 h-3.5 rounded-full bg-orange-600 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-orange-950 dark:text-orange-200">
                      💦 Overflowed:
                    </span>
                    <span className="font-mono font-black text-orange-900 dark:text-orange-300">
                      {breakdown.overflowedL.toLocaleString()} L
                    </span>
                  </div>
                  <span className="text-[11px] text-orange-800 dark:text-orange-400">
                    ≈ {overflowBuckets.toLocaleString()} buckets ({breakdown.overflowPercentage}%)
                  </span>
                </div>
              </div>

              {/* Grey/Red: Lost on Roof */}
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-500 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      🏠 Lost on roof:
                    </span>
                    <span className="font-mono font-black text-slate-800 dark:text-slate-300">
                      {breakdown.lostOnRoofL.toLocaleString()} L
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    ≈ {lostBuckets.toLocaleString()} buckets ({breakdown.lostPercentage}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 text-center border-t border-slate-100 dark:border-slate-800">
            Saved + Lost + Overflowed = <strong>{breakdown.totalRainOnRoofL.toLocaleString()} L</strong> (Always 100% of rain falling on your roof)
          </div>
        </div>

        {/* ───────── CHART B: ANIMATED WATER TANK GRAPHIC (MULTIPLE TANKS) ───────── */}
        <div className="lg:col-span-6 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Visual Chart B
              </div>
              <h4 className="font-['Outfit',sans-serif] font-bold text-lg text-slate-900 dark:text-white">
                Live Tank Fill &amp; Overflow ({breakdown.tanksFill.length} {breakdown.tanksFill.length === 1 ? 'Tank' : 'Tanks'})
              </h4>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isNoTank
                ? 'bg-rose-100 text-rose-900 border border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
                : hasOverflow
                ? 'bg-orange-100 text-orange-900 border border-orange-300 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800'
                : 'bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
            }`}>
              {isNoTank ? '⚠️ No Tank (100% Wasted)' : hasOverflow ? '⚠️ Tanks Overflowing' : '✅ Safely Within Tanks'}
            </span>
          </div>

          {/* Animated Tank Diagram */}
          <div className="relative flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/70 dark:from-slate-850 dark:to-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[240px]">
            
            {/* If user has no tank yet */}
            {isNoTank ? (
              <div className="py-6 px-4 text-center space-y-3 w-full">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-rose-50 dark:bg-rose-950/60 border-2 border-dashed border-rose-300 dark:border-rose-800 flex items-center justify-center text-3xl">
                  🪣
                </div>
                <h4 className="font-['Outfit',sans-serif] font-extrabold text-base sm:text-lg text-rose-900 dark:text-rose-200 leading-snug">
                  Without a tank, 100% of your harvestable water ({formatVolume(breakdown.waterCollectedL)}) is wasted!
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  All rain falling on your roof is currently lost to evaporation or drains away. Adding a storage tank captures this water for your household chores.
                </p>
                {onGoToRoofInput && (
                  <button
                    type="button"
                    onClick={onGoToRoofInput}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-850 hover:bg-teal-900 text-white font-bold text-xs shadow-md transition cursor-pointer min-h-[44px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add a Storage Tank</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Overflow spilling label & graphic if overflow occurs */}
                {hasOverflow && (
                  <div className="absolute top-2 right-2 sm:right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold shadow-md animate-bounce">
                    <span>💦 +{formatVolume(breakdown.overflowedL)} wasted</span>
                  </div>
                )}

                {/* Tanks side-by-side in horizontal container */}
                <div className="w-full flex items-end justify-center gap-3 sm:gap-5 overflow-x-auto py-3 px-2">
                  {breakdown.tanksFill.map((tank, idx) => {
                    const isLastTank = idx === breakdown.tanksFill.length - 1;
                    const tankHasOverflow = isLastTank && hasOverflow;

                    return (
                      <div key={tank.id} className="flex items-end gap-2 shrink-0">
                        {/* Single Tank Card */}
                        <div className="flex flex-col items-center">
                          {/* Tank Title & Capacity */}
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[110px] mb-1">
                            {tank.name}
                          </span>

                          {/* Physical Tank Container */}
                          <div className="relative w-28 sm:w-32 h-48 sm:h-52 rounded-2xl border-4 border-slate-700 dark:border-slate-600 bg-white/90 dark:bg-slate-900/90 shadow-inner overflow-hidden flex flex-col justify-end">
                            
                            {/* Overflow spout on right if this tank overflows */}
                            {tankHasOverflow && (
                              <>
                                <div className="absolute top-3 -right-1 w-3.5 h-3 rounded-r-md border border-slate-700 bg-orange-500 shadow-sm" />
                                <div className="absolute top-6 right-0 flex flex-col items-center z-10 motion-safe:animate-pulse">
                                  <div className="w-1.5 h-2.5 bg-orange-400 rounded-full my-0.5" />
                                  <div className="w-2 h-2 bg-orange-500 rounded-full my-0.5" />
                                </div>
                              </>
                            )}

                            {/* Level Markings (0%, 50%, 100%) */}
                            <div className="absolute inset-y-2 left-1.5 flex flex-col justify-between text-[8px] font-mono font-bold text-slate-400 pointer-events-none select-none z-10">
                              <span>100%</span>
                              <span>50%</span>
                              <span>0%</span>
                            </div>

                            {/* Water Body */}
                            <div 
                              className={`w-full transition-all duration-700 ease-out relative ${
                                tank.fillPct >= 100
                                  ? 'bg-gradient-to-t from-teal-800 via-teal-600 to-emerald-500' 
                                  : 'bg-gradient-to-t from-teal-700 to-emerald-500'
                              }`}
                              style={{ height: `${Math.max(4, Math.min(100, tank.fillPct))}%` }}
                            >
                              {/* Wave Ripple */}
                              <div 
                                className="absolute top-0 left-0 right-0 h-2 bg-white/30 -translate-y-0.5 motion-safe:animate-pulse"
                                aria-hidden="true"
                              />

                              {/* Fill % label */}
                              <div className="absolute inset-0 flex items-center justify-center text-white font-['Outfit',sans-serif] font-black text-sm drop-shadow-md">
                                {tank.fillPct}%
                              </div>
                            </div>

                            {/* Inflow Pipe on top */}
                            <div className="absolute top-0 left-4 w-3 h-3 bg-slate-300 dark:bg-slate-700 border-x border-slate-600" />
                          </div>

                          {/* Tank Stats below cylinder */}
                          <div className="text-center mt-2">
                            <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200 block">
                              {formatVolume(tank.fillL)}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                              of {formatVolume(tank.capacityL)}
                            </span>
                          </div>
                        </div>

                        {/* Connecting Pipe / Arrow between tanks */}
                        {!isLastTank && (
                          <div className="mb-24 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                            <span className="text-xs font-bold leading-none mb-1">➡️</span>
                            <span className="text-[9px] uppercase tracking-tighter font-semibold">fills</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Tanks Total Storage Readout */}
                <div className="text-center mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 w-full">
                  <span className="font-['Outfit',sans-serif] font-bold text-sm sm:text-base text-slate-900 dark:text-white block">
                    {formatVolume(breakdown.savedL)} saved across {breakdown.tanksFill.length} {breakdown.tanksFill.length === 1 ? 'tank' : 'tanks'} ({formatVolume(breakdown.effectiveTankCapacityL)} total capacity)
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {hasOverflow ? (
                      <strong className="text-orange-700 dark:text-orange-300">
                        +{formatVolume(breakdown.overflowedL)} overflowing past all tanks
                      </strong>
                    ) : (
                      `${formatVolume(Math.max(0, breakdown.effectiveTankCapacityL - breakdown.savedL))} remaining headroom across tanks`
                    )}
                  </span>
                </div>
              </>
            )}

          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
            {isNoTank ? (
              <span>⚠️ No tank configured yet. Harvestable rain is being lost.</span>
            ) : hasOverflow ? (
              <span>😟 <strong>{overflowBuckets.toLocaleString()} buckets</strong> spilled over. Tanks fill in order (Tank 1 first, then Tank 2). Consider adding another tank.</span>
            ) : (
              <span>👏 No overflow detected. Tanks fill in sequence and have enough room for this period&apos;s rain.</span>
            )}
          </p>
        </div>

      </div>

      {/* ROW 2: Chart C (Monthly Stacked Bar Chart) + Chart D (Before / After Comparison Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* ───────── CHART C: MONTHLY STACKED BAR CHART FOR TYPICAL YEAR ───────── */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Visual Chart C • 12-Month Rainfall Pattern
              </div>
              <h4 className="font-['Outfit',sans-serif] font-bold text-lg text-slate-900 dark:text-white">
                Monthly Saved vs Wasted Rain
              </h4>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                <span className="w-3 h-3 rounded-sm bg-emerald-600" />
                <span>Saved</span>
              </span>
              <span className="inline-flex items-center gap-1.5 font-bold text-orange-700 dark:text-orange-400">
                <span className="w-3 h-3 rounded-sm bg-orange-500" />
                <span>Wasted (Lost / Overflow)</span>
              </span>
            </div>
          </div>

          {/* Responsive SVG Stacked Bar Chart */}
          <div className="w-full overflow-x-auto pb-2">
            <div className="min-w-[540px]">
              <svg 
                viewBox="0 0 540 180" 
                className="w-full h-44 sm:h-52 select-none"
                role="img"
                aria-label="Monthly stacked bar chart showing saved and wasted water across 12 months"
              >
                {/* Horizontal guide lines */}
                <line x1="30" y1="30" x2="520" y2="30" stroke="#f1f5f9" strokeDasharray="3 3" className="dark:stroke-slate-800" />
                <line x1="30" y1="80" x2="520" y2="80" stroke="#f1f5f9" strokeDasharray="3 3" className="dark:stroke-slate-800" />
                <line x1="30" y1="130" x2="520" y2="130" stroke="#f1f5f9" strokeDasharray="3 3" className="dark:stroke-slate-800" />
                <line x1="30" y1="150" x2="520" y2="150" stroke="#cbd5e1" className="dark:stroke-slate-700" />

                {/* 12 Month Bars */}
                {monthlyBars.map((bar, i) => {
                  const x = 40 + i * 40;
                  const barWidth = 24;
                  const maxHeight = 110;
                  const totalHeight = maxMonthTotalL > 0 
                    ? Math.round((bar.totalL / maxMonthTotalL) * maxHeight) 
                    : 0;

                  const savedShare = bar.totalL > 0 ? bar.savedL / bar.totalL : 0;
                  const savedHeight = Math.round(totalHeight * savedShare);
                  const wastedHeight = totalHeight - savedHeight;

                  const yBase = 150;
                  const ySaved = yBase - savedHeight;
                  const yWasted = ySaved - wastedHeight;

                  const isBestMonth = i === bestMonthIndex && bar.rainMm > 0;

                  return (
                    <g key={bar.monthName} className="group cursor-pointer">
                      {/* Highlight Best Month Badge */}
                      {isBestMonth && (
                        <g>
                          <rect 
                            x={x - 12} 
                            y={yWasted - 22} 
                            width={48} 
                            height={16} 
                            rx={4} 
                            fill="#0d9488" 
                          />
                          <text 
                            x={x + 12} 
                            y={yWasted - 11} 
                            textAnchor="middle" 
                            fontSize="8" 
                            fontWeight="bold" 
                            fill="#ffffff"
                          >
                            🌧️ Peak
                          </text>
                        </g>
                      )}

                      {/* Wasted Bar Segment (Orange/Red) */}
                      {wastedHeight > 0 && (
                        <rect
                          x={x}
                          y={yWasted}
                          width={barWidth}
                          height={wastedHeight}
                          rx={3}
                          fill="#f97316"
                          className="opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <title>{bar.monthName}: {bar.wastedL.toLocaleString()} L wasted ({bar.rainMm} mm rain)</title>
                        </rect>
                      )}

                      {/* Saved Bar Segment (Green) */}
                      {savedHeight > 0 && (
                        <rect
                          x={x}
                          y={ySaved}
                          width={barWidth}
                          height={savedHeight}
                          rx={wastedHeight > 0 ? 0 : 3}
                          fill="#059669"
                          className="opacity-95 hover:opacity-100 transition-opacity"
                        >
                          <title>{bar.monthName}: {bar.savedL.toLocaleString()} L saved</title>
                        </rect>
                      )}

                      {/* Zero rain indicator */}
                      {totalHeight === 0 && (
                        <circle cx={x + barWidth / 2} cy={146} r="2" fill="#cbd5e1" />
                      )}

                      {/* Month Label */}
                      <text
                        x={x + barWidth / 2}
                        y={166}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight={isBestMonth ? 'bold' : 'normal'}
                        fill={isBestMonth ? '#0d9488' : '#64748b'}
                      >
                        {bar.monthName}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span>
              🌧️ Most water falls in <strong>{MONTH_NAMES[bestMonthIndex]}</strong> ({maxMonthRain} mm).
            </span>
            <span>Real monthly data from your location</span>
          </div>
        </div>

        {/* ───────── CHART D: BEFORE / AFTER COMPARISON CARD ───────── */}
        <div className="lg:col-span-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-teal-900 via-teal-950 to-slate-900 text-white shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-teal-300">
              Visual Card D • Tank Benefit
            </div>
            <h4 className="font-['Outfit',sans-serif] font-black text-xl text-white mt-1">
              Before vs After Having a Tank
            </h4>
            <p className="text-xs text-teal-200/80 mt-1">
              What changes when you install a rainwater storage tank:
            </p>
          </div>

          {/* Simple Before / After Comparison */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-3">
            {/* Without a Tank */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300 block">
                  Without a Tank:
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  You save <strong className="text-rose-300">0 L</strong>
                </span>
              </div>
              <span className="text-xs text-rose-200 font-mono">100% lost</span>
            </div>

            {/* Arrow & Badge */}
            <div className="flex items-center justify-center gap-2 py-1">
              <div className="h-px bg-white/20 flex-1" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-black shadow-sm">
                <span>+{breakdown.savedL.toLocaleString()} L more</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <div className="h-px bg-white/20 flex-1" />
            </div>

            {/* With a Tank */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
                  With a Tank ({breakdown.effectiveTankCapacityL.toLocaleString()} L):
                </span>
                <span className="text-sm font-semibold text-white">
                  You save <strong className="text-emerald-300 font-black text-base">{breakdown.savedL.toLocaleString()} L</strong>
                </span>
              </div>
              <span className="text-xs text-emerald-300 font-bold">
                +{savedBuckets.toLocaleString()} buckets!
              </span>
            </div>
          </div>

          <p className="text-xs text-teal-100/90 leading-relaxed italic">
            &ldquo;Without a tank, all {breakdown.totalRainOnRoofL.toLocaleString()} L of rain pours into the street. With your tank, you preserve about {savedBuckets.toLocaleString()} buckets of clean water!&rdquo;
          </p>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════
          3. "IN EVERYDAY TERMS" CONVERTER CARD ("What does this mean?")
          ═════════════════════════════════════════════════════════════ */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        
        {/* Card Header with Edit Assumptions link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">💡</span>
              <h4 className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
                What does this mean in everyday life?
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Converting {formatVolumeFull(breakdown.savedL)} of saved water into relatable Indian household units:
            </p>
          </div>

          {onOpenAssumptions && (
            <button
              type="button"
              id="saved-wasted-edit-assumptions-btn"
              onClick={onOpenAssumptions}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer self-start sm:self-auto min-h-[40px]"
            >
              <span>⚙️ Edit Bucket / Can Sizes</span>
            </button>
          )}
        </div>

        {/* 6 Everyday Comparisons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          
          {/* 1. 🪣 Buckets */}
          <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-start gap-3">
            <span className="text-3xl shrink-0">🪣</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                Standard Buckets
              </span>
              <div className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-teal-950 dark:text-white mt-0.5">
                About {toBuckets(breakdown.savedL, conversions.bucketSizeL).toLocaleString()} buckets
              </div>
              <p className="text-xs text-teal-800/80 dark:text-teal-300/80 mt-1">
                Assuming 1 bucket ≈ {conversions.bucketSizeL} litres
              </p>
            </div>
          </div>

          {/* 2. 🚰 Drinking water cans */}
          <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-start gap-3">
            <span className="text-3xl shrink-0">🚰</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300 block">
                Water Cans
              </span>
              <div className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-sky-950 dark:text-white mt-0.5">
                About {toWaterCans(breakdown.savedL, conversions.waterCanSizeL).toLocaleString()} cans
              </div>
              <p className="text-xs text-sky-800/80 dark:text-sky-300/80 mt-1">
                Standard {conversions.waterCanSizeL}L blue bubbletop drinking cans
              </p>
            </div>
          </div>

          {/* 3. 🚿 Bathing days */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
            <span className="text-3xl shrink-0">🚿</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                Family Baths
              </span>
              <div className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-emerald-950 dark:text-white mt-0.5">
                About {toFamilyBaths(breakdown.savedL, conversions.bathSizeL).toLocaleString()} baths
              </div>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-1">
                Enough for {toFamilyBaths(breakdown.savedL, conversions.bathSizeL).toLocaleString()} bucket baths (~{conversions.bathSizeL} L each)
              </p>
            </div>
          </div>

          {/* 4. 🚽 Toilet flushes */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-start gap-3">
            <span className="text-3xl shrink-0">🚽</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 block">
                Toilet Flushes
              </span>
              <div className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-indigo-950 dark:text-white mt-0.5">
                About {toToiletFlushes(breakdown.savedL, conversions.toiletFlushSizeL).toLocaleString()} flushes
              </div>
              <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-1">
                Saving municipal water at ~{conversions.toiletFlushSizeL} L per flush
              </p>
            </div>
          </div>

          {/* 5. 👨‍👩‍👧 Days of household use */}
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-start gap-3">
            <span className="text-3xl shrink-0">👨‍👩‍👧</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 block">
                Family Chores Duration
              </span>
              <div className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-purple-950 dark:text-white mt-0.5">
                About {toHouseholdDays(breakdown.savedL, householdSize, dailyPerPersonL).toLocaleString()} days
              </div>
              <p className="text-xs text-purple-800/80 dark:text-purple-300/80 mt-1">
                For a family of {householdSize} (~{dailyPerPersonL * householdSize} L/day non-drinking)
              </p>
            </div>
          </div>

          {/* 6. 🌱 For farmers & gardeners */}
          <div className="p-4 rounded-2xl bg-lime-50/70 dark:bg-lime-950/40 border border-lime-200 dark:border-lime-800 flex items-start gap-3">
            <span className="text-3xl shrink-0">🌱</span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-lime-900 dark:text-lime-300 block">
                Garden / Crop Watering
              </span>
              <div className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-lime-950 dark:text-white mt-0.5">
                About {toGardenAreaWatered(breakdown.savedL, conversions.gardenWateringPerM2L).toLocaleString()} m²
              </div>
              <p className="text-xs text-lime-900/80 dark:text-lime-300/80 mt-1">
                Enough to water ~{toGardenAreaWatered(breakdown.savedL, conversions.gardenWateringPerM2L).toLocaleString()} m² of crops once (~{conversions.gardenWateringPerM2L} L/m²)
              </p>
            </div>
          </div>

        </div>

        {/* ───────── VISUAL ROW OF BUCKET ICONS (1 icon = 10 buckets) ───────── */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>👀 See the Saved Water:</span>
              <span className="text-teal-700 dark:text-teal-400 font-extrabold">
                {savedBuckets.toLocaleString()} buckets
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
              1 🪣 icon = 10 buckets (150 L)
            </span>
          </div>

          {/* Visual Row */}
          {savedBuckets > 0 ? (
            <div className="flex flex-wrap items-center gap-2 py-1">
              {Array.from({ length: renderedIconsCount }).map((_, idx) => (
                <div 
                  key={idx}
                  className="w-8 h-8 rounded-lg bg-teal-100/90 dark:bg-teal-950/80 border border-teal-300 dark:border-teal-700 flex items-center justify-center text-lg shadow-2xs hover:scale-110 transition-transform"
                  title={`10 buckets (${(idx + 1) * 10 * conversions.bucketSizeL} L)`}
                >
                  🪣
                </div>
              ))}

              {extraStacksCount > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-teal-800 text-white font-black text-xs shadow-sm">
                  +{extraStacksCount} more bucket stacks (+{(extraStacksCount * 10).toLocaleString()} buckets)
                </div>
              )}

              {remainderBuckets > 0 && totalBucketStacks === 0 && (
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 ml-1">
                  (about {remainderBuckets} buckets)
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-1 italic">
              No water saved yet for this period. Choose your location and check rainfall.
            </div>
          )}
        </div>

        {/* ───────── WASTED AMOUNT IN THE SAME TERMS ───────── */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          breakdown.totalWastedL > conversions.bucketSizeL
            ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300/80 dark:border-amber-800 text-amber-950 dark:text-amber-200'
            : 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300/80 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl shrink-0">
              {breakdown.totalWastedL > conversions.bucketSizeL ? '😟' : '👏'}
            </span>
            <div className="text-xs sm:text-sm">
              {breakdown.overflowedL > conversions.bucketSizeL ? (
                <span>
                  <strong>You are wasting about {overflowBuckets.toLocaleString()} buckets of water</strong> ({breakdown.overflowedL.toLocaleString()} L) because your tank is full. A bigger tank could save most of it.
                </span>
              ) : breakdown.lostOnRoofL > conversions.bucketSizeL ? (
                <span>
                  About {lostBuckets.toLocaleString()} buckets are naturally absorbed or splashed on your roof ({breakdown.lostOnRoofL.toLocaleString()} L).
                </span>
              ) : (
                <span>
                  <strong>Great setup!</strong> Almost nothing is wasted ({breakdown.savedPercentage}% collected safely).
                </span>
              )}
            </div>
          </div>

          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            {getRelatableEverydayText(breakdown.savedL, conversions, householdSize, dailyPerPersonL)}
          </div>
        </div>

      </div>

      {/* Approximate estimates footnote */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400 text-center py-1">
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>These are approximate estimates based on real weather data, not guaranteed amounts.</span>
      </div>

    </section>
  );
};
