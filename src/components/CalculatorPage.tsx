import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Ruler, 
  CloudRain, 
  Percent, 
  Container, 
  Calendar, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle, 
  Droplets,
  Info,
  CheckCircle2
} from 'lucide-react';
import { CalculatorInputs, FormErrors, PresetScenario } from '../types';
import { validateInputs, PRESET_SCENARIOS } from '../utils/calculations';

interface CalculatorPageProps {
  inputs: CalculatorInputs;
  onChange: (inputs: CalculatorInputs) => void;
  onCalculate: () => void;
  onBack: () => void;
  isCalculating: boolean;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({
  inputs,
  onChange,
  onCalculate,
  onBack,
  isCalculating,
}) => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof CalculatorInputs, value: string) => {
    const updated = { ...inputs, [field]: value };
    onChange(updated);

    if (touched[field]) {
      const validation = validateInputs(updated);
      setErrors((prev) => ({
        ...prev,
        [field]: validation.errors[field],
      }));
    }
  };

  const handleBlur = (field: keyof CalculatorInputs) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validation = validateInputs(inputs);
    setErrors((prev) => ({
      ...prev,
      [field]: validation.errors[field],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all as touched
    setTouched({
      roofLength: true,
      roofWidth: true,
      rainfall: true,
      efficiency: true,
      tankCapacity: true,
      dailyRequirement: true,
    });

    const validation = validateInputs(inputs);
    setErrors(validation.errors);

    if (validation.isValid) {
      onCalculate();
    }
  };

  const applyPreset = (preset: PresetScenario) => {
    onChange(preset.inputs);
    setErrors({});
    setTouched({});
  };

  // Instant calculated helpers
  const numLength = parseFloat(inputs.roofLength) || 0;
  const numWidth = parseFloat(inputs.roofWidth) || 0;
  const liveRoofArea = numLength > 0 && numWidth > 0 ? (numLength * numWidth).toFixed(1) : '—';

  const numRain = parseFloat(inputs.rainfall) || 0;
  const numEff = (parseFloat(inputs.efficiency) || 80) / 100;
  const livePotential = (numLength * numWidth * numRain);
  const liveHarvestable = livePotential > 0 ? Math.round(livePotential * numEff) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Back button & header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          id="calc-back-btn"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-2 py-1 rounded-lg hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Overview</span>
        </button>

        {/* Quick Presets selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-500 hidden sm:inline">Presets:</span>
          {PRESET_SCENARIOS.map((p) => (
            <button
              key={p.id}
              type="button"
              id={`calc-preset-chip-${p.id}`}
              onClick={() => applyPreset(p)}
              className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-teal-400 hover:text-teal-900 transition-all shadow-2xs font-medium"
            >
              {p.icon} <span className="hidden md:inline">{p.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 relative overflow-hidden">
        {/* Soft top accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-600 via-teal-700 to-sky-700" />

        {/* Header description */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200/60 mb-2">
            <Droplets className="w-3.5 h-3.5 text-teal-600" />
            <span>Rainfall Harvesting Parameters</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-slate-900 tracking-tight">
            Rainwater Harvesting Calculator
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-1.5">
            Enter your roof dimensions, rainfall event, and tank capacity to measure captured volume versus overflow losses.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            
            {/* Input 1: Roof Length */}
            <div className="space-y-1.5">
              <label 
                htmlFor="input-roof-length" 
                className="block text-sm font-semibold text-slate-800 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-teal-700" />
                  Roof Length
                </span>
                <span className="text-xs font-medium text-slate-500">metres (m)</span>
              </label>
              <div className="relative group">
                <input
                  id="input-roof-length"
                  type="number"
                  step="any"
                  min="0.1"
                  placeholder="e.g., 15"
                  value={inputs.roofLength}
                  onChange={(e) => handleChange('roofLength', e.target.value)}
                  onBlur={() => handleBlur('roofLength')}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-slate-900 placeholder:text-slate-400 text-base transition-all duration-200 focus:bg-white focus:outline-none focus:ring-3 ${
                    errors.roofLength && touched.roofLength
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-slate-200 group-hover:border-slate-300 focus:border-teal-600 focus:ring-teal-600/15 group-hover:-translate-y-0.5'
                  }`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none font-medium">
                  m
                </span>
              </div>
              {errors.roofLength && touched.roofLength ? (
                <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.roofLength}</span>
                </p>
              ) : (
                <p className="text-[12px] text-slate-500">Overall horizontal length of the catchment area</p>
              )}
            </div>

            {/* Input 2: Roof Width */}
            <div className="space-y-1.5">
              <label 
                htmlFor="input-roof-width" 
                className="block text-sm font-semibold text-slate-800 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-teal-700" />
                  Roof Width
                </span>
                <span className="text-xs font-medium text-slate-500">metres (m)</span>
              </label>
              <div className="relative group">
                <input
                  id="input-roof-width"
                  type="number"
                  step="any"
                  min="0.1"
                  placeholder="e.g., 10"
                  value={inputs.roofWidth}
                  onChange={(e) => handleChange('roofWidth', e.target.value)}
                  onBlur={() => handleBlur('roofWidth')}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-slate-900 placeholder:text-slate-400 text-base transition-all duration-200 focus:bg-white focus:outline-none focus:ring-3 ${
                    errors.roofWidth && touched.roofWidth
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-slate-200 group-hover:border-slate-300 focus:border-teal-600 focus:ring-teal-600/15 group-hover:-translate-y-0.5'
                  }`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none font-medium">
                  m
                </span>
              </div>
              {errors.roofWidth && touched.roofWidth ? (
                <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.roofWidth}</span>
                </p>
              ) : (
                <p className="text-[12px] text-slate-500">
                  Combined roof area: <strong className="text-slate-700 font-semibold">{liveRoofArea} m²</strong>
                </p>
              )}
            </div>

            {/* Input 3: Rainfall (millimetres) */}
            <div className="space-y-1.5">
              <label 
                htmlFor="input-rainfall" 
                className="block text-sm font-semibold text-slate-800 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-teal-700" />
                  Rainfall Event or Period
                </span>
                <span className="text-xs font-medium text-slate-500">millimetres (mm)</span>
              </label>
              <div className="relative group">
                <input
                  id="input-rainfall"
                  type="number"
                  step="any"
                  min="0.1"
                  placeholder="e.g., 60"
                  value={inputs.rainfall}
                  onChange={(e) => handleChange('rainfall', e.target.value)}
                  onBlur={() => handleBlur('rainfall')}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-slate-900 placeholder:text-slate-400 text-base transition-all duration-200 focus:bg-white focus:outline-none focus:ring-3 ${
                    errors.rainfall && touched.rainfall
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-slate-200 group-hover:border-slate-300 focus:border-teal-600 focus:ring-teal-600/15 group-hover:-translate-y-0.5'
                  }`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none font-medium">
                  mm
                </span>
              </div>
              {errors.rainfall && touched.rainfall ? (
                <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.rainfall}</span>
                </p>
              ) : (
                <p className="text-[12px] text-slate-500">Total depth of rain (e.g. single storm or monthly total)</p>
              )}
            </div>

            {/* Input 4: Collection efficiency (%) — default 80%, editable */}
            <div className="space-y-1.5">
              <label 
                htmlFor="input-efficiency" 
                className="block text-sm font-semibold text-slate-800 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-teal-700" />
                  Collection Efficiency
                </span>
                <span className="text-xs font-medium text-slate-500">percentage (%)</span>
              </label>
              <div className="relative group">
                <input
                  id="input-efficiency"
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  placeholder="80"
                  value={inputs.efficiency}
                  onChange={(e) => handleChange('efficiency', e.target.value)}
                  onBlur={() => handleBlur('efficiency')}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-slate-900 placeholder:text-slate-400 text-base transition-all duration-200 focus:bg-white focus:outline-none focus:ring-3 ${
                    errors.efficiency && touched.efficiency
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-slate-200 group-hover:border-slate-300 focus:border-teal-600 focus:ring-teal-600/15 group-hover:-translate-y-0.5'
                  }`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none font-medium">
                  %
                </span>
              </div>
              {errors.efficiency && touched.efficiency ? (
                <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.efficiency}</span>
                </p>
              ) : (
                <div className="flex items-center justify-between text-[12px] text-slate-500">
                  <span>Default 80% (accounts for filter loss & splash)</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleChange('efficiency', '75')}
                      className="px-1.5 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700"
                      title="Tile roof with gutter guards"
                    >
                      75%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('efficiency', '80')}
                      className="px-1.5 py-0.5 rounded text-[11px] bg-teal-100/70 hover:bg-teal-200 text-teal-900 font-semibold"
                      title="Standard default"
                    >
                      80%
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('efficiency', '90')}
                      className="px-1.5 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700"
                      title="Corrugated iron/metal roof"
                    >
                      90%
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Input 5: Storage tank capacity (litres) */}
            <div className="space-y-1.5">
              <label 
                htmlFor="input-tank-capacity" 
                className="block text-sm font-semibold text-slate-800 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Container className="w-4 h-4 text-teal-700" />
                  Storage Tank Capacity
                </span>
                <span className="text-xs font-medium text-slate-500">litres (L)</span>
              </label>
              <div className="relative group">
                <input
                  id="input-tank-capacity"
                  type="number"
                  step="any"
                  min="1"
                  placeholder="e.g., 5000"
                  value={inputs.tankCapacity}
                  onChange={(e) => handleChange('tankCapacity', e.target.value)}
                  onBlur={() => handleBlur('tankCapacity')}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-slate-900 placeholder:text-slate-400 text-base transition-all duration-200 focus:bg-white focus:outline-none focus:ring-3 ${
                    errors.tankCapacity && touched.tankCapacity
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-slate-200 group-hover:border-slate-300 focus:border-teal-600 focus:ring-teal-600/15 group-hover:-translate-y-0.5'
                  }`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none font-medium">
                  L
                </span>
              </div>
              {errors.tankCapacity && touched.tankCapacity ? (
                <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.tankCapacity}</span>
                </p>
              ) : (
                <p className="text-[12px] text-slate-500">Maximum reservoir size available for collecting</p>
              )}
            </div>

            {/* Input 6: Optional: Daily water requirement (litres) */}
            <div className="space-y-1.5">
              <label 
                htmlFor="input-daily-requirement" 
                className="block text-sm font-semibold text-slate-800 flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-700" />
                  Daily Water Requirement <span className="text-xs font-normal text-slate-400">(optional)</span>
                </span>
                <span className="text-xs font-medium text-slate-500">L / day</span>
              </label>
              <div className="relative group">
                <input
                  id="input-daily-requirement"
                  type="number"
                  step="any"
                  min="0.1"
                  placeholder="e.g., 250 (household or garden)"
                  value={inputs.dailyRequirement}
                  onChange={(e) => handleChange('dailyRequirement', e.target.value)}
                  onBlur={() => handleBlur('dailyRequirement')}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-50/80 border text-slate-900 placeholder:text-slate-400 text-base transition-all duration-200 focus:bg-white focus:outline-none focus:ring-3 ${
                    errors.dailyRequirement && touched.dailyRequirement
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                      : 'border-slate-200 group-hover:border-slate-300 focus:border-teal-600 focus:ring-teal-600/15 group-hover:-translate-y-0.5'
                  }`}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none font-medium">
                  L/day
                </span>
              </div>
              {errors.dailyRequirement && touched.dailyRequirement ? (
                <p className="text-xs text-rose-600 flex items-center gap-1 mt-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{errors.dailyRequirement}</span>
                </p>
              ) : (
                <p className="text-[12px] text-slate-500">Used to estimate how many days your harvested water will last</p>
              )}
            </div>

          </div>

          {/* Quick live preview summary banner */}
          {liveHarvestable > 0 && (
            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 mb-8 flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 flex-shrink-0" />
                <span>
                  Estimated catch: <strong className="text-teal-950 font-bold">{liveHarvestable.toLocaleString()} Litres</strong> harvestable
                </span>
              </div>
              <div className="text-slate-500">
                Formula: {liveRoofArea}m² × {inputs.rainfall || '0'}mm × {(parseFloat(inputs.efficiency) || 80)}%
              </div>
            </div>
          )}

          {/* Action Button: Calculate with Ripple / Water fill loading effect */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-400" />
              <span>Calculates potential, actually harvested, and wasted overflow litres.</span>
            </div>

            <button
              id="calc-submit-btn"
              type="submit"
              disabled={isCalculating}
              className="relative w-full sm:w-auto overflow-hidden px-8 py-4 rounded-2xl font-semibold text-white bg-teal-800 hover:bg-teal-900 active:bg-teal-950 shadow-md shadow-teal-900/20 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-80"
            >
              {isCalculating ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing Water Flow...</span>
                  {/* Water fill animation effect */}
                  <span 
                    className="absolute inset-0 bg-teal-600/50 pointer-events-none"
                    style={{ animation: 'waterFill 0.5s ease-out forwards' }}
                  />
                </>
              ) : (
                <>
                  <span>Calculate Harvesting Results</span>
                  <Droplets className="w-5 h-5 text-teal-200 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
