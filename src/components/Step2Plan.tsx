import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Info,
  Plus,
  Trash2,
  Container,
  Layers
} from 'lucide-react';
import { CalculatorInputs, CalculationResult, StorageTankItem } from '../types';
import { COMMON_TANK_SIZES, normalizeTanks, getTotalTankCapacity } from '../utils/calculations';
import { useAppSettings } from '../context/AppSettingsContext';
import { litersToGallons, gallonsToLiters } from '../utils/units';
import { SavedVsWastedSection } from './SavedVsWastedSection';
import { StepperNumberInput } from './StepperNumberInput';

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

  // Normalize tanks for robust handling
  const { tanks, noTankYet } = normalizeTanks(inputs.tanks, inputs.tankCapacity, inputs.noTankYet);
  const tankCapacityInfo = getTotalTankCapacity(tanks, noTankYet, plan?.tankAdequacy.recommendedSize || 2000, unit);

  const handleHouseholdChange = (valStr: string) => {
    onChange({
      ...inputs,
      householdSize: valStr,
    });
  };

  const handleToggleNoTank = (checked: boolean) => {
    onChange({
      ...inputs,
      noTankYet: checked,
    });
  };

  const handleAddTank = () => {
    if (tanks.length >= 10) return;
    const nextIdx = tanks.length + 1;
    const newTank: StorageTankItem = {
      id: `tank_${Date.now()}_${nextIdx}`,
      name: `Tank ${nextIdx}`,
      capacity: isImperial ? '250' : '1000',
    };
    onChange({
      ...inputs,
      noTankYet: false,
      tanks: [...tanks, newTank],
    });
  };

  const handleUpdateTank = (id: string, updates: Partial<StorageTankItem>) => {
    const updated = tanks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    onChange({
      ...inputs,
      tanks: updated,
    });
  };

  const handleRemoveTank = (id: string) => {
    if (tanks.length <= 1) return;
    const updated = tanks.filter((t) => t.id !== id);
    onChange({
      ...inputs,
      tanks: updated,
    });
  };

  const handleQuickTankSelect = (tankId: string, litres: number) => {
    const val = isImperial ? Math.round(litersToGallons(litres)).toString() : litres.toString();
    handleUpdateTank(tankId, { capacity: val });
  };

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#24354c]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#0a2528] text-teal-300 font-bold text-xs uppercase tracking-wider mb-1.5 border border-teal-700/80">
            <span>Step 2 of 3</span>
            <span>•</span>
            <span>PLAN WATER USE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit',sans-serif] text-white tracking-tight">
            What should I do with this water?
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Plan your non-drinking household chores, evaluate your tank size, and calculate your money savings.
          </p>
        </div>

        <button
          type="button"
          id="step2-open-assumptions-btn"
          onClick={onOpenAssumptions}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#2a3b55] bg-[#182438] hover:bg-[#20304a] text-xs font-semibold text-slate-200 shadow-sm self-start cursor-pointer min-h-[44px] transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-teal-400" />
          <span>Edit Demands / Tariff</span>
        </button>
      </div>

      {/* Notice if Location is not yet selected */}
      {!result.hasLocation && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#291a06] border border-amber-700 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" role="img" aria-label="pin">📍</span>
            <span className="font-semibold text-amber-200">
              Please choose your location above to load 3-year rainfall data for realistic tank sizing and savings.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('location-section-container');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 font-bold text-xs text-white transition cursor-pointer min-h-[40px] shrink-0"
          >
            Choose Location
          </button>
        </div>
      )}

      {/* INPUTS ROW: Household Size & Multiple Storage Tanks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Household Size Stepper */}
        <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-md space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Household Size
              </span>
              <span className="text-xs font-semibold text-teal-300">
                ~60 L non-drinking / person
              </span>
            </div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-lg text-white">
              How many people live here?
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Used to calculate chore coverage and recommended storage buffer.
            </p>
          </div>

          <div className="py-2">
            <StepperNumberInput
              id="step2-household-input"
              label="Residents"
              unit="people"
              value={inputs.householdSize || '4'}
              onChange={handleHouseholdChange}
              step={1}
              min={1}
              max={100}
              placeholder="4"
              inputMode="numeric"
              helperText={`Total non-drinking requirement: ~${plan?.dailyDemandTotalL || 240} L/day`}
              icon="👥"
            />
          </div>
        </div>

        {/* Multiple Storage Tanks List (Requirement 3) */}
        <div className="lg:col-span-7 p-5 sm:p-6 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#24354c]">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛢️</span>
              <div>
                <h3 className="font-['Outfit',sans-serif] font-bold text-lg text-white">
                  Storage Tanks ({noTankYet ? '0' : tanks.length})
                </h3>
                <p className="text-xs text-slate-300">
                  Add up to 10 linked tanks. Tanks fill in order (Tank 1 first).
                </p>
              </div>
            </div>

            {/* "No tank yet" Toggle */}
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e1626] hover:bg-[#182438] border border-[#24354c] text-xs font-bold text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                id="step2-no-tank-yet-toggle"
                checked={noTankYet}
                onChange={(e) => handleToggleNoTank(e.target.checked)}
                className="w-4 h-4 text-teal-500 rounded border-slate-600 focus:ring-teal-400 cursor-pointer"
              />
              <span>No tank yet</span>
            </label>
          </div>

          {noTankYet ? (
            <div className="p-5 rounded-2xl bg-[#0a2528] border border-teal-700/80 text-center space-y-2.5">
              <span className="text-2xl block">💡</span>
              <span className="text-sm font-bold text-white block">
                No storage tank yet?
              </span>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                RainWise recommends a <strong className="text-teal-300 font-bold">{formatVolumeFull(plan?.tankAdequacy.recommendedSize || 2000)}</strong> tank based on your roof area and local rainfall.
              </p>
              <button
                type="button"
                onClick={() => handleToggleNoTank(false)}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition cursor-pointer min-h-[40px]"
              >
                Configure my own storage tanks
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tanks Cards */}
              <div className="space-y-3">
                {tanks.map((tank, idx) => (
                  <div
                    key={tank.id}
                    id={`tank-card-${tank.id}`}
                    className="p-4 rounded-2xl bg-[#182438] border border-[#26374f] space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xl shrink-0">🛢️</span>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            maxLength={35}
                            value={tank.name}
                            onChange={(e) => handleUpdateTank(tank.id, { name: e.target.value })}
                            placeholder={`Tank ${idx + 1}`}
                            className="font-['Outfit',sans-serif] font-bold text-base text-white bg-transparent border-b-2 border-dashed border-teal-500/70 hover:border-teal-400 focus:border-teal-300 focus:outline-none px-1 py-0.5 max-w-xs transition-colors"
                            aria-label="Tank name"
                          />
                          <span className="ml-2 text-xs text-slate-400 select-none">✏️</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveTank(tank.id)}
                        disabled={tanks.length <= 1}
                        title={tanks.length <= 1 ? 'Cannot remove the last remaining tank' : 'Remove this tank'}
                        aria-label={`Remove ${tank.name}`}
                        className={`p-2 rounded-xl transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                          tanks.length <= 1
                            ? 'text-slate-600 cursor-not-allowed'
                            : 'text-rose-400 hover:text-rose-200 hover:bg-[#2d1218]'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <StepperNumberInput
                      id={`tank-cap-${tank.id}`}
                      label="Capacity"
                      unit={isImperial ? 'gal' : 'litres'}
                      value={tank.capacity}
                      onChange={(val) => handleUpdateTank(tank.id, { capacity: val })}
                      step={(curr) => (curr >= 5000 ? 500 : 100)}
                      min={50}
                      max={500000}
                      placeholder={isImperial ? '250' : '1000'}
                      inputMode="numeric"
                      compact
                      quickChips={COMMON_TANK_SIZES.map((size) => ({
                        label: isImperial ? `${Math.round(litersToGallons(size))}g` : `${size}L`,
                        value: isImperial ? Math.round(litersToGallons(size)).toString() : size.toString(),
                      }))}
                    />
                  </div>
                ))}
              </div>

              {/* ➕ Add Another Tank Button */}
              <div>
                {tanks.length < 10 ? (
                  <button
                    type="button"
                    id="step2-add-tank-btn"
                    onClick={handleAddTank}
                    className="w-full py-3.5 rounded-2xl border-2 border-dashed border-teal-500/70 hover:border-teal-400 text-teal-300 hover:bg-[#182438] text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                  >
                    <Plus className="w-4 h-4 text-teal-400" />
                    <span>➕ Add another tank (e.g. Garden Tank, Overflow Cistern)</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-[#182438] text-slate-300 text-xs font-semibold text-center border border-[#24354c]">
                    Maximum 10 storage tanks reached.
                  </div>
                )}
              </div>

              {/* Total Storage Summary */}
              <div className="pt-2 border-t border-[#24354c] space-y-1">
                <div className="p-3 rounded-xl bg-[#0a2528] border border-teal-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-white">
                      Total storage: <strong className="text-teal-300 font-mono font-black">{formatVolumeFull(tankCapacityInfo.totalLitres)}</strong> across {tanks.length} {tanks.length === 1 ? 'tank' : 'tanks'}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 pl-1 leading-relaxed">
                  ℹ️ Tanks fill in order: Tank 1 fills first, then overflows into Tank 2, etc. If the last tank fills, the rest overflows.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* SECTION A: SMART WATER-USE PLANNER */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#24354c]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🚿</span>
              <h3 className="font-['Outfit',sans-serif] font-bold text-lg sm:text-xl text-white">
                A) Smart Water-Use Planner
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              How many days your {formatVolumeFull(result.harvestableWater)} of collected rain can power each chore:
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#06281e] border border-emerald-700/80 text-emerald-300 text-xs font-bold self-start sm:self-auto">
            <span>🏡 All chores combined:</span>
            <span className="text-sm font-extrabold text-white">{plan?.daysSupportedAllTasks} days</span>
          </div>
        </div>

        {/* 4 Chores Cards / Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {plan?.waterUses.map((item) => {
            const barWidth = Math.min(100, Math.max(12, Math.round((item.daysSupported / 365) * 100)));
            return (
              <div
                key={item.task}
                className="p-4 rounded-2xl bg-[#182438] border border-[#26374f] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#0e1626] text-slate-200 border border-[#24354c]">
                      {item.dailyLiters} L / day
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mt-2">
                    {item.task}
                  </h4>
                  <div className="text-2xl font-black font-['Outfit',sans-serif] text-teal-300 mt-1">
                    {item.daysSupported.toLocaleString()}{' '}
                    <span className="text-xs font-bold text-slate-400">days</span>
                  </div>
                </div>

                <div>
                  <div className="w-full h-2 rounded-full bg-[#0e1626] overflow-hidden mb-1.5 border border-[#24354c]">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-300 leading-tight">
                    {item.friendlyText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION B: "IS MY TANK BIG ENOUGH?" */}
      <div className={`p-5 sm:p-6 rounded-3xl border shadow-md ${
        plan?.tankAdequacy.status === 'overflow'
          ? 'bg-[#291a06] border-amber-700/80'
          : plan?.tankAdequacy.status === 'large'
          ? 'bg-[#221533] border-purple-700/80'
          : 'bg-[#06281e] border-emerald-700/80'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="text-3xl shrink-0">
              {plan?.tankAdequacy.status === 'overflow' ? '⚠️' : plan?.tankAdequacy.status === 'large' ? '🔻' : '✅'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Outfit',sans-serif] font-bold text-lg sm:text-xl text-white">
                  B) Is my tank big enough?
                </h3>
                <span className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                  plan?.tankAdequacy.status === 'overflow'
                    ? 'bg-amber-800 text-amber-200'
                    : plan?.tankAdequacy.status === 'large'
                    ? 'bg-purple-800 text-purple-200'
                    : 'bg-emerald-800 text-emerald-200'
                }`}>
                  {plan?.tankAdequacy.statusLabel}
                </span>
              </div>

              <p className="text-sm sm:text-base font-bold text-white mt-1">
                {plan?.tankAdequacy.message}
              </p>
              
              <p className="text-xs sm:text-sm text-slate-200 mt-1">
                {plan?.tankAdequacy.overflowWastedNotice}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#182438] border border-[#26374f] shadow-sm self-start sm:min-w-[190px] shrink-0 text-center">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
              Recommended Tank Size
            </span>
            <span className="text-2xl font-black font-['Outfit',sans-serif] text-teal-300 block mt-0.5">
              {formatVolumeFull(plan?.tankAdequacy.recommendedSize || 2000)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
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
      <div className="p-5 sm:p-6 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-md space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#24354c]">
          <span className="text-xl">💰</span>
          <div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-lg sm:text-xl text-white">
              C) Impact &amp; Money Savings Estimate
            </h3>
            <p className="text-xs text-slate-300">
              Replacing paid municipal water, tanker deliveries, or borewell pump electricity
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          
          {/* Card 1: Water Reused */}
          <div className="p-4 rounded-2xl bg-[#0a2528] border border-teal-700/80">
            <span className="text-xs font-semibold text-teal-300 block">
              💧 Fresh Water Replaced
            </span>
            <div className="text-2xl font-black font-['Outfit',sans-serif] text-white mt-1">
              {formatVolumeFull(plan?.economicImpact.waterReusedPerYearL || 0)}
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Per year, saving precious municipal or groundwater resources.
            </p>
          </div>

          {/* Card 2: Yearly Bill Savings */}
          <div className="p-4 rounded-2xl bg-[#06281e] border border-emerald-700/80">
            <span className="text-xs font-semibold text-emerald-300 block">
              💵 Estimated Yearly Savings
            </span>
            <div className="text-2xl font-black font-['Outfit',sans-serif] text-white mt-1">
              ₹{(plan?.economicImpact.yearlyBillSavingsRs || 0).toLocaleString()} / yr
            </div>
            <p className="text-xs text-slate-300 mt-1">
              At ₹{inputs.waterTariff || '15'} per 1,000 litres water tariff.
            </p>
          </div>

          {/* Card 3: Approx Cost & Payback */}
          <div className="p-4 rounded-2xl bg-[#182438] border border-[#26374f]">
            <span className="text-xs font-semibold text-slate-300 block">
              ⏱️ Payback Period
            </span>
            <div className="text-2xl font-black font-['Outfit',sans-serif] text-white mt-1">
              {plan?.economicImpact.paybackPeriodYears 
                ? `${plan.economicImpact.paybackPeriodYears} years` 
                : 'Rapid'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              For ~₹{(plan?.economicImpact.approxInstallationCostRs || 15000).toLocaleString()} initial setup cost.
            </p>
          </div>

        </div>

        {/* Clear Disclaimer as requested */}
        <div className="p-3.5 rounded-2xl bg-[#0e1626] border border-[#24354c] text-slate-300 text-xs flex items-center gap-2">
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
          className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-200 bg-[#182438] hover:bg-[#20304a] border border-[#2a3b55] rounded-2xl transition cursor-pointer min-h-[48px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Calculate</span>
        </button>

        <button
          type="button"
          id="step2-next-step-btn"
          onClick={onNext}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 text-base font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-2xl shadow-lg transition cursor-pointer min-h-[50px]"
        >
          <span>Continue to Step 3: Simulate &quot;What if...?&quot;</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
