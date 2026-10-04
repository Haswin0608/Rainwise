import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  ArrowLeft, 
  Sliders, 
  Sparkles, 
  Droplet, 
  ShieldCheck, 
  AlertTriangle, 
  Calendar, 
  Check, 
  Info,
  Scale,
  RefreshCw,
  FileText,
  Share2,
  Building2,
  ChevronDown,
  X
} from 'lucide-react';
import { 
  GeneratedBuildingPlan, 
  BuildingPlannerAnswers, 
  BuildingTypeKey,
  FullWeatherData,
  HistoricalRainfallData,
  PlanningAssumptions,
  CalculationResult
} from '../types';
import { BUILDING_PROFILES } from '../data/buildingProfiles';
import { buildBuildingPlan, calcBuildingDemand, calcStorageRange, calcCoverage } from '../utils/buildingPlanner';
import { calculateHarvesting, toBuckets, toHouseholdDays, DEFAULT_ASSUMPTIONS } from '../utils/calculations';
import { SavedVsWastedSection } from './SavedVsWastedSection';
import { useAppSettings } from '../context/AppSettingsContext';

interface BuildingPlanReportProps {
  plan: GeneratedBuildingPlan;
  answers: BuildingPlannerAnswers;
  weatherData: FullWeatherData | null;
  historicalData: HistoricalRainfallData | null;
  assumptions?: PlanningAssumptions;
  onEditAnswers: () => void;
  onOpenAssumptions?: () => void;
  onSwitchBuildingType: (newType: BuildingTypeKey) => void;
}

