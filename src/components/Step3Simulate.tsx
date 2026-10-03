import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  AlertTriangle, 
  CloudRain, 
  Droplet, 
  Waves, 
  RotateCcw,
  Sparkles,
  Layers,
  Users
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { CalculatorInputs, CalculationResult, RainfallScenario } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';
import { sqMetersToSqFeet, sqFeetToSqMeters, litersToGallons, gallonsToLiters } from '../utils/units';

interface Step3SimulateProps {
  inputs: CalculatorInputs;
  result: CalculationResult;
  onChange: (newInputs: CalculatorInputs) => void;
  onPrev: () => void;
  onViewReport: () => void;
}

export const Step3Simulate: React.FC<Step3SimulateProps> = ({
  inputs,
  result,
  onChange,
  onPrev,
  onViewReport,
}) => {
  const { unit, theme, formatVolume, formatVolumeFull } = useAppSettings();
  const isDark = theme === 'dark';
  const isImperial = unit === 'imperial';

  // Before/After comparison tracker
  const [previousHarvested, setPreviousHarvested] = useState<number>(result.harvestableWater);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (!hasInteracted && result.harvestableWater > 0) {
      setPreviousHarvested(result.harvestableWater);
    }
  }, [result.harvestableWater]);

  const handleSliderStart = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
  };

  // Slider change handlers
  const handleRoofAreaSlider = (val: number) => {
    handleSliderStart();
    const areaStr = String(val);
    onChange({ ...inputs, roofAreaMode: 'direct', directRoofArea: areaStr });
  };

  const handleScenarioChange = (scenario: RainfallScenario) => {
    handleSliderStart();
    onChange({
      ...inputs,
      rainfallScenario: scenario,
    });
  };

  const handleTankSlider = (val: number) => {
    handleSliderStart();
    onChange({
      ...inputs,
      tankCapacity: String(val),
    });
  };

  const handleHouseholdSlider = (val: number) => {
    handleSliderStart();
    onChange({
      ...inputs,
      householdSize: String(val),
    });
  };

  const handleResetSliders = () => {
    setPreviousHarvested(result.harvestableWater);
    setHasInteracted(false);
  };

  // Difference in water collected
  const diff = result.harvestableWater - previousHarvested;
  const diffFormatted = formatVolumeFull(Math.abs(diff));

  // Simulation metrics
  const sim = result.simulation;
  const currentFillPct = sim ? sim.peakFillPercentage : 60;
  const tankCapacityL = result.tankCapacity > 0 ? result.tankCapacity : 2000;

  // Chart data format
  const chartData = (sim?.months || []).map((m) => ({
    name: m.monthName,
    inflow: isImperial ? Math.round(litersToGallons(m.inflowL)) : m.inflowL,
    demand: isImperial ? Math.round(litersToGallons(m.demandL)) : m.demandL,
    overflow: isImperial ? Math.round(litersToGallons(m.overflowL)) : m.overflowL,
  }));

  // Slider bounds based on active unit
  const minRoof = isImperial ? 200 : 20;
  const maxRoof = isImperial ? 5000 : 500;
  const currentRoofDisplay = isImperial 
    ? Math.round(sqMetersToSqFeet(result.roofArea)) 
    : result.roofArea;

  const minTank = isImperial ? 100 : 500;
  const maxTank = isImperial ? 5000 : 20000;
  const currentTankDisplay = isImperial 
    ? Math.round(litersToGallons(tankCapacityL)) 
    : tankCapacityL;

  const currentHousehold = parseInt(inputs.householdSize || '4', 10);

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-xs uppercase tracking-wider mb-1.5 border border-teal-200 dark:border-teal-800">
            <span>Step 3 of 3</span>
            <span>•</span>
            <span>SIMULATE &quot;WHAT IF...?&quot;</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit',sans-serif] text-slate-900 dark:text-white tracking-tight">
            See What Happens If You Change Things
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Test a bigger roof, a wetter or drier monsoon, or a larger tank to see live changes in water harvest and overflow.
          </p>
        </div>

        {hasInteracted && (
          <button
            type="button"
            id="step3-reset-baseline-btn"
            onClick={handleResetSliders}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs self-start cursor-pointer min-h-[40px]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Set New Baseline</span>
          </button>
        )}
      </div>

      {/* Notice if Location is not yet selected */}
      {!result.hasLocation && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl" role="img" aria-label="pin">📍</span>
            <span className="font-semibold">
              Please choose your location above to run an accurate 12-month water simulation with real rainfall data.
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

      {/* LIVE BEFORE/AFTER COMPARISON CALLOUT */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-sky-500/10 border-2 border-teal-500/30 dark:border-teal-600/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Live Interactive Comparison</span>
          </span>
          <div className="text-base sm:text-xl font-bold font-['Outfit',sans-serif] text-slate-900 dark:text-white mt-1">
            <span>Last value: </span>
            <span className="text-slate-600 dark:text-slate-400 font-semibold">
              {formatVolumeFull(previousHarvested)}
            </span>
            <span className="mx-2 text-teal-600">→</span>
            <span>New value: </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">
              {formatVolumeFull(result.harvestableWater)}
            </span>
          </div>
        </div>

        <div className="self-start sm:self-center">
          {diff !== 0 ? (
            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-black text-xs sm:text-sm ${
              diff > 0
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                : 'bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
            }`}>
              <span>{diff > 0 ? '▲ +' : '▼ -'}</span>
              <span>{diffFormatted}</span>
            </span>
          ) : (
            <span className="text-xs font-semibold text-slate-500 bg-white/80 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              Adjust sliders below to compare
            </span>
          )}
        </div>
      </div>

      {/* INTERACTIVE CONTROLS: 3 SLIDERS + 1 3-WAY RAINFALL TOGGLE */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <h3 className="font-['Outfit',sans-serif] font-bold text-lg text-slate-900 dark:text-white">
          Adjust Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Slider 1: Roof Area */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>🏠 Roof Area</span>
              </label>
              <span className="font-extrabold text-sm text-teal-800 dark:text-teal-300">
                {currentRoofDisplay} {isImperial ? 'sq ft' : 'm²'}
              </span>
            </div>
            <input
              type="range"
              id="step3-roof-slider"
              min={minRoof}
              max={maxRoof}
              step={isImperial ? 50 : 5}
              value={currentRoofDisplay}
              onChange={(e) => handleRoofAreaSlider(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{minRoof} {isImperial ? 'sq ft' : 'm²'}</span>
              <span>{maxRoof} {isImperial ? 'sq ft' : 'm²'}</span>
            </div>
          </div>

          {/* Control 2: 3-Way Rainfall Toggle (Dry -30% | Normal | Wet +30%) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>🌧️ Monsoon Rain Pattern</span>
              </label>
              <span className="font-extrabold text-xs text-teal-800 dark:text-teal-300">
                {result.scaledAnnualRainfallMm} mm
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-900 border border-slate-300 dark:border-slate-700">
              <button
                type="button"
                id="step3-scenario-dry"
                onClick={() => handleScenarioChange('dry')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition cursor-pointer min-h-[40px] ${
                  inputs.rainfallScenario === 'dry'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Dry (−30%)
              </button>
              <button
                type="button"
                id="step3-scenario-normal"
                onClick={() => handleScenarioChange('normal')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition cursor-pointer min-h-[40px] ${
                  !inputs.rainfallScenario || inputs.rainfallScenario === 'normal'
                    ? 'bg-teal-800 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                id="step3-scenario-wet"
                onClick={() => handleScenarioChange('wet')}
                className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition cursor-pointer min-h-[40px] ${
                  inputs.rainfallScenario === 'wet'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Wet (+30%)
              </button>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Scales typical 3-year rainfall ({result.annualRainfallMm} mm baseline) across all 12 months.
            </p>
          </div>

          {/* Slider 3: Tank Size */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>🛢️ Storage Tank Size</span>
              </label>
              <span className="font-extrabold text-sm text-teal-800 dark:text-teal-300">
                {formatVolume(tankCapacityL)}
              </span>
            </div>
            <input
              type="range"
              id="step3-tank-slider"
              min={minTank}
              max={maxTank}
              step={isImperial ? 100 : 500}
              value={currentTankDisplay}
              onChange={(e) => handleTankSlider(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{formatVolume(minTank)}</span>
              <span>{formatVolume(maxTank)}</span>
            </div>
          </div>

          {/* Slider 4: Household Size */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>👥 Household Members</span>
              </label>
              <span className="font-extrabold text-sm text-teal-800 dark:text-teal-300">
                {currentHousehold} {currentHousehold === 1 ? 'person' : 'people'}
              </span>
            </div>
            <input
              type="range"
              id="step3-household-slider"
              min={1}
              max={15}
              step={1}
              value={currentHousehold}
              onChange={(e) => handleHouseholdSlider(Number(e.target.value))}
              className="w-full accent-teal-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>1 person</span>
              <span>15 people</span>
            </div>
          </div>

        </div>
      </div>

      {/* HEAVY RAIN ALERT (IF ANY MONTH HAS INFLOW > REMAINING SPACE) */}
      <AnimatePresence>
        {sim?.hasHeavyRainWarning && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-4 sm:p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs"
          >
            <span className="text-2xl shrink-0" role="img" aria-label="heavy rain">🌧️</span>
            <div>
              <h4 className="font-bold text-sm sm:text-base text-amber-950 dark:text-amber-100">
                Heavy rain, your tank may overflow
              </h4>
              <p className="text-xs sm:text-sm mt-0.5 leading-relaxed">
                During {sim.heavyRainMonths.join(', ')}, rain comes faster than your {formatVolume(tankCapacityL)} tank can hold. About{' '}
                <strong className="font-extrabold">{formatVolume(sim.totalAnnualOverflowL)}</strong> will spill over.
                Consider a second tank or piping overflow to recharge a borewell or garden pit!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIMULATION VISUALS: TANK ANIMATION GAUGE & MONTHLY RECHARTS BAR CHART */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* TANK ANIMATION GAUGE CARD */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Peak Tank Fill Gauge
            </span>
            <h4 className="font-['Outfit',sans-serif] font-bold text-base text-slate-900 dark:text-white">
              {sim ? `Peak Month: ${sim.peakFillMonth}` : 'Storage Level'}
            </h4>
          </div>

          {/* Animated Water Cylinder */}
          <div className="my-6 relative w-36 h-48 rounded-3xl border-4 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner flex flex-col justify-end">
            {/* Water Fill Layer with Motion */}
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${currentFillPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="w-full bg-gradient-to-t from-teal-700 via-sky-600 to-sky-400 relative"
            >
              {/* Animated wave sheen on top */}
              <div className="absolute inset-x-0 top-0 h-2 bg-white/40 animate-pulse" />
            </motion.div>

            {/* Gauge Marks */}
            <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none text-[9px] font-bold text-slate-400/80">
              <span className="text-right">100% (Full)</span>
              <span className="text-right">75%</span>
              <span className="text-right">50%</span>
              <span className="text-right">25%</span>
              <span className="text-right">Empty</span>
            </div>

            {/* Big Center Percentage */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-3xl font-black font-['Outfit',sans-serif] text-slate-900 dark:text-white drop-shadow-sm">
                {currentFillPct}%
              </span>
            </div>
          </div>

          <div className="w-full text-xs text-slate-500 dark:text-slate-400">
            <span>Capacity: <strong className="text-slate-800 dark:text-slate-200">{formatVolume(tankCapacityL)}</strong></span>
            {sim && sim.totalAnnualOverflowL > 0 && (
              <span className="block text-amber-700 dark:text-amber-400 font-semibold mt-1">
                Overflow: ~{formatVolume(sim.totalAnnualOverflowL)} / yr
              </span>
            )}
          </div>
        </div>

        {/* MONTHLY BAR CHART: Collected vs Used vs Overflow */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                12-Month Monsoon Cycle
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Rain vs Household Consumption
              </span>
            </div>
            <h4 className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-slate-900 dark:text-white">
              Monthly Collected vs Used vs Overflow
            </h4>
          </div>

          <div className="h-64 sm:h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }} 
                  axisLine={{ stroke: isDark ? '#475569' : '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: any) => [formatVolumeFull(Number(val) || 0), '']}
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '16px',
                    fontSize: '12px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                />
                <Bar dataKey="inflow" name="Rain Collected" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="demand" name="Water Used" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="overflow" name="Spill Overflow" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            {sim && (
              <span>
                Total collected: <strong className="text-teal-800 dark:text-teal-300">{formatVolume(sim.totalAnnualInflowL)}</strong> • 
                Total household demand: <strong className="text-slate-700 dark:text-slate-300">{formatVolume(sim.totalAnnualDemandL)}</strong>
              </span>
            )}
          </div>
        </div>

      </div>

      {/* NAVIGATION BUTTONS */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          id="step3-prev-to-plan-btn"
          onClick={onPrev}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer min-h-[48px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Step 2 (Plan)</span>
        </button>

        <button
          type="button"
          id="step3-view-report-btn"
          onClick={onViewReport}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-bold text-sm sm:text-base shadow-lg shadow-teal-900/15 transition cursor-pointer min-h-[48px]"
        >
          <FileText className="w-4 h-4" />
          <span>View My RainWise Plan Report</span>
        </button>
      </div>

    </div>
  );
};
