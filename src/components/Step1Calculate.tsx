import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  MapPin, 
  Plus, 
  Trash2, 
  Sliders, 
  Info, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  Loader2,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  CalculatorInputs, 
  CalculationResult, 
  ROOF_TYPES, 
  RoofTypeKey, 
  RoofItem 
} from '../types';
import { StepperNumberInput } from './StepperNumberInput';
import { PeriodSelector } from './PeriodSelector';
import { WaterDropVisual } from './WaterDropVisual';
import { useAppSettings } from '../context/AppSettingsContext';
import { sqMetersToSqFeet, sqFeetToSqMeters } from '../utils/units';
import { WEATHER_STRINGS } from '../utils/weather';
import { 
  toBuckets, 
  normalizeRoofs, 
  getRunoffCoefficient, 
  MONTH_NAMES 
} from '../utils/calculations';

interface Step1CalculateProps {
  inputs: CalculatorInputs;
  result: CalculationResult;
  onChange: (newInputs: CalculatorInputs) => void;
  onNext: () => void;
  onOpenAssumptions: () => void;
  onRetryArchive?: () => void;
}

export const Step1Calculate: React.FC<Step1CalculateProps> = ({
  inputs,
  result,
  onChange,
  onNext,
  onOpenAssumptions,
  onRetryArchive,
}) => {
  const { unit, setUnit, formatArea, formatVolume, formatVolumeFull, period } = useAppSettings();
  const [showRoofBreakdown, setShowRoofBreakdown] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isImperial = unit === 'imperial';
  const roofs: RoofItem[] = normalizeRoofs(inputs.roofs, inputs.directRoofArea, inputs.roofType);

  // Unit toggle handler (m² <-> sq ft)
  const handleToggleUnit = (newUnit: 'metric' | 'imperial') => {
    if (newUnit === unit) return;
    setUnit(newUnit);

    // Convert existing roof areas cleanly
    const convertedRoofs = roofs.map((r) => {
      const currentArea = parseFloat(r.area) || 0;
      if (currentArea <= 0) return { ...r, areaUnit: newUnit };
      const converted = newUnit === 'imperial'
        ? Math.round(sqMetersToSqFeet(currentArea) * 10) / 10
        : Math.round(sqFeetToSqMeters(currentArea) * 10) / 10;
      return {
        ...r,
        area: String(converted),
        areaUnit: newUnit,
      };
    });

    onChange({
      ...inputs,
      roofs: convertedRoofs,
    });
  };

  // Add another roof (up to 10)
  const handleAddRoof = () => {
    if (roofs.length >= 10) return;
    const nextIdx = roofs.length + 1;
    const newRoof: RoofItem = {
      id: `roof_${Date.now()}_${nextIdx}`,
      name: `Roof ${nextIdx}`,
      area: isImperial ? '500' : '50',
      areaUnit: unit,
      typeKey: 'concrete',
      customName: '',
      customEfficiency: 70,
    };
    onChange({
      ...inputs,
      roofs: [...roofs, newRoof],
    });
    setValidationError(null);
  };

  // Remove roof (at least 1 roof must remain)
  const handleRemoveRoof = (id: string) => {
    if (roofs.length <= 1) return;
    const updated = roofs.filter((r) => r.id !== id);
    onChange({
      ...inputs,
      roofs: updated,
    });
    setValidationError(null);
  };

  // Update roof fields
  const handleUpdateRoof = (id: string, updates: Partial<RoofItem>) => {
    const updated = roofs.map((r) => {
      if (r.id === id) {
        return { ...r, ...updates };
      }
      return r;
    });
    onChange({
      ...inputs,
      roofs: updated,
    });
    setValidationError(null);
  };

  // Validate before proceeding to Step 2
  const handleProceed = () => {
    for (const r of roofs) {
      const a = parseFloat(r.area);
      if (isNaN(a) || a <= 0) {
        setValidationError(`Please enter a valid area greater than 0 for "${r.name}".`);
        return;
      }
      if (r.typeKey === 'custom' && (!r.customName || !r.customName.trim())) {
        setValidationError(`Please type your roof material for "${r.name}".`);
        return;
      }
    }
    setValidationError(null);
    onNext();
  };

  // Scroll to location prompt card
  const handleScrollToLocation = () => {
    const el = document.getElementById('location-section-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-teal-500/50');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-teal-500/50');
      }, 2000);
    }
  };

  const hasLocation = result.hasLocation;
  const isLoadingArchive = inputs.isLoadingArchive;
  const archiveError = inputs.archiveError;

  // Active period calculations for collection display
  const currentMonthName = MONTH_NAMES[new Date().getMonth()];
  const periodLabel = period === 'week' 
    ? 'this week' 
    : period === 'month' 
    ? `this month (${currentMonthName})` 
    : 'typical year';

  // Compute active period rainfall and collection
  const periodRainfallMm = period === 'week' 
    ? result.weeklyRainfallMm 
    : period === 'month' 
    ? (result.monthlyRainfallMm ?? 0)
    : result.scaledAnnualRainfallMm;

  let activePeriodHarvestL = 0;
  roofs.forEach((r) => {
    const rawA = Math.max(0, parseFloat(r.area) || 0);
    const aM2 = r.areaUnit === 'imperial' ? sqFeetToSqMeters(rawA) : rawA;
    const c = getRunoffCoefficient(r.typeKey, undefined, inputs.assumptions, r.customEfficiency);
    activePeriodHarvestL += aM2 * periodRainfallMm * c;
  });
  activePeriodHarvestL = Math.round(activePeriodHarvestL);
  const activePeriodBuckets = toBuckets(activePeriodHarvestL, inputs.assumptions?.conversions.bucketSizeL || 15);

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-xs uppercase tracking-wider mb-1.5 border border-teal-200 dark:border-teal-800">
            <span>Step 1 of 3</span>
            <span>•</span>
            <span>ROOF &amp; RAIN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit',sans-serif] text-slate-900 dark:text-white tracking-tight">
            How much rainwater can I collect?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Add your roofs below. Rainfall is automatically calculated from your location.
          </p>
        </div>

        <button
          type="button"
          id="step1-open-assumptions-btn"
          onClick={onOpenAssumptions}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs self-start cursor-pointer min-h-[44px]"
        >
          <Sliders className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Assumptions &amp; Runoff</span>
        </button>
      </div>

      {/* Validation Error Alert if blocked */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: ROOFS LIST (MULTIPLE ROOFS FEATURE)
          ═══════════════════════════════════════════════════════ */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        
        {/* Header with Title and Unit Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="roof">🏠</span>
            <div>
              <h3 className="font-['Outfit',sans-serif] font-bold text-lg text-slate-900 dark:text-white">
                Roofs ({roofs.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Each roof uses its own surface type and runoff efficiency.
              </p>
            </div>
          </div>

          {/* Unit Toggle: m² vs sq ft */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              id="step1-unit-metric-btn"
              onClick={() => handleToggleUnit('metric')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer min-h-[36px] ${
                !isImperial
                  ? 'bg-teal-850 dark:bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Square Metres (m²)
            </button>
            <button
              type="button"
              id="step1-unit-imperial-btn"
              onClick={() => handleToggleUnit('imperial')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer min-h-[36px] ${
                isImperial
                  ? 'bg-teal-850 dark:bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Square Feet (sq ft)
            </button>
          </div>
        </div>

        {/* Roof Cards List */}
        <div className="space-y-4">
          {roofs.map((roof, index) => {
            const activeType = ROOF_TYPES.find((t) => t.key === roof.typeKey) || ROOF_TYPES[0];
            const isCustom = roof.typeKey === 'custom';
            const coeff = getRunoffCoefficient(roof.typeKey, undefined, inputs.assumptions, roof.customEfficiency);

            return (
              <div
                key={roof.id}
                id={`roof-card-${roof.id}`}
                className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 shadow-2xs space-y-4"
              >
                {/* Roof Header: Editable Name + Remove Button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl shrink-0">{activeType.icon}</span>
                    <input
                      type="text"
                      maxLength={35}
                      value={roof.name}
                      onChange={(e) => handleUpdateRoof(roof.id, { name: e.target.value })}
                      placeholder={`Roof ${index + 1}`}
                      className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-teal-600 focus:outline-none px-1 py-0.5 max-w-xs"
                      aria-label="Roof name"
                    />
                  </div>

                  {/* 🗑️ Remove Button (Disabled if last remaining roof) */}
                  <button
                    type="button"
                    onClick={() => handleRemoveRoof(roof.id)}
                    disabled={roofs.length <= 1}
                    title={roofs.length <= 1 ? 'Cannot remove the last remaining roof' : 'Remove this roof'}
                    aria-label={`Remove ${roof.name}`}
                    className={`p-2 rounded-xl transition cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
                      roofs.length <= 1
                        ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                        : 'text-rose-600 hover:text-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/60'
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Roof Area with Stepper [ − ] [ input ] [ + ] */}
                <div>
                  <StepperNumberInput
                    id={`roof-area-${roof.id}`}
                    label="Roof Area"
                    unit={isImperial ? 'sq ft' : 'm²'}
                    value={roof.area}
                    onChange={(val) => handleUpdateRoof(roof.id, { area: val })}
                    step={isImperial ? 50 : 5}
                    min={1}
                    max={isImperial ? 150000 : 15000}
                    placeholder={isImperial ? '1000' : '100'}
                    error={
                      !roof.area || parseFloat(roof.area) <= 0 || isNaN(parseFloat(roof.area))
                        ? 'Please enter roof area'
                        : undefined
                    }
                    helperText={
                      isImperial
                        ? `≈ ${(parseFloat(roof.area || '0') / 10.76).toFixed(1)} m²`
                        : `≈ ${(parseFloat(roof.area || '0') * 10.76).toFixed(0)} sq ft`
                    }
                    compact
                  />
                </div>

                {/* Roof Material / Type Dropdown */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label 
                      htmlFor={`roof-type-${roof.id}`}
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Roof Surface / Material
                    </label>
                    <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300">
                      Captures {Math.round(coeff * 100)}% of rain
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      id={`roof-type-${roof.id}`}
                      value={roof.typeKey}
                      onChange={(e) => handleUpdateRoof(roof.id, { typeKey: e.target.value as RoofTypeKey })}
                      className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer min-h-[44px]"
                    >
                      {ROOF_TYPES.map((rt) => (
                        <option key={rt.key} value={rt.key}>
                          {rt.icon} {rt.label} — {Math.round(rt.coefficient * 100)}% efficiency ({rt.description})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* ═════════════════════════════════════════════════════
                    5. CUSTOM ROOF TYPE EXPANDABLE FIELDS
                    ═════════════════════════════════════════════════════ */}
                <AnimatePresence>
                  {isCustom && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 space-y-3.5 mt-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-200">
                          <span>⚙️ Custom Roof Details</span>
                        </div>

                        {/* a) Type your roof material */}
                        <div>
                          <label 
                            htmlFor={`custom-name-${roof.id}`}
                            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                          >
                            Type your roof material <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id={`custom-name-${roof.id}`}
                            type="text"
                            maxLength={30}
                            value={roof.customName || ''}
                            onChange={(e) => handleUpdateRoof(roof.id, { customName: e.target.value })}
                            placeholder="e.g. Bamboo, Fibre sheet, Green roof"
                            className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-medium text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[44px]"
                          />
                          {!roof.customName?.trim() && (
                            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
                              Please type your roof material
                            </p>
                          )}
                        </div>

                        {/* b) Roof efficiency (0 to 100%, default 70%) */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Roof efficiency (how much rain it captures: {roof.customEfficiency ?? 70}%)
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              value={roof.customEfficiency ?? 70}
                              onChange={(e) => handleUpdateRoof(roof.id, { customEfficiency: parseInt(e.target.value, 10) })}
                              className="flex-1 accent-teal-700 dark:accent-teal-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                              aria-label="Roof efficiency percentage"
                            />
                            <div className="w-32">
                              <StepperNumberInput
                                id={`custom-eff-${roof.id}`}
                                value={String(roof.customEfficiency ?? 70)}
                                onChange={(val) => handleUpdateRoof(roof.id, { customEfficiency: parseInt(val, 10) || 0 })}
                                step={5}
                                min={0}
                                max={100}
                                unit="%"
                                compact
                              />
                            </div>
                          </div>

                          {/* Helper text */}
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                            💡 Hint: Most roofs are between 60% (thatch) and 90% (metal sheet). Smooth hard roofs capture more (80 to 90%), rough or soft roofs capture less (50 to 70%).
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })}
        </div>

        {/* ➕ Add Another Roof Button (up to 10) */}
        <div>
          {roofs.length < 10 ? (
            <button
              type="button"
              id="step1-add-roof-btn"
              onClick={handleAddRoof}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-teal-500/60 hover:border-teal-600 text-teal-850 dark:text-teal-300 hover:bg-teal-50/50 dark:hover:bg-slate-800/80 text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
            >
              <Plus className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>➕ Add another roof (e.g. Shed, Porch, Barn)</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold text-center">
              Maximum 10 roofs reached.
            </div>
          )}
        </div>

        {/* Small Summary: Total roof area across N roofs + Optional per-roof breakdown */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Total roof area: <strong className="text-teal-900 dark:text-teal-200">{formatArea(result.roofArea)}</strong> across {roofs.length} {roofs.length === 1 ? 'roof' : 'roofs'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowRoofBreakdown(!showRoofBreakdown)}
              className="text-xs font-bold text-teal-800 dark:text-teal-300 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto min-h-[36px]"
            >
              <span>{showRoofBreakdown ? 'Hide details' : 'Per-roof breakdown'}</span>
              {showRoofBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Collapsible Per-Roof Breakdown */}
          <AnimatePresence>
            {showRoofBreakdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5">
                  {roofs.map((r, i) => {
                    const rawA = Math.max(0, parseFloat(r.area) || 0);
                    const aM2 = r.areaUnit === 'imperial' ? sqFeetToSqMeters(rawA) : rawA;
                    const c = getRunoffCoefficient(r.typeKey, undefined, inputs.assumptions, r.customEfficiency);
                    const roofHarvestL = Math.round(aM2 * periodRainfallMm * c);
                    const typeOpt = ROOF_TYPES.find((t) => t.key === r.typeKey);
                    const label = r.typeKey === 'custom' && r.customName ? r.customName : typeOpt?.label || 'Roof';

                    return (
                      <div 
                        key={r.id} 
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-white block truncate">
                            {r.name || `Roof ${i + 1}`}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {formatArea(aM2)} • {label} ({Math.round(c * 100)}%)
                          </span>
                        </div>
                        {hasLocation && (
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-teal-800 dark:text-teal-300 block">
                              {formatVolume(roofHarvestL)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {periodLabel}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2: LOCATION-BASED RAINFALL & HARVEST RESULTS
          ═══════════════════════════════════════════════════════ */}
      {!hasLocation ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-teal-50/70 via-sky-50/50 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-2 border-dashed border-teal-500/40 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center text-2xl mx-auto shadow-xs">
            📍
          </div>
          <div>
            <h3 className="font-['Outfit',sans-serif] font-black text-lg sm:text-xl text-slate-900 dark:text-white">
              {WEATHER_STRINGS.chooseLocationPrompt}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Select your village, town, or city in the location card above (or tap &quot;Use my current location&quot;). RainWise will automatically load your live rain and 3-year rainfall history.
            </p>
          </div>
          <button
            type="button"
            id="step1-go-to-location-btn"
            onClick={handleScrollToLocation}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-teal-850 hover:bg-teal-900 active:bg-teal-950 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer min-h-[44px]"
          >
            <MapPin className="w-4 h-4" />
            <span>Select My Location Above</span>
          </button>
        </div>
      ) : isLoadingArchive ? (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span className="font-bold text-sm text-teal-800 dark:text-teal-300">
              Calculating 3-year typical rainfall for {inputs.locationName}...
            </span>
          </div>
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      ) : archiveError ? (
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3">
          <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200 text-sm font-semibold">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{archiveError}</span>
          </div>
          {onRetryArchive && (
            <button
              type="button"
              onClick={onRetryArchive}
              className="px-4 py-2 rounded-xl bg-rose-200 hover:bg-rose-300 text-rose-950 font-bold text-xs transition cursor-pointer min-h-[44px]"
            >
              {WEATHER_STRINGS.retry}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Period Selector (Shared Global Period: [ This week ] [ This month ] [ Typical year ]) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⏱️</span>
                <span className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  Calculation Period
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Controls all rain collection, saved vs wasted, and chore coverage across the entire app.
              </p>
            </div>
            <PeriodSelector showDescriptions />
          </div>

          {/* Primary Harvest Banner for Selected Period */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-teal-50/80 via-white to-sky-50/60 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-2 border-teal-600/30 dark:border-teal-700/50 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-100/70 dark:bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                Harvestable Water: {periodLabel}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                📍 {inputs.locationName}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <h3 className="font-['Outfit',sans-serif] font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                  {period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'In a typical year'} you could collect about{' '}
                  <span className="text-teal-850 dark:text-teal-400 underline decoration-teal-300 dark:decoration-teal-600 underline-offset-4">
                    {formatVolumeFull(activePeriodHarvestL)}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Based on {periodRainfallMm} mm of rain across your {formatArea(result.roofArea)} of roof ({roofs.length} {roofs.length === 1 ? 'roof' : 'roofs'}).
                </p>
              </div>

              {/* Bucket comparison highlight */}
              <div className="sm:text-right shrink-0 mt-2 sm:mt-0">
                <span className="font-['Outfit',sans-serif] font-black text-2xl text-teal-800 dark:text-teal-300 block">
                  ≈ {activePeriodBuckets.toLocaleString()} buckets
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  (1 bucket ≈ {inputs.assumptions?.conversions.bucketSizeL || 15} L)
                </span>
              </div>
            </div>

            {/* Droplet graphic */}
            <div className="pt-2">
              <WaterDropVisual 
                waterAmountLiters={activePeriodHarvestL} 
                isWeekly={period === 'week'}
              />
            </div>
          </div>

        </div>
      )}

      {/* Action CTA: Move to Step 2 */}
      <div className="pt-4 flex items-center justify-end">
        <button
          type="button"
          id="step1-next-btn"
          onClick={handleProceed}
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-teal-850 hover:bg-teal-900 active:bg-teal-950 text-white font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all cursor-pointer min-h-[50px] w-full sm:w-auto"
        >
          <span>Next: Plan Water Use (Step 2)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
