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

  let activePeriodPotentialL = 0;
  let activePeriodHarvestL = 0;
  roofs.forEach((r) => {
    const rawA = Math.max(0, parseFloat(r.area) || 0);
    const aM2 = r.areaUnit === 'imperial' ? sqFeetToSqMeters(rawA) : rawA;
    const c = getRunoffCoefficient(r.typeKey, undefined, inputs.assumptions, r.customEfficiency);
    activePeriodPotentialL += aM2 * periodRainfallMm;
    activePeriodHarvestL += aM2 * periodRainfallMm * c;
  });
  activePeriodPotentialL = Math.round(activePeriodPotentialL);
  activePeriodHarvestL = Math.round(activePeriodHarvestL);
  const activePeriodLostL = Math.max(0, activePeriodPotentialL - activePeriodHarvestL);
  const activePeriodCoeff = activePeriodPotentialL > 0 ? activePeriodHarvestL / activePeriodPotentialL : 0.8;
  const activeRoofLabel = roofs.length > 1 ? `${roofs.length} Roofs Combined` : (ROOF_TYPES.find((t) => t.key === roofs[0]?.typeKey)?.label || 'Roof');
  const activePeriodBuckets = toBuckets(activePeriodHarvestL, inputs.assumptions?.conversions.bucketSizeL || 15);

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#24354c]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#0a2528] text-teal-300 font-bold text-xs uppercase tracking-wider mb-1.5 border border-teal-700/80">
            <span>Step 1 of 3</span>
            <span>•</span>
            <span>ROOF &amp; RAIN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit',sans-serif] text-white tracking-tight">
            How much rainwater can I collect?
          </h2>
          <p className="text-sm text-slate-300 mt-0.5">
            Add your roofs below. Rainfall is automatically calculated from your location.
          </p>
        </div>

        <button
          type="button"
          id="step1-open-assumptions-btn"
          onClick={onOpenAssumptions}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#2a3b55] bg-[#182438] hover:bg-[#20304a] text-xs font-semibold text-slate-200 shadow-sm self-start cursor-pointer min-h-[44px] transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-teal-400" />
          <span>Assumptions &amp; Runoff</span>
        </button>
      </div>

      {/* Validation Error Alert if blocked */}
      {validationError && (
        <div className="p-4 rounded-2xl bg-[#2d1218] border border-rose-700 text-rose-200 text-sm font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 1: ROOFS LIST (MULTIPLE ROOFS FEATURE)
          ═══════════════════════════════════════════════════════ */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-md space-y-5">
        
        {/* Header with Title and Unit Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="roof">🏠</span>
            <div>
              <h3 className="font-['Outfit',sans-serif] font-bold text-lg text-white">
                Roofs ({roofs.length})
              </h3>
              <p className="text-xs text-slate-300">
                Each roof uses its own surface type and runoff efficiency.
              </p>
            </div>
          </div>

          {/* Unit Toggle: m² vs sq ft */}
          <div className="inline-flex p-1 rounded-xl bg-[#0e1626] border border-[#24354c] text-xs font-bold">
            <button
              type="button"
              id="step1-unit-metric-btn"
              onClick={() => handleToggleUnit('metric')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer min-h-[36px] ${
                !isImperial
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
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
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white'
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
                className="p-4 sm:p-5 rounded-2xl bg-[#182438] border border-[#26374f] shadow-sm space-y-4"
              >
                {/* Roof Header: Editable Name + Remove Button */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-xl shrink-0">{activeType.icon}</span>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        maxLength={35}
                        value={roof.name}
                        onChange={(e) => handleUpdateRoof(roof.id, { name: e.target.value })}
                        placeholder={`Roof ${index + 1}`}
                        className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-white bg-transparent border-b-2 border-dashed border-teal-500/70 hover:border-teal-400 focus:border-teal-300 focus:outline-none px-1 py-0.5 max-w-xs transition-colors"
                        aria-label="Roof name"
                      />
                      <span className="ml-2 text-xs text-slate-400 select-none">✏️</span>
                    </div>
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
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-rose-400 hover:text-rose-200 hover:bg-[#2d1218]'
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
                      className="text-sm font-bold text-slate-100"
                    >
                      Roof Surface / Material
                    </label>
                    <span className="text-xs font-bold text-teal-300">
                      Captures {Math.round(coeff * 100)}% of rain
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      id={`roof-type-${roof.id}`}
                      value={roof.typeKey}
                      onChange={(e) => handleUpdateRoof(roof.id, { typeKey: e.target.value as RoofTypeKey })}
                      className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-xl bg-[#0e1626] border border-[#2a3b55] text-white font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 cursor-pointer min-h-[44px]"
                    >
                      {ROOF_TYPES.map((rt) => (
                        <option key={rt.key} value={rt.key} className="bg-[#131d2e] text-white">
                          {rt.key === 'custom'
                            ? `${rt.icon} Custom Roof Type (enter your own)`
                            : `${rt.icon} ${rt.label} — ${Math.round(rt.coefficient * 100)}% efficiency (${rt.description})`
                          }
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-300 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                      <div className="p-4.5 rounded-xl bg-[#0a2528] border-2 border-teal-600/80 shadow-inner space-y-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                          <span>⚙️ Custom Roof Details</span>
                        </div>

                        {/* a) Type your roof material */}
                        <div>
                          <label 
                            htmlFor={`custom-name-${roof.id}`}
                            className="block text-sm font-bold text-slate-100 mb-1"
                          >
                            Type your roof material <span className="text-rose-400">*</span>
                          </label>
                          <input
                            id={`custom-name-${roof.id}`}
                            type="text"
                            maxLength={30}
                            value={roof.customName || ''}
                            onChange={(e) => handleUpdateRoof(roof.id, { customName: e.target.value })}
                            placeholder="e.g. Bamboo, Fibre sheet, Green roof"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1626] border border-[#2a3b55] text-white placeholder:text-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 min-h-[44px]"
                          />
                          {!roof.customName?.trim() && (
                            <p className="text-xs text-rose-300 mt-1 font-medium">
                              Please type your roof material
                            </p>
                          )}
                        </div>

                        {/* b) Roof efficiency (0 to 100%, default 70%) */}
                        <div>
                          <label className="block text-sm font-bold text-slate-100 mb-1.5">
                            Roof efficiency (how much rain it captures: <span className="text-teal-300 font-extrabold">{roof.customEfficiency ?? 70}%</span>)
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={0}
                              max={100}
                              step={1}
                              value={roof.customEfficiency ?? 70}
                              onChange={(e) => handleUpdateRoof(roof.id, { customEfficiency: parseInt(e.target.value, 10) })}
                              className="flex-1 accent-teal-400 h-2.5 bg-[#0e1626] rounded-lg cursor-pointer border border-[#2a3b55]"
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
                          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-medium">
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
              className="w-full py-3.5 rounded-2xl border-2 border-dashed border-teal-500/70 hover:border-teal-400 text-teal-300 hover:bg-[#182438] text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
            >
              <Plus className="w-4 h-4 text-teal-400" />
              <span>➕ Add another roof (e.g. Shed, Porch, Barn)</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-[#182438] text-slate-300 text-xs font-semibold text-center border border-[#24354c]">
              Maximum 10 roofs reached.
            </div>
          )}
        </div>

        {/* Small Summary: Total roof area across N roofs + Optional per-roof breakdown */}
        <div className="pt-3 border-t border-[#24354c]">
          <div className="p-3.5 rounded-2xl bg-[#0a2528] border border-teal-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-sm font-bold text-white">
                Total roof area: <strong className="text-teal-300 font-extrabold">{formatArea(result.roofArea)}</strong> across {roofs.length} {roofs.length === 1 ? 'roof' : 'roofs'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowRoofBreakdown(!showRoofBreakdown)}
              className="text-xs font-bold text-teal-300 hover:text-teal-200 flex items-center gap-1 cursor-pointer self-start sm:self-auto min-h-[36px]"
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
                        className="p-3 rounded-xl bg-[#182438] border border-[#26374f] text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-white block truncate">
                            {r.name || `Roof ${i + 1}`}
                          </span>
                          <span className="text-xs text-slate-300">
                            {formatArea(aM2)} • {label} ({Math.round(c * 100)}%)
                          </span>
                        </div>
                        {hasLocation && (
                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-teal-300 block">
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
        <div className="p-6 sm:p-8 rounded-3xl bg-[#131d2e] border-2 border-dashed border-teal-500/50 text-center space-y-3 shadow-md">
          <div className="w-12 h-12 rounded-2xl bg-[#0a2528] text-teal-300 flex items-center justify-center text-2xl mx-auto shadow-sm border border-teal-700/60">
            📍
          </div>
          <div>
            <h3 className="font-['Outfit',sans-serif] font-black text-lg sm:text-xl text-white">
              {WEATHER_STRINGS.chooseLocationPrompt}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
              Select your village, town, or city in the location card above (or tap &quot;Use my current location&quot;). RainWise will automatically load your live rain and 3-year rainfall history.
            </p>
          </div>
          <button
            type="button"
            id="step1-go-to-location-btn"
            onClick={handleScrollToLocation}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer min-h-[44px]"
          >
            <MapPin className="w-4 h-4" />
            <span>Select My Location Above</span>
          </button>
        </div>
      ) : isLoadingArchive ? (
        <div className="p-6 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-md space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-teal-400" />
            <span className="font-bold text-sm text-teal-300">
              Calculating 3-year typical rainfall for {inputs.locationName}...
            </span>
          </div>
          <div className="h-20 bg-[#182438] rounded-2xl" />
        </div>
      ) : archiveError ? (
        <div className="p-5 rounded-3xl bg-[#2d1218] border border-rose-800 space-y-3">
          <div className="flex items-center gap-2.5 text-rose-200 text-sm font-semibold">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{archiveError}</span>
          </div>
          {onRetryArchive && (
            <button
              type="button"
              onClick={onRetryArchive}
              className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition cursor-pointer min-h-[44px]"
            >
              {WEATHER_STRINGS.retry}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Period Selector (Shared Global Period: [ This week ] [ This month ] [ Typical year ]) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">⏱️</span>
                <span className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-white">
                  Calculation Period
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Controls all rain collection, saved vs wasted, and chore coverage across the entire app.
              </p>
            </div>
            <PeriodSelector showDescriptions />
          </div>

          {/* Primary Harvest Banner for Selected Period */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#131d2e] border-2 border-teal-500/50 shadow-lg space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-teal-300 bg-[#0a2528] px-2.5 py-0.5 rounded-full border border-teal-700/80">
                Harvestable Water: {periodLabel}
              </span>
              <span className="text-xs text-slate-300">
                📍 {inputs.locationName}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div>
                <h3 className="font-['Outfit',sans-serif] font-black text-2xl sm:text-3xl text-white">
                  {period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'In a typical year'} you could collect about{' '}
                  <span className="text-teal-300 underline decoration-teal-500 underline-offset-4">
                    {formatVolumeFull(activePeriodHarvestL)}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  Based on {periodRainfallMm} mm of rain across your {formatArea(result.roofArea)} of roof ({roofs.length} {roofs.length === 1 ? 'roof' : 'roofs'}).
                </p>
              </div>

              {/* Bucket comparison highlight */}
              <div className="sm:text-right shrink-0 mt-2 sm:mt-0">
                <span className="font-['Outfit',sans-serif] font-black text-2xl text-teal-300 block">
                  ≈ {activePeriodBuckets.toLocaleString()} buckets
                </span>
                <span className="text-[11px] text-slate-400">
                  (1 bucket ≈ {inputs.assumptions?.conversions.bucketSizeL || 15} L)
                </span>
              </div>
            </div>

            {/* Droplet graphic */}
            <div className="pt-2">
              <WaterDropVisual 
                potentialWaterL={activePeriodPotentialL}
                harvestableWaterL={activePeriodHarvestL}
                waterLostL={activePeriodLostL}
                runoffCoefficient={activePeriodCoeff}
                roofTypeLabel={activeRoofLabel}
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
          className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-sm sm:text-base shadow-lg transition-all cursor-pointer min-h-[50px] w-full sm:w-auto"
        >
          <span>Next: Plan Water Use (Step 2)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};
