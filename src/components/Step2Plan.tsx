import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowRight, 
  ArrowLeft, 
  Users, 
  Droplets, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowDownCircle, 
  IndianRupee, 
  ShieldCheck, 
  Sliders, 
  Clock, 
  TrendingUp,
  Sparkles,
  Info
} from 'lucide-react';
import { CalculatorInputs, CalculationResult } from '../types';
import { COMMON_TANK_SIZES } from '../utils/calculations';
import { useAppSettings } from '../context/AppSettingsContext';
import { litersToGallons, gallonsToLiters } from '../utils/units';
import { SavedVsWastedSection } from './SavedVsWastedSection';

interface Step2PlanProps {
  inputs: CalculatorInputs;
  result: CalculationResult;
  onChange: (newInputs: CalculatorInputs) => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenAssumptions: () => void;
}

export const Step2Plan: React.FC<Step2PlanProps> = ({
  inputs,
  result,
  onChange,
  onPrev,
  onNext,
  onOpenAssumptions,
}) => {
  const { unit, formatVolume, formatVolumeFull } = useAppSettings();
  const isImperial = unit === 'imperial';

  const plan = result.householdPlan;
  const householdSize = parseInt(inputs.householdSize || '4', 10);

  const handleHouseholdChange = (count: number) => {
    const val = Math.max(1, Math.min(25, count));
    onChange({
      ...inputs,
      householdSize: String(val),
    });
  };

  const handleTankChange = (litresOrGallons: string) => {
    onChange({
      ...inputs,
      tankCapacity: litresOrGallons,
    });
  };

  const handleQuickTankSelect = (litres: number) => {
    const val = isImperial ? Math.round(litersToGallons(litres)).toString() : litres.toString();
    handleTankChange(val);
  };

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-xs uppercase tracking-wider mb-1.5 border border-teal-200 dark:border-teal-800">
            <span>Step 2 of 3</span>
            <span>•</span>
            <span>PLAN WATER USE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit',sans-serif] text-slate-900 dark:text-white tracking-tight">
            What should I do with this water?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Plan your non-drinking household chores, evaluate your tank size, and calculate your money savings.
          </p>
        </div>

        <button
          type="button"
          id="step2-open-assumptions-btn"
          onClick={onOpenAssumptions}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs self-start cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Edit Demands / Tariff</span>
        </button>
      </div>

      {/* Notice if Location is not yet selected */}
      {!result.hasLocation && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" role="img" aria-label="pin">📍</span>
            <span className="font-semibold">
              Please choose your location above to load 3-year rainfall data for realistic tank sizing and savings.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('location-section-container');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-amber-200 hover:bg-amber-300 dark:bg-amber-900 font-bold text-xs text-amber-950 dark:text-amber-100 transition cursor-pointer min-h-[40px] shrink-0"
          >
            Choose Location
          </button>
        </div>
      )}

      {/* INPUTS ROW: Household Size & Optional Tank Size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Household Size Stepper */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Household Size
              </span>
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                ~60 L non-drinking / person
              </span>
            </div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-lg text-slate-900 dark:text-white">
              How many people live here?
            </h3>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              id="step2-household-minus"
              onClick={() => handleHouseholdChange(householdSize - 1)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 shadow-2xs transition cursor-pointer"
            >
              -
            </button>

            <div className="text-center">
              <span className="text-2xl font-black font-['Outfit',sans-serif] text-slate-900 dark:text-white block">
                {householdSize}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {householdSize === 1 ? 'person' : 'people'} ({plan?.dailyDemandTotalL} L/day total)
              </span>
            </div>

            <button
              type="button"
              id="step2-household-plus"
              onClick={() => handleHouseholdChange(householdSize + 1)}
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-600 shadow-2xs transition cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Tank Size Input (Optional) with Quick Common Indian Tank Sizes */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Tank Storage (Optional)
              </span>
              {inputs.tankCapacity ? (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Entered
                </span>
              ) : (
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">
                  Suggested: {formatVolume(plan?.tankAdequacy.recommendedSize || 2000)}
                </span>
              )}
            </div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-lg text-slate-900 dark:text-white">
              Do you already have a tank?
            </h3>
          </div>

          <div className="mt-3 space-y-2">
            <div className="relative">
              <input
                type="number"
                id="step2-tank-input"
                min="0"
                step="100"
                value={inputs.tankCapacity}
                onChange={(e) => handleTankChange(e.target.value)}
                placeholder={`Leave blank to recommend (${formatVolume(plan?.tankAdequacy.recommendedSize || 2000)})`}
                className="w-full text-base sm:text-lg font-bold font-['Outfit',sans-serif] px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                {isImperial ? 'gallons' : 'litres'}
              </span>
            </div>

            {/* Quick Pick Pills for Common Tank Sizes */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Picks:</span>
              {COMMON_TANK_SIZES.map((size) => {
                const label = isImperial ? `${Math.round(litersToGallons(size))}g` : `${size}L`;
                const isSelected = inputs.tankCapacity === (isImperial ? Math.round(litersToGallons(size)).toString() : size.toString());
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleQuickTankSelect(size)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              {inputs.tankCapacity && (
                <button
                  type="button"
                  onClick={() => handleTankChange('')}
                  className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-auto cursor-pointer"
                >
                  Clear (use suggested)
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* SECTION A: SMART WATER-USE PLANNER */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🚿</span>
              <h3 className="font-['Outfit',sans-serif] font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                A) Smart Water-Use Planner
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              How many days your {formatVolumeFull(result.harvestableWater)} of collected rain can power each chore:
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs font-bold self-start sm:self-auto">
            <span>🏡 All chores combined:</span>
            <span className="text-sm">{plan?.daysSupportedAllTasks} days</span>
          </div>
        </div>

        {/* 4 Chores Cards / Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {plan?.waterUses.map((item) => {
            const barWidth = Math.min(100, Math.max(12, Math.round((item.daysSupported / 365) * 100)));
            return (
              <div
                key={item.task}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {item.dailyLiters} L / day
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                    {item.task}
                  </h4>
                  <div className="text-2xl font-black font-['Outfit',sans-serif] text-teal-800 dark:text-teal-300 mt-1">
                    {item.daysSupported.toLocaleString()}{' '}
                    <span className="text-xs font-bold text-slate-500">days</span>
                  </div>
                </div>

                <div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                    {item.friendlyText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION B: "IS MY TANK BIG ENOUGH?" */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs ${
        plan?.tankAdequacy.status === 'overflow'
          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
          : plan?.tankAdequacy.status === 'large'
          ? 'bg-purple-50/70 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800'
          : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="text-3xl shrink-0">
              {plan?.tankAdequacy.status === 'overflow' ? '⚠️' : plan?.tankAdequacy.status === 'large' ? '🔻' : '✅'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Outfit',sans-serif] font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
                  B) Is my tank big enough?
                </h3>
                <span className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  plan?.tankAdequacy.status === 'overflow'
                    ? 'bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200'
                    : plan?.tankAdequacy.status === 'large'
                    ? 'bg-purple-200 dark:bg-purple-900 text-purple-950 dark:text-purple-200'
                    : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-200'
                }`}>
                  {plan?.tankAdequacy.statusLabel}
                </span>
              </div>

              <p className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-100 mt-1">
                {plan?.tankAdequacy.message}
              </p>
              
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                {plan?.tankAdequacy.overflowWastedNotice}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs self-start sm:min-w-[190px] shrink-0 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Recommended Tank Size
            </span>
            <span className="text-2xl font-black font-['Outfit',sans-serif] text-teal-800 dark:text-teal-300 block mt-0.5">
              {formatVolumeFull(plan?.tankAdequacy.recommendedSize || 2000)}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Based on 15 dry days buffer
            </span>
          </div>
        </div>
      </div>

      {/* SAVED VS WASTED VISUAL ANALYSIS & EVERYDAY CONVERSIONS */}
      <SavedVsWastedSection
        result={result}
        inputs={inputs}
        onOpenAssumptions={onOpenAssumptions}
        onGoToRoofInput={onPrev}
        onGoToLocation={() => {
          const el = document.getElementById('location-section-container');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* SECTION C: IMPACT & SAVINGS ESTIMATE */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xl">💰</span>
          <div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
              C) Impact &amp; Money Savings Estimate
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Replacing paid municipal water, tanker deliveries, or borewell pump electricity
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          {/* Card 1: Water Reused */}
          <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
            <span className="text-xs font-semibold text-teal-800 dark:text-teal-300 block">
              💧 Fresh Water Replaced
            </span>
            <div className="text-2xl font-black font-['Outfit',sans-serif] text-teal-900 dark:text-teal-100 mt-1">
              {formatVolumeFull(plan?.economicImpact.waterReusedPerYearL || 0)}
            </div>
            <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-1">
              Per year, saving precious municipal or groundwater resources.
            </p>
          </div>

          {/* Card 2: Yearly Bill Savings */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
              💵 Estimated Yearly Savings
            </span>
            <div className="text-2xl font-black font-['Outfit',sans-serif] text-emerald-900 dark:text-emerald-100 mt-1">
              ₹{(plan?.economicImpact.yearlyBillSavingsRs || 0).toLocaleString()} / yr
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
              At ₹{inputs.waterTariff || '15'} per 1,000 litres water tariff.
            </p>
          </div>

          {/* Card 3: Approx Cost & Payback */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              ⏱️ Payback Period
            </span>
            <div className="text-2xl font-black font-['Outfit',sans-serif] text-slate-900 dark:text-white mt-1">
              {plan?.economicImpact.paybackPeriodYears 
                ? `${plan.economicImpact.paybackPeriodYears} years` 
                : 'Rapid'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              For ~₹{(plan?.economicImpact.approxInstallationCostRs || 15000).toLocaleString()} initial setup cost.
            </p>
          </div>

        </div>

        {/* Clear Disclaimer as requested */}
        <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="italic">
            * {plan?.economicImpact.disclaimer} Tanker prices and municipal rates vary across India.
          </span>
        </div>

      </div>

      {/* Navigation Buttons: Back & Next */}
      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          id="step2-prev-step-btn"
          onClick={onPrev}
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl transition cursor-pointer min-h-[48px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Calculate</span>
        </button>

        <button
          type="button"
          id="step2-next-step-btn"
          onClick={onNext}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 text-base font-bold text-white bg-teal-800 hover:bg-teal-900 active:bg-teal-950 rounded-2xl shadow-lg shadow-teal-900/20 hover:-translate-y-0.5 active:translate-y-0 transition cursor-pointer min-h-[50px]"
        >
          <span>Continue to Step 3: Simulate &quot;What if...?&quot;</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