export const BuildingPlanReport: React.FC<BuildingPlanReportProps> = ({
  plan,
  answers,
  weatherData,
  historicalData,
  assumptions,
  onEditAnswers,
  onOpenAssumptions,
  onSwitchBuildingType,
}) => {
  const { formatArea, formatVolume, formatVolumeFull } = useAppSettings();

  // "Compare Building Types" comparison state
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [comparisonType, setComparisonType] = useState<BuildingTypeKey>(
    answers.buildingType === 'house' ? 'school' : 'house'
  );
  const [copied, setCopied] = useState(false);

  // Compute live comparison plan for the comparison building type with identical roof and location!
  const compareProfile = BUILDING_PROFILES[comparisonType];
  const compareDemand = calcBuildingDemand(
    compareProfile, 
    compareProfile.occupancyPrimaryDefault,
    compareProfile.secondaryDefault
  );
  const compareStorage = calcStorageRange(
    compareDemand.dailyDemandLitres, 
    compareProfile.storageMultiplierDays, 
    plan.annualCollectedLitres
  );
  const compareCoverage = calcCoverage(plan.annualCollectedLitres, compareDemand.annualDemandLitres);

  // Synthesize a CalculationResult for the SavedVsWastedSection
  const syntheticResult: CalculationResult = {
    hasLocation: Boolean(answers.locationName),
    locationName: answers.locationName,
    roofs: [{
      id: 'main',
      name: 'Main Roof',
      length: 0,
      width: 0,
      area: plan.roofAreaM2,
    }],
    roofArea: plan.roofAreaM2,
    roofType: answers.roofType,
    runoffCoefficient: plan.runoffCoefficient,
    weeklyRainfallMm: plan.weeklyRainfallMm,
    weeklyHarvestableWater: plan.weeklyHarvestLitres,
    annualRainfallMm: plan.annualRainfallMm,
    scaledAnnualRainfallMm: plan.annualRainfallMm,
    rainfallScenario: 'normal',
    scenarioMultiplier: 1.0,
    potentialWater: Math.round(plan.roofAreaM2 * plan.annualRainfallMm),
    harvestableWater: plan.annualCollectedLitres,
    waterLost: Math.round(plan.roofAreaM2 * plan.annualRainfallMm * (1 - plan.runoffCoefficient)),
    actuallyHarvested: plan.userTankLitres ? Math.min(plan.annualCollectedLitres, plan.userTankLitres) : plan.annualCollectedLitres,
    wastedWater: plan.userTankLitres ? Math.max(0, plan.annualCollectedLitres - plan.userTankLitres) : 0,
    tankCapacity: plan.userTankLitres || plan.recommendedStorageLitres,
    efficiency: Math.round(plan.runoffCoefficient * 100),
    storageUtilizationRate: 100,
    harvestEfficiencyRate: Math.round(plan.runoffCoefficient * 100),
    summarySentence: plan.headlineText,
    suggestionLine: plan.tankVerdictMessage,
    savedComparison: { primaryText: `${plan.headlineBuckets} buckets saved`, icon: '🪣' },
    wastedComparison: { primaryText: 'Zero loss with adequate tank', icon: '💧' },
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `RainWise Plan for ${plan.buildingProfile.name} (${answers.locationName || 'India'}):
• Annual Rainwater Harvest: ${plan.annualCollectedLitres.toLocaleString()} L (~${plan.headlineBuckets.toLocaleString()} buckets)
• Roof Catchment: ${formatArea(plan.roofAreaM2)} (${plan.roofTypeLabel})
• Daily Demand: ${plan.dailyDemandLitres.toLocaleString()} L/day (${plan.coveragePercentage}% covered by rain)
• Recommended Storage Tank: ${plan.recommendedStorageLitres.toLocaleString()} L
• Estimated Yearly Savings: ₹${plan.yearlyBillSavingsRs.toLocaleString()}/yr
• Status: ${plan.tankVerdictLabel}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-7 print:p-0 print:m-0 print:max-w-none">
      
      {/* ═══════════════════════════════════════════════════════════════
          TOP ACTION BAR (Print, Edit, Compare, Share)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          id="plan-edit-answers-btn"
          onClick={onEditAnswers}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold shadow-2xs transition cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit my answers</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Compare with another building type */}
          <button
            type="button"
            id="plan-compare-btn"
            onClick={() => setShowCompareModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs sm:text-sm font-bold shadow-2xs transition cursor-pointer min-h-[44px]"
          >
            <Scale className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <span>Compare with another building type</span>
          </button>

          {/* Copy Text Summary */}
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold shadow-2xs transition cursor-pointer min-h-[44px]"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>

          {/* Download / Print as PDF */}
          <button
            type="button"
            id="plan-print-btn"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>Download / Print as PDF</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          REPORT MAIN CONTAINER (Print-ready)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="p-6 sm:p-9 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-8 print:border-none print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-3xl shrink-0 shadow-2xs">
              {plan.buildingProfile.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                  {plan.buildingStatus === 'new' ? '🆕 New Building Plan' : '🏗️ Existing Retrofit Plan'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  📍 {answers.locationName || 'Local Forecast Area'}
                </span>
              </div>
              <h1 className="font-['Outfit',sans-serif] font-black text-2xl sm:text-3xl text-slate-900 dark:text-white mt-1">
                Your RainWise Plan for your {plan.buildingProfile.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Designed for {plan.occupancySummaryText} • {formatArea(plan.roofAreaM2)} {plan.roofTypeLabel} roof
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400">
            <span className="block font-bold text-slate-900 dark:text-white">RainWise Planning Engine</span>
            <span>Based on Open-Meteo local rainfall</span>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            1. HEADLINE (Prompt Requirement)
            ═════════════════════════════════════════════════════════════ */}
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-teal-50 via-emerald-50/50 to-white dark:from-teal-950/40 dark:via-slate-850 dark:to-slate-900 border-2 border-teal-600/30 dark:border-teal-700/50 shadow-xs space-y-2">
          <div className="text-[11px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
            1. Total Annual Rainwater Potential
          </div>
          <h2 className="font-['Outfit',sans-serif] font-black text-2xl sm:text-3xl text-slate-900 dark:text-white leading-tight">
            {plan.headlineText}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            That&apos;s about <strong>{toHouseholdDays(plan.annualCollectedLitres, 4, 60)} days</strong> of non-drinking water needs captured right off your rooftop.
          </p>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            2. RAINWATER COLLECTED PER YEAR AND PER MONTH
            ═════════════════════════════════════════════════════════════ */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                2. Rainfall Harvest Distribution
              </span>
              <h3 className="font-['Outfit',sans-serif] font-bold text-lg text-slate-900 dark:text-white">
                Real 3-Year Rainfall: {plan.annualRainfallMm} mm average
              </h3>
            </div>
            <span className="text-xs text-slate-600 dark:text-slate-300 font-mono">
              = {formatArea(plan.roofAreaM2)} × {plan.annualRainfallMm} mm × {plan.runoffCoefficient} runoff
            </span>
          </div>

          {/* 12-Month Mini Bar Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 text-center">
            {plan.monthlyCollectedLitres.map((litres, i) => {
              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              const maxL = Math.max(1, ...plan.monthlyCollectedLitres);
              const heightPct = Math.round((litres / maxL) * 100);
              return (
                <div key={months[i]} className="flex flex-col items-center">
                  <div className="w-full h-16 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-end p-1">
                    <div 
                      className="w-full bg-teal-600 dark:bg-teal-500 rounded-md transition-all"
                      style={{ height: `${Math.max(8, heightPct)}%` }}
                      title={`${months[i]}: ${litres.toLocaleString()} L`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-1">{months[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            3. WATER DEMAND & HOW MUCH RAIN CAN COVER (% progress bar)
            ═════════════════════════════════════════════════════════════ */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
                3. Building Water Demand
              </span>
              <h3 className="font-['Outfit',sans-serif] font-bold text-xl text-slate-900 dark:text-white">
                Daily Non-Drinking Requirement: {plan.dailyDemandLitres.toLocaleString()} L / day
              </h3>
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Annual Demand: <strong>{plan.annualDemandLitres.toLocaleString()} L</strong> ({plan.workingDaysPerYear} operating days)
            </div>
          </div>

          {/* Coverage Bar (Capped at 100%) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
              <span className="text-slate-800 dark:text-slate-200">
                How much of this demand rain can cover:
              </span>
              <span className="text-teal-800 dark:text-teal-300 font-['Outfit',sans-serif] text-base font-black">
                {plan.coveragePercentage}% of demand covered
              </span>
            </div>

            <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div 
                className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(6, plan.coveragePercentage)}%` }}
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              {plan.coveragePercentage >= 100 
                ? '🎉 Excellent! Rain supplies 100% of your non-drinking chores, with surplus for groundwater recharge.'
                : `Rainwater will supply approximately ${plan.coveragePercentage}% of non-drinking demand. The remainder is met by municipal or borewell supply.`}
            </p>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            4. SUGGESTED STORAGE: MINIMUM / RECOMMENDED / LARGE & VERDICT
            ═════════════════════════════════════════════════════════════ */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
                4. Tank Sizing Recommendation
              </span>
              <h3 className="font-['Outfit',sans-serif] font-bold text-xl text-slate-900 dark:text-white">
                Suggested Storage Tank Sizing Range
              </h3>
            </div>

            {/* Verdict Badge */}
            <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
              plan.tankVerdict === 'good'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-300'
                : plan.tankVerdict === 'overflow'
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300'
                : 'bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-300 border border-teal-300'
            }`}>
              {plan.tankVerdictLabel}
            </span>
          </div>

          {/* 3 Size Cards: Minimum / Recommended / Large */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Minimum */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Minimum Buffer
              </span>
              <div className="font-['Outfit',sans-serif] font-black text-2xl text-slate-800 dark:text-slate-200 mt-1">
                {formatVolumeFull(plan.minStorageLitres)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {plan.buildingProfile.storageMultiplierDays.min} days dry spell
              </span>
            </div>

            {/* Recommended */}
            <div className="p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/60 border-2 border-teal-600 dark:border-teal-500 text-center shadow-xs">
              <span className="text-[11px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 block">
                ⭐ Recommended Size
              </span>
              <div className="font-['Outfit',sans-serif] font-black text-2xl text-teal-950 dark:text-teal-100 mt-1">
                {formatVolumeFull(plan.recommendedStorageLitres)}
              </div>
              <span className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5 block font-bold">
                {plan.buildingProfile.storageMultiplierDays.ideal} days dry buffer (Ideal balance)
              </span>
            </div>

            {/* Large */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Extended Storage
              </span>
              <div className="font-['Outfit',sans-serif] font-black text-2xl text-slate-800 dark:text-slate-200 mt-1">
                {formatVolumeFull(plan.largeStorageLitres)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Captures heavy cloudbursts
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {plan.tankVerdictMessage}
          </p>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            5. SAVED VS WASTED VISUAL ANALYSIS (Donut, Tank Graphic, Bar Chart)
            ═════════════════════════════════════════════════════════════ */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚖️</span>
            <h3 className="font-['Outfit',sans-serif] font-black text-xl text-slate-900 dark:text-white">
              5. Saved vs Wasted Graphical Analysis
            </h3>
          </div>
          <SavedVsWastedSection
            result={syntheticResult}
            inputs={{
              roofAreaMode: 'direct',
              directRoofArea: String(plan.roofAreaM2),
              roofs: [
                {
                  id: 'planner-report-roof-1',
                  name: `${answers.buildingType === 'house' ? 'Main House' : 'Main'} Roof`,
                  area: String(plan.roofAreaM2),
                  areaUnit: 'metric',
                  typeKey: answers.roofType,
                },
              ],
              tanks: plan.userTankLitres
                ? [
                    {
                      id: 'planner-tank-1',
                      name: 'Storage Tank 1',
                      capacity: String(plan.userTankLitres),
                    },
                  ]
                : [
                    {
                      id: 'planner-tank-1',
                      name: 'Recommended Tank',
                      capacity: String(plan.recommendedStorageLitres),
                    },
                  ],
              noTankYet: !plan.userTankLitres,
              roofType: answers.roofType,
              householdSize: String(answers.primaryOccupancy),
              tankCapacity: String(plan.userTankLitres || plan.recommendedStorageLitres),
              dailyRequirement: String(plan.dailyDemandLitres),
              efficiency: String(Math.round(plan.runoffCoefficient * 100)),
              waterTariff: '15',
              installationCost: '15000',
              locationName: answers.locationName,
              weeklyRainfallMm: plan.weeklyRainfallMm,
              typicalAnnualRainfallMm: plan.annualRainfallMm,
              assumptions,
            }}
            onOpenAssumptions={onOpenAssumptions}
          />
        </div>

        {/* ═════════════════════════════════════════════════════════════
            6. POSSIBLE USES (Cards with icons, litres & buckets)
            ═════════════════════════════════════════════════════════════ */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
              6. What This Harvest Powers
            </span>
            <h3 className="font-['Outfit',sans-serif] font-bold text-xl text-slate-900 dark:text-white">
              Estimated Non-Drinking Allocation
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {plan.usesBreakdown.map((item) => (
              <div
                key={item.task}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{item.icon}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                    {item.sharePercent}%
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {item.task}
                  </h4>
                  <div className="text-xl font-black font-['Outfit',sans-serif] text-teal-800 dark:text-teal-300 mt-1">
                    {formatVolume(item.litresPerYear)}
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    ≈ {item.bucketsPerYear.toLocaleString()} buckets / year
                  </span>
                </div>
              </div>
            ))}
          </div>

          {plan.buildingProfile.safetyNote && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 font-semibold flex items-center gap-2">
              <span>{plan.buildingProfile.safetyNote}</span>
            </div>
          )}
        </div>

        {/* ═════════════════════════════════════════════════════════════
            7. RECOMMENDED SYSTEM PARTS (Checklist with simple explanations)
            ═════════════════════════════════════════════════════════════ */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
              7. Hardware Architecture
            </span>
            <h3 className="font-['Outfit',sans-serif] font-bold text-xl text-slate-900 dark:text-white">
              Recommended System Components for your {plan.buildingProfile.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Every part serves a specific purpose to keep water clean and prevent flooding:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plan.systemParts.map((part) => (
              <div
                key={part.id}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 ${
                  part.isSpecialHighlight
                    ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-400 dark:border-teal-700 shadow-xs'
                    : 'bg-slate-50/80 dark:bg-slate-850 border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="text-2xl shrink-0">{part.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      {part.name}
                    </span>
                    {part.isSpecialHighlight && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-200 dark:bg-teal-900 text-teal-900 dark:text-teal-200">
                        Priority for {plan.buildingProfile.name}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                    {part.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            8. HEAVY-RAIN OVERFLOW PLANNING (7-Day Forecast Alert)
            ═════════════════════════════════════════════════════════════ */}
        <div className={`p-5 sm:p-6 rounded-3xl border shadow-xs space-y-2 ${
          plan.hasHeavyRainOverflowRisk
            ? 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800'
            : 'bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-700'
        }`}>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
            <span>🌧️</span>
            <span className={plan.hasHeavyRainOverflowRisk ? 'text-orange-900 dark:text-orange-300' : 'text-slate-600 dark:text-slate-400'}>
              8. Heavy-Rain &amp; Storm Overflow Planning
            </span>
          </div>
          <h4 className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-slate-900 dark:text-white">
            {plan.heavyRainNotice}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {plan.hasHeavyRainOverflowRisk
              ? 'Heavy monsoon rain can deliver several days worth of water in hours. Always equip your storage tank with a full-bore overflow pipe linked to a percolation well.'
              : 'Your storage reservoir has ample capacity to absorb this week\'s anticipated precipitation without spilling.'}
          </p>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            9. ROUGH IMPACT AND SAVINGS (Bill Savings, Cost, Payback)
            ═════════════════════════════════════════════════════════════ */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block">
              9. Economic Impact &amp; Payback
            </span>
            <h3 className="font-['Outfit',sans-serif] font-bold text-xl text-slate-900 dark:text-white">
              Estimated Money Savings &amp; Resource Preservation
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
              <span className="text-xs font-semibold text-teal-800 dark:text-teal-300 block">
                💧 Water Replaced
              </span>
              <div className="text-2xl font-black font-['Outfit',sans-serif] text-teal-950 dark:text-teal-100 mt-1">
                {formatVolumeFull(plan.yearlyWaterReusedLitres)}
              </div>
              <p className="text-[11px] text-teal-700 dark:text-teal-300 mt-1">
                Replaces paid municipal tanker or groundwater pumping every year.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
                💵 Estimated Bill Savings
              </span>
              <div className="text-2xl font-black font-['Outfit',sans-serif] text-emerald-950 dark:text-emerald-100 mt-1">
                ₹{plan.yearlyBillSavingsRs.toLocaleString()} / yr
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1">
                At ₹15 per 1,000 litres municipal / private tanker tariff.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                ⏱️ Payback Period
              </span>
              <div className="text-2xl font-black font-['Outfit',sans-serif] text-slate-900 dark:text-white mt-1">
                {plan.paybackYears ? `${plan.paybackYears} years` : 'Rapid'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                For approx ₹{plan.approxInstallationCostRs.toLocaleString()} setup cost.
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            * Approximate estimates, not guaranteed. Actual water tariffs and contractor costs vary across Indian states.
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            10. 3 TO 5 PRIORITY TIPS FOR THIS BUILDING TYPE
            ═════════════════════════════════════════════════════════════ */}
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              10. Top Practical Tips for {plan.buildingProfile.name}
            </h3>
          </div>

          <ul className="space-y-2">
            {plan.priorityTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ═════════════════════════════════════════════════════════════
            11. STATUTORY NOTE & DISCLAIMER
            ═════════════════════════════════════════════════════════════ */}
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200/60 dark:border-slate-700 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <span>
            <strong>11. Statutory Notice:</strong> {plan.statutoryNote}
          </span>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════
          4. "COMPARE BUILDING TYPES" SIDE-BY-SIDE MODAL / SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showCompareModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-teal-600" />
                  <div>
                    <h3 className="font-['Outfit',sans-serif] font-bold text-lg text-slate-900 dark:text-white">
                      Compare Building Types
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      See how the exact same roof ({formatArea(plan.roofAreaM2)}) gets different advice for different purposes.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCompareModal(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Select a building type to compare against:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(BUILDING_PROFILES).map((prof) => (
                      <button
                        key={prof.key}
                        type="button"
                        onClick={() => setComparisonType(prof.key)}
                        className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition cursor-pointer ${
                          comparisonType === prof.key
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>{prof.icon}</span>
                        <span className="truncate">{prof.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Side-by-Side Comparison Card */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
                  {/* Current Building Type */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{plan.buildingProfile.icon}</span>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Current</span>
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          {plan.buildingProfile.name}
                        </h4>
                      </div>
                    </div>
                    <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                      <div>Daily Demand: <strong>{plan.dailyDemandLitres.toLocaleString()} L</strong></div>
                      <div>Coverage by Rain: <strong className="text-teal-700 dark:text-teal-300">{plan.coveragePercentage}%</strong></div>
                      <div>Suggested Tank: <strong>{plan.recommendedStorageLitres.toLocaleString()} L</strong></div>
                      <div>Top Uses: {plan.buildingProfile.focusAreas.slice(0, 2).join(', ')}</div>
                    </div>
                  </div>

                  {/* Compared Building Type */}
                  <div className="space-y-3 border-l border-slate-200 dark:border-slate-700 pl-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{compareProfile.icon}</span>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-teal-600 block">Comparing with</span>
                        <h4 className="font-bold text-sm sm:text-base text-teal-900 dark:text-teal-200">
                          {compareProfile.name}
                        </h4>
                      </div>
                    </div>
                    <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                      <div>Daily Demand: <strong>{compareDemand.dailyDemandLitres.toLocaleString()} L</strong></div>
                      <div>Coverage by Rain: <strong className="text-teal-700 dark:text-teal-300">{compareCoverage}%</strong></div>
                      <div>Suggested Tank: <strong>{compareStorage.recommendedStorageLitres.toLocaleString()} L</strong></div>
                      <div>Top Uses: {compareProfile.focusAreas.slice(0, 2).join(', ')}</div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 leading-relaxed italic">
                  💡 The roof captures the same {plan.annualCollectedLitres.toLocaleString()} L of rain in both cases. However, demand and storage change dramatically based on how the building is used.
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowCompareModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSwitchBuildingType(comparisonType);
                    setShowCompareModal(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-xl shadow-md cursor-pointer"
                >
                  <span>Switch plan to {compareProfile.name}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
