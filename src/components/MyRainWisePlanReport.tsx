import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Printer, 
  Share2, 
  Check, 
  ArrowLeft, 
  Droplet, 
  IndianRupee, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Sparkles,
  Download
} from 'lucide-react';
import { CalculationResult, CalculatorInputs } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';
import { sqMetersToSqFeet } from '../utils/units';
import { SavedVsWastedSection } from './SavedVsWastedSection';

interface MyRainWisePlanReportProps {
  result: CalculationResult;
  inputs: CalculatorInputs;
  onEditPlan: () => void;
  onStartOver: () => void;
}

export const MyRainWisePlanReport: React.FC<MyRainWisePlanReportProps> = ({
  result,
  inputs,
  onEditPlan,
  onStartOver,
}) => {
  const { unit, formatVolumeFull, formatVolume, formatArea, formatRainfall } = useAppSettings();
  const [copied, setCopied] = useState(false);

  const isImperial = unit === 'imperial';
  const plan = result.householdPlan;
  const sim = result.simulation;

  // Print as PDF handler
  const handlePrint = () => {
    window.print();
  };

  // Share text summary
  const handleCopy = () => {
    const text = `🌧️ My RainWise Water-Planning Report:
• Location: ${inputs.locationName || 'Local Region'}
• Roof Area: ${formatArea(result.roofArea)} (${result.roofType})
• 3-Year Typical Rain: ${result.annualRainfallMm} mm / year
• This Week's Rain Harvest: ${formatVolumeFull(result.weeklyHarvestableWater)}
• Typical Yearly Harvest: ${formatVolumeFull(result.harvestableWater)} / year
• Suggested Tank: ${formatVolumeFull(plan?.tankAdequacy.recommendedSize || 2000)}
• Household Support: ${plan?.daysSupportedAllTasks} days for ${inputs.householdSize || '4'} people
• Overflow: ${formatVolumeFull(plan?.tankAdequacy.overflowLitres || 0)}
• Estimated Yearly Savings: ₹${(plan?.economicImpact.yearlyBillSavingsRs || 0).toLocaleString()} / year
• Estimated Payback: ${plan?.economicImpact.paybackPeriodYears ? `${plan.economicImpact.paybackPeriodYears} years` : 'Fast'}

Created with RainWise — Save Rain, Stop Wasting Water!`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Plain-Language Tips to collect more
  const actionableTips = [
    {
      icon: '🧹',
      title: 'Sweep Roof Before The Monsoon',
      desc: 'Dust and dry leaves reduce water flow by 10-15%. A quick broom sweep before the first shower ensures sparkling water.',
    },
    {
      icon: '🚿',
      title: 'Install A Simple First-Flush Diverter',
      desc: 'Diverting the first 5 minutes of rain washes away roof grime and ensures only pure rainwater reaches your storage tank.',
    },
    {
      icon: '🌱',
      title: 'Divert Overflow Into A Garden Recharge Well',
      desc: 'Any overflow water during torrential storms can be piped straight to tree roots or a soak pit to recharge your borewell.',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      
      {/* Top Action Bar (Hidden when printing) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          id="report-back-btn"
          onClick={onEditPlan}
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-900 dark:text-teal-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit My Plan</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="report-copy-btn"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>Share Summary</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="report-print-btn"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-white bg-teal-800 hover:bg-teal-900 active:bg-teal-950 px-4 py-2.5 rounded-2xl shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Download / Print as PDF</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          THE ONE-SCREEN SUMMARY CARD: "MY RAINWISE PLAN"
          ═══════════════════════════════════════════════════════ */}
      <div 
        id="rainwise-printable-report"
        className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border-2 border-teal-600/30 dark:border-teal-700/50 shadow-xl space-y-8 print:border-none print:shadow-none print:p-2"
      >
        
        {/* Report Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-950 text-white flex items-center justify-center text-2xl shadow-md shadow-teal-900/20 shrink-0">
              🌧️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black font-['Outfit',sans-serif] text-slate-900 dark:text-white tracking-tight">
                  My RainWise Plan
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200">
                  Official Household Plan
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Simple rainwater harvesting plan for {inputs.householdSize || '4'} people • {formatArea(result.roofArea)} roof{inputs.weatherInfo?.locationName ? ` • 📍 ${inputs.weatherInfo.locationName}` : ''}
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Prepared Date
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* 6 Core Findings in Plain Language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* 1. How much rainwater you could collect */}
          <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border-2 border-emerald-500/60 dark:border-emerald-600 flex items-start gap-4">
            <div className="text-3xl shrink-0">💧</div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                1. Rainwater You Can Collect
              </span>
              <div className="text-3xl sm:text-4xl font-black font-['Outfit',sans-serif] text-emerald-900 dark:text-emerald-200 mt-0.5">
                {formatVolumeFull(result.harvestableWater)} <span className="text-xs font-bold text-emerald-700">/ typical year</span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 mt-1 font-medium leading-relaxed">
                Based on 3-year rainfall average of {result.annualRainfallMm} mm at {inputs.locationName || 'your location'}.
              </p>
              {result.weeklyHarvestableWater > 0 && (
                <div className="mt-1.5 inline-block text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100">
                  This week's forecast: ~{formatVolumeFull(result.weeklyHarvestableWater)}
                </div>
              )}
            </div>
          </div>

          {/* 2. Suggested tank size */}
          <div className="p-5 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border-2 border-teal-500/60 dark:border-teal-600 flex items-start gap-4">
            <div className="text-3xl shrink-0">🛢️</div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                2. Recommended Tank Size
              </span>
              <div className="text-3xl sm:text-4xl font-black font-['Outfit',sans-serif] text-teal-900 dark:text-teal-200 mt-0.5">
                {formatVolumeFull(plan?.tankAdequacy.recommendedSize || 2000)}
              </div>
              <p className="text-xs sm:text-sm text-teal-800 dark:text-teal-300 mt-1 font-medium leading-relaxed">
                {result.tankCapacity > 0 
                  ? `You currently have a ${formatVolume(result.tankCapacity)} tank (${plan?.tankAdequacy.statusLabel}).`
                  : 'Sized to keep your taps running through 15 dry days between rain spells.'}
              </p>
            </div>
          </div>

          {/* 3. What the water can be used for */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-4">
            <div className="text-3xl shrink-0">🏡</div>
            <div className="w-full">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                3. What This Water Powers
              </span>
              <div className="text-xl sm:text-2xl font-black font-['Outfit',sans-serif] text-slate-900 dark:text-white mt-0.5">
                {plan?.daysSupportedAllTasks} Days of Non-Drinking Chores
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span>🚽 <strong>{plan?.waterUses[0]?.daysSupported} days</strong> toilet</span>
                <span>🧹 <strong>{plan?.waterUses[1]?.daysSupported} days</strong> mopping</span>
                <span>🌱 <strong>{plan?.waterUses[2]?.daysSupported} days</strong> plants</span>
                <span>🚗 <strong>{plan?.waterUses[3]?.daysSupported} days</strong> vehicle</span>
              </div>
            </div>
          </div>

          {/* 4. How much may overflow */}
          <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
            (plan?.tankAdequacy.overflowLitres || 0) > 0
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
              : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
          }`}>
            <div className="text-3xl shrink-0">
              {(plan?.tankAdequacy.overflowLitres || 0) > 0 ? '⚠️' : '🎉'}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                4. Overflow &amp; Water Loss
              </span>
              <div className={`text-xl sm:text-2xl font-black font-['Outfit',sans-serif] mt-0.5 ${
                (plan?.tankAdequacy.overflowLitres || 0) > 0
                  ? 'text-amber-800 dark:text-amber-300'
                  : 'text-emerald-800 dark:text-emerald-300'
              }`}>
                {(plan?.tankAdequacy.overflowLitres || 0) > 0
                  ? `~${formatVolumeFull(plan?.tankAdequacy.overflowLitres || 0)} overflow`
                  : 'Minimal to Zero Overflow'}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {(plan?.tankAdequacy.overflowLitres || 0) > 0
                  ? 'During peak monsoon months, overflow pipes should redirect excess to garden trenches.'
                  : 'Your tank size captures virtually every drop of rain falling on your roof.'}
              </p>
            </div>
          </div>

          {/* 5. Estimated yearly savings */}
          <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border-2 border-emerald-500/40 dark:border-emerald-600/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="text-3xl shrink-0">💰</div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                  5. Estimated Yearly Money Savings
                </span>
                <div className="text-2xl sm:text-3xl font-black font-['Outfit',sans-serif] text-slate-900 dark:text-white mt-0.5">
                  ₹{(plan?.economicImpact.yearlyBillSavingsRs || 0).toLocaleString()} per year
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Estimated payback period: <strong>{plan?.economicImpact.paybackPeriodYears ? `${plan.economicImpact.paybackPeriodYears} years` : 'Prompt'}</strong> on ~₹{(plan?.economicImpact.approxInstallationCostRs || 15000).toLocaleString()} setup.
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 self-start sm:self-center italic sm:text-right max-w-xs">
              * Approximate estimate based on ₹{inputs.waterTariff || '15'}/kL tariff. Not guaranteed.
            </div>
          </div>

        </div>

        {/* Saved vs Wasted Detailed Graphical Analysis */}
        <div className="pt-2">
          <SavedVsWastedSection
            result={result}
            inputs={inputs}
            onGoToRoofInput={onEditPlan}
          />
        </div>

        {/* 6. Plain-Language Tips to Collect More */}
        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="font-['Outfit',sans-serif] font-bold text-base text-slate-900 dark:text-white">
              6. Top 3 Practical Tips to Collect Even More
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {actionableTips.map((tip, idx) => (
              <div
                key={tip.title}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5"
              >
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                  <span className="text-lg">{tip.icon}</span>
                  <span>{tip.title}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-normal">
                  {tip.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Report Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>RainWise • Helping farmers and households in India make every raindrop count</span>
          <span>1 mm of rain on 1 m² = 1 litre</span>
        </div>

      </div>

      {/* Start Over button (Hidden when printing) */}
      <div className="flex items-center justify-center pt-2 print:hidden">
        <button
          type="button"
          onClick={onStartOver}
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white underline cursor-pointer"
        >
          Reset and Start with a New Building
        </button>
      </div>

    </div>
  );
};
