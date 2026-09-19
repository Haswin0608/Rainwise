import React, { useState } from 'react';
import { ArrowLeft, Droplet, Check, Info } from 'lucide-react';
import { CalculatorInputs, FormErrors, PresetScenario } from '../types';
import { validateInputs, PRESET_SCENARIOS } from '../utils/calculations';
import { StepperNumberInput } from './StepperNumberInput';

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
  const liveRoofArea = numLength > 0 && numWidth > 0 ? (numLength * numWidth).toFixed(1) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top Bar with Back and Quick Presets */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          id="calc-back-btn"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-base font-semibold text-slate-700 hover:text-slate-950 transition-colors px-3 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Quick Example Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 font-medium mr-1">Quick examples:</span>
          {PRESET_SCENARIOS.map((p) => (
            <button
              key={p.id}
              type="button"
              id={`calc-preset-chip-${p.id}`}
              onClick={() => applyPreset(p)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-teal-700 hover:text-teal-900 transition-all font-semibold shadow-2xs"
            >
              {p.icon} {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        
        {/* Form Title & Extension-Worker Style Introduction */}
        <div className="mb-8 border-b border-slate-100 pb-5">
          <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-slate-900">
            Rainwater Calculator
          </h2>
          <p className="text-slate-600 text-base mt-1">
            Fill in the measurements below to see how much rain you can save in your tank.
          </p>
        </div>

        {/* Form Fields with Large Steppers */}
        <form onSubmit={handleSubmit} noValidate className="space-y-6 sm:space-y-7">
          
          {/* Field 1: Roof length */}
          <StepperNumberInput
            id="input-roof-length"
            label="Roof length"
            unit="in metres"
            helperText="Measure the longer side of your roof"
            value={inputs.roofLength}
            onChange={(val) => handleChange('roofLength', val)}
            onBlur={() => handleBlur('roofLength')}
            step={1}
            min={0.5}
            placeholder="15"
            error={touched.roofLength ? errors.roofLength : undefined}
            icon="📏"
            quickChips={[
              { label: '8m', value: '8' },
              { label: '12m', value: '12' },
              { label: '15m', value: '15' },
              { label: '20m', value: '20' },
            ]}
          />

          {/* Field 2: Roof width */}
          <StepperNumberInput
            id="input-roof-width"
            label="Roof width"
            unit="in metres"
            helperText="Measure the shorter side of your roof"
            value={inputs.roofWidth}
            onChange={(val) => handleChange('roofWidth', val)}
            onBlur={() => handleBlur('roofWidth')}
            step={1}
            min={0.5}
            placeholder="10"
            error={touched.roofWidth ? errors.roofWidth : undefined}
            icon="📐"
            quickChips={[
              { label: '6m', value: '6' },
              { label: '8m', value: '8' },
              { label: '10m', value: '10' },
              { label: '14m', value: '14' },
            ]}
          />

          {/* Live Calculated Roof Area badge if both entered */}
          {liveRoofArea && (
            <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200 text-teal-950 flex items-center gap-2 text-sm font-semibold">
              <span className="text-lg">🏠</span>
              <span>Your total roof size is approximately <strong>{liveRoofArea} m²</strong></span>
            </div>
          )}

          {/* Field 3: Rainfall */}
          <StepperNumberInput
            id="input-rainfall"
            label="Rainfall"
            unit="in mm"
            helperText="How much rain fell? (Check local weather report or rain gauge)"
            value={inputs.rainfall}
            onChange={(val) => handleChange('rainfall', val)}
            onBlur={() => handleBlur('rainfall')}
            step={5}
            min={1}
            placeholder="60"
            error={touched.rainfall ? errors.rainfall : undefined}
            icon="🌧️"
            quickChips={[
              { label: '25mm (light rain)', value: '25' },
              { label: '50mm (steady rain)', value: '50' },
              { label: '80mm (heavy rain)', value: '80' },
            ]}
          />

          {/* Field 4: Collection efficiency */}
          <StepperNumberInput
            id="input-efficiency"
            label="Collection efficiency"
            unit="in %"
            helperText="Some water is always lost — 80% is a safe average, you can change this if you know better"
            value={inputs.efficiency}
            onChange={(val) => handleChange('efficiency', val)}
            onBlur={() => handleBlur('efficiency')}
            step={5}
            min={10}
            max={100}
            placeholder="80"
            error={touched.efficiency ? errors.efficiency : undefined}
            icon="♻️"
            quickChips={[
              { label: '75% (tile roof)', value: '75' },
              { label: '80% (standard)', value: '80' },
              { label: '90% (metal/tin roof)', value: '90' },
            ]}
          />

          {/* Field 5: Tank size */}
          <StepperNumberInput
            id="input-tank-capacity"
            label="Tank size"
            unit="in litres"
            helperText="How much water can your storage tank hold?"
            value={inputs.tankCapacity}
            onChange={(val) => handleChange('tankCapacity', val)}
            onBlur={() => handleBlur('tankCapacity')}
            step={500}
            min={100}
            placeholder="5000"
            error={touched.tankCapacity ? errors.tankCapacity : undefined}
            icon="🛢️"
            quickChips={[
              { label: '1,000L', value: '1000' },
              { label: '2,000L', value: '2000' },
              { label: '5,000L', value: '5000' },
              { label: '10,000L', value: '10000' },
            ]}
          />

          {/* Field 6: Daily water need (optional) */}
          <div className="pt-2 border-t border-slate-100">
            <StepperNumberInput
              id="input-daily-requirement"
              label="Daily water need"
              unit="in litres (optional)"
              helperText="Roughly how much water do you use per day? (optional)"
              value={inputs.dailyRequirement}
              onChange={(val) => handleChange('dailyRequirement', val)}
              onBlur={() => handleBlur('dailyRequirement')}
              step={25}
              min={0}
              placeholder="e.g. 200"
              error={touched.dailyRequirement ? errors.dailyRequirement : undefined}
              icon="📅"
              quickChips={[
                { label: '100 L/day', value: '100' },
                { label: '200 L/day', value: '200' },
                { label: '350 L/day', value: '350' },
              ]}
            />
          </div>

          {/* Bottom Action with Loading Animation */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Actual water collected may vary depending on your roof and pipes.</span>
            </p>

            <button
              id="calc-submit-btn"
              type="submit"
              disabled={isCalculating}
              className="w-full sm:w-auto relative min-h-[58px] px-8 py-4 rounded-2xl font-bold text-lg text-white bg-teal-800 hover:bg-teal-900 active:bg-teal-950 shadow-md shadow-teal-900/20 hover:shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-90 overflow-hidden"
            >
              {isCalculating ? (
                <div className="flex items-center gap-3">
                  {/* Water drop filling loading animation */}
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <Droplet className="w-6 h-6 text-teal-300 animate-pulse" />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-white">
                      💧
                    </span>
                  </div>
                  <span>Checking Water...</span>
                </div>
              ) : (
                <>
                  <span>Calculate</span>
                  <Droplet className="w-5 h-5 text-teal-200 fill-teal-200" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
