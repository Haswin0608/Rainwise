import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Layers, 
  MapPin, 
  Plus, 
  Trash2, 
  CloudRain, 
  Sliders, 
  Info,
  ChevronDown,
  Building,
  Sparkles,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { 
  CalculatorInputs, 
  CalculationResult, 
  FormErrors, 
  ROOF_TYPES, 
  RoofTypeKey, 
  RoofSection,
} from '../types';
import { WaterDropVisual } from './WaterDropVisual';
import { useAppSettings } from '../context/AppSettingsContext';
import { sqMetersToSqFeet, sqFeetToSqMeters } from '../utils/units';
import { WEATHER_STRINGS } from '../utils/weather';

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
  const { unit, setUnit, formatArea, formatVolumeFull } = useAppSettings();
  const [showTooltip, setShowTooltip] = useState(false);

  const isImperial = unit === 'imperial';

  // Selected roof type config
  const activeRoofType = ROOF_TYPES.find((r) => r.key === inputs.roofType) || ROOF_TYPES[0];

  // Handler for roof type dropdown
  const handleRoofTypeChange = (key: RoofTypeKey) => {
    const selected = ROOF_TYPES.find((r) => r.key === key) || ROOF_TYPES[0];
    onChange({
      ...inputs,
      roofType: key,
      efficiency: String(Math.round(selected.coefficient * 100)),
    });
  };

  // Handler for area mode toggle (Direct total area vs Multiple individual roof sections)
  const handleAreaModeChange = (mode: 'direct' | 'sections') => {
    onChange({
      ...inputs,
      roofAreaMode: mode,
    });
  };

  // Direct area input change
  const handleDirectAreaChange = (val: string) => {
    onChange({
      ...inputs,
      directRoofArea: val,
    });
  };

  // Multi-roof section updates
  const handleAddRoofSection = () => {
    const nextId = String(Date.now());
    const newSection: RoofSection = {
      id: nextId,
      name: `Roof ${(inputs.roofs || []).length + 1}`,
      length: '10',
      width: '8',
    };
    onChange({
      ...inputs,
      roofs: [...(inputs.roofs || []), newSection],
    });
  };

  const handleRemoveRoofSection = (id: string) => {
    const updated = (inputs.roofs || []).filter((r) => r.id !== id);
    onChange({
      ...inputs,
      roofs: updated,
    });
  };

  const handleRoofSectionChange = (id: string, field: 'name' | 'length' | 'width', val: string) => {
    const updated = (inputs.roofs || []).map((r) => {
      if (r.id === id) {
        return { ...r, [field]: val };
      }
      return r;
    });
    onChange({
      ...inputs,
      roofs: updated,
    });
  };

  // Unit toggle handler (m² <-> sq ft)
  const handleToggleUnit = (newUnit: 'metric' | 'imperial') => {
    if (newUnit === unit) return;
    setUnit(newUnit);

    // Convert direct area value for continuity
    const currentDirect = parseFloat(inputs.directRoofArea);
    if (!isNaN(currentDirect) && currentDirect > 0) {
      const converted = newUnit === 'imperial'
        ? Number(sqMetersToSqFeet(currentDirect).toFixed(1))
        : Number(sqFeetToSqMeters(currentDirect).toFixed(1));
      onChange({
        ...inputs,
        directRoofArea: String(converted),
      });
    }
  };

  // Scroll to location prompt card when user clicks "Choose Location"
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

  return (
    <div className="space-y-6">
      
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-xs uppercase tracking-wider mb-1.5 border border-teal-200 dark:border-teal-800">
            <span>Step 1 of 3</span>
            <span>•</span>
            <span>ROOF & RAIN</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit',sans-serif] text-slate-900 dark:text-white tracking-tight">
            How much rainwater can I collect?
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Enter your roof size. Rainfall is automatically calculated from your location above.
          </p>
        </div>

        <button
          type="button"
          id="step1-open-assumptions-btn"
          onClick={onOpenAssumptions}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs self-start cursor-pointer min-h-[40px]"
        >
          <Sliders className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Assumptions & Runoff</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════
          CARD 1: ROOF AREA & ROOF TYPE
          ═══════════════════════════════════════════════════════ */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        
        {/* Roof Area Title + Unit Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label="roof">🏠</span>
            <h3 className="font-['Outfit',sans-serif] font-bold text-lg text-slate-900 dark:text-white">
              Roof Area
            </h3>
          </div>

          {/* Unit Toggle: m² vs sq ft */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold">
            <button
              type="button"
              id="step1-unit-metric-btn"
              onClick={() => handleToggleUnit('metric')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer min-h-[36px] ${
                !isImperial
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
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
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Square Feet (sq ft)
            </button>
          </div>
        </div>

        {/* Input Mode Selector: Direct Total vs Multiple Roofs */}
        <div className="flex gap-2 p-1 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80">
          <button
            type="button"
            id="step1-mode-direct-btn"
            onClick={() => handleAreaModeChange('direct')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer min-h-[40px] ${
              inputs.roofAreaMode === 'direct'
                ? 'bg-white dark:bg-slate-700 text-teal-900 dark:text-teal-200 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            I know my total roof area
          </button>
          <button
            type="button"
            id="step1-mode-sections-btn"
            onClick={() => handleAreaModeChange('sections')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer min-h-[40px] ${
              inputs.roofAreaMode === 'sections'
                ? 'bg-white dark:bg-slate-700 text-teal-900 dark:text-teal-200 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Calculate from length × width
          </button>
        </div>

        {/* Direct Area Input */}
        {inputs.roofAreaMode === 'direct' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Total Roof Catchment Area
            </label>
            <div className="relative">
              <input
                type="number"
                id="step1-direct-area-input"
                min="1"
                step={isImperial ? '10' : '1'}
                value={inputs.directRoofArea}
                onChange={(e) => handleDirectAreaChange(e.target.value)}
                placeholder={isImperial ? 'e.g. 1000' : 'e.g. 100'}
                className="w-full text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[52px]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400">
                {isImperial ? 'sq ft' : 'm²'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              {isImperial
                ? `≈ ${(parseFloat(inputs.directRoofArea || '0') / 10.76).toFixed(1)} m² (1 m² = 10.76 sq ft)`
                : `≈ ${(parseFloat(inputs.directRoofArea || '0') * 10.76).toFixed(0)} sq ft (typical 2-BHK house is ~100 m²)`}
            </p>
          </div>
        ) : (
          /* Multi-roof sections */
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Roof Sections ({isImperial ? 'feet' : 'metres'})
            </label>
            
            <div className="space-y-2">
              {(inputs.roofs || []).map((roof, idx) => {
                const l = parseFloat(roof.length) || 0;
                const w = parseFloat(roof.width) || 0;
                const sectionArea = Number((l * w).toFixed(1));

                return (
                  <div
                    key={roof.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {roof.name || `Section ${idx + 1}`}
                      </span>
                      {(inputs.roofs || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveRoofSection(roof.id)}
                          className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Remove section"
                          aria-label="Remove section"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                          Length ({isImperial ? 'ft' : 'm'})
                        </label>
                        <input
                          type="number"
                          value={roof.length}
                          onChange={(e) => handleRoofSectionChange(roof.id, 'length', e.target.value)}
                          placeholder="Length"
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold text-xs min-h-[40px]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                          Width ({isImperial ? 'ft' : 'm'})
                        </label>
                        <input
                          type="number"
                          value={roof.width}
                          onChange={(e) => handleRoofSectionChange(roof.id, 'width', e.target.value)}
                          placeholder="Width"
                          className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-semibold text-xs min-h-[40px]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              id="step1-add-roof-btn"
              onClick={handleAddRoofSection}
              className="w-full py-2.5 rounded-xl border border-dashed border-teal-500/60 hover:border-teal-600 text-teal-800 dark:text-teal-300 hover:bg-teal-50/50 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Another Roof (e.g. Shed, Porch, Barn)</span>
            </button>
          </div>
        )}

        {/* Roof Material / Type Dropdown */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Roof Material / Type
            </label>
            <span className="text-[11px] text-teal-700 dark:text-teal-400 font-bold">
              Runoff: {activeRoofType.coefficient * 100}%
            </span>
          </div>

          <div className="relative">
            <select
              id="step1-roof-type-select"
              value={inputs.roofType}
              onChange={(e) => handleRoofTypeChange(e.target.value as RoofTypeKey)}
              className="w-full appearance-none px-3.5 py-2.5 pr-9 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer min-h-[48px]"
            >
              {ROOF_TYPES.map((rt) => (
                <option key={rt.key} value={rt.key}>
                  {rt.icon} {rt.label} — {rt.coefficient.toFixed(2)} coefficient ({rt.description})
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Runoff coefficient sets how much rain drains off ({Math.round(activeRoofType.coefficient * 100)}%) vs lost to splash ({Math.round((1 - activeRoofType.coefficient) * 100)}%).
          </p>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2: LOCATION-BASED RAINFALL & RESULTS
          ═══════════════════════════════════════════════════════ */}
      {!hasLocation ? (
        /* BEFORE LOCATION IS CHOSEN */
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-teal-50/70 via-sky-50/50 to-white dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-2 border-dashed border-teal-500/40 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center text-2xl mx-auto shadow-xs">
            📍
          </div>
          <div>
            <h3 className="font-['Outfit',sans-serif] font-black text-lg sm:text-xl text-slate-900 dark:text-white">
              {WEATHER_STRINGS.chooseLocationPrompt}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Select your village, town, or city in the location card above (or tap "Use my current location"). RainWise will automatically load your 7-day live rain and 3-year rainfall pattern.
            </p>
          </div>
          <button
            type="button"
            id="step1-go-to-location-btn"
            onClick={handleScrollToLocation}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer min-h-[44px]"
          >
            <MapPin className="w-4 h-4" />
            <span>Select My Location Above</span>
          </button>
        </div>
      ) : isLoadingArchive ? (
        /* LOADING SKELETON WHILE 3-YEAR ARCHIVE DATA FETCHES */
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 animate-pulse">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span className="font-bold text-sm text-teal-800 dark:text-teal-300">
              Calculating 3-year typical rainfall for {inputs.locationName}...
            </span>
          </div>
          <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      ) : archiveError ? (
        /* ARCHIVE LOAD ERROR */
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3">
          <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200 text-sm font-semibold">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{archiveError}</span>
          </div>
          {onRetryArchive && (
            <button
              type="button"
              onClick={onRetryArchive}
              className="px-4 py-2 rounded-xl bg-rose-200 hover:bg-rose-300 active:bg-rose-400 dark:bg-rose-900 dark:hover:bg-rose-800 font-bold text-xs text-rose-950 dark:text-rose-100 transition cursor-pointer min-h-[44px]"
            >
              {WEATHER_STRINGS.retry}
            </button>
          )}
        </div>
      ) : (
        /* LOCATION IS LOADED: MAIN SHORT-TERM & YEARLY HARVEST RESULTS */
        <div className="space-y-5">
          
          {/* A) SHORT-TERM: This week you could collect */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-teal-50/80 via-white to-sky-50/60 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-2 border-teal-600/30 dark:border-teal-700/50 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300 bg-teal-100/70 dark:bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                Live 7-Day Harvest
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                📍 {inputs.locationName}
              </span>
            </div>

            <div>
              <h3 className="font-['Outfit',sans-serif] font-black text-2xl sm:text-3xl text-slate-900 dark:text-white">
                This week you could collect about{' '}
                <span className="text-teal-800 dark:text-teal-400 underline decoration-teal-300 dark:decoration-teal-600 underline-offset-4">
                  {result.weeklyHarvestableWater.toLocaleString()} litres
                </span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-mono">
                = roof area ({result.roofArea} m²) × weekly rainfall ({result.weeklyRainfallMm} mm) × runoff ({activeRoofType.coefficient})
              </p>
            </div>
          </div>

          {/* B) YEARLY ESTIMATE: Read-only line with ⓘ icon & Water Drop Visual */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            
            <div className="space-y-1.5">
              {/* Read-only line */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-['Outfit',sans-serif] font-black text-base sm:text-lg text-slate-900 dark:text-white">
                  {WEATHER_STRINGS.typicalYearlyRainLabel}{' '}
                  <span className="text-teal-800 dark:text-teal-300 font-extrabold">
                    {result.annualRainfallMm} mm
                  </span>
                </span>

                {/* ⓘ Icon with Tooltip */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setShowTooltip(!showTooltip)}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="p-1 text-slate-400 hover:text-teal-600 cursor-pointer rounded-full transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                    aria-label="Explain typical yearly rainfall"
                  >
                    <Info className="w-4 h-4" />
                  </button>

                  <AnimatePresence>
                    {showTooltip && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        className="absolute left-0 bottom-full mb-1 z-30 w-64 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] leading-relaxed shadow-xl border border-slate-700"
                      >
                        {WEATHER_STRINGS.typicalYearlyRainInfo}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Plain words line */}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                {WEATHER_STRINGS.basedOn3YearAverage.replace('{mm}', String(result.annualRainfallMm))}
              </p>
            </div>

            {/* Visual: Water Drop Diagram for Yearly Harvest */}
            <WaterDropVisual
              potentialWaterL={result.potentialWater}
              harvestableWaterL={result.harvestableWater}
              waterLostL={result.waterLost}
              runoffCoefficient={result.runoffCoefficient}
              roofTypeLabel={activeRoofType.label}
            />

          </div>

          {/* NEXT STEP BUTTON */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              id="step1-next-to-plan-btn"
              onClick={onNext}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-bold text-sm sm:text-base shadow-lg shadow-teal-900/15 transition cursor-pointer min-h-[48px]"
            >
              <span>Next: Plan What To Do With This Water</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
