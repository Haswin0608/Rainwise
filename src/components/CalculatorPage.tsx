import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Droplet, Plus, Trash2, Info, Layers, Save } from 'lucide-react';
import { CalculatorInputs, FormErrors, PresetScenario, RoofSection, AuthUser, SavedBuilding, FullWeatherData, UnitSystem } from '../types';
import { validateInputs, PRESET_SCENARIOS } from '../utils/calculations';
import { StepperNumberInput } from './StepperNumberInput';
import { WeatherLocationSection } from './WeatherLocationSection';
import { useAppSettings } from '../context/AppSettingsContext';
import { convertInputs, mmToInches } from '../utils/units';

interface CalculatorPageProps {
  inputs: CalculatorInputs;
  onChange: (inputs: CalculatorInputs) => void;
  onCalculate: () => void;
  onBack: () => void;
  isCalculating: boolean;
  currentUser: AuthUser | null;
  activeBuilding: SavedBuilding | null;
  onOpenSaveModal: () => void;
  onClearActiveBuilding?: () => void;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({
  inputs,
  onChange,
  onCalculate,
  onBack,
  isCalculating,
  currentUser,
  activeBuilding,
  onOpenSaveModal,
  onClearActiveBuilding,
}) => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { unit, setUnit, labels, formatArea, formatLength } = useAppSettings();

  const isImperial = unit === 'imperial';

  // Ensure there is always at least one roof
  const roofs: RoofSection[] = inputs.roofs && inputs.roofs.length > 0
    ? inputs.roofs
    : [{ id: '1', name: 'Roof 1', length: isImperial ? '50' : '15', width: isImperial ? '30' : '10' }];

  const handleUnitSwitch = (targetUnit: UnitSystem) => {
    if (targetUnit === unit) return;
    const converted = convertInputs(inputs, unit, targetUnit);
    setUnit(targetUnit);
    onChange(converted);
    setErrors({});
  };

  const handleRoofChange = (id: string, field: 'length' | 'width', value: string) => {
    const updatedRoofs = roofs.map((roof) =>
      roof.id === id ? { ...roof, [field]: value } : roof
    );
    const updatedInputs = { ...inputs, roofs: updatedRoofs };
    onChange(updatedInputs);

    const touchKey = `roof_${id}_${field}`;
    if (touched[touchKey]) {
      const validation = validateInputs(updatedInputs, unit);
      setErrors((prev) => ({
        ...prev,
        roofs: validation.errors.roofs,
      }));
    }
  };

  const handleRoofBlur = (id: string, field: 'length' | 'width') => {
    const touchKey = `roof_${id}_${field}`;
    setTouched((prev) => ({ ...prev, [touchKey]: true }));
    const validation = validateInputs(inputs, unit);
    setErrors((prev) => ({
      ...prev,
      roofs: validation.errors.roofs,
    }));
  };

  const handleAddRoof = () => {
    const newIndex = roofs.length + 1;
    const newRoof: RoofSection = {
      id: Date.now().toString(),
      name: `Roof ${newIndex}`,
      length: isImperial ? '30' : '10',
      width: isImperial ? '25' : '8',
    };
    const updatedInputs = { ...inputs, roofs: [...roofs, newRoof] };
    onChange(updatedInputs);
  };

  const handleRemoveRoof = (id: string) => {
    if (roofs.length <= 1) return;
    const updatedRoofs = roofs
      .filter((r) => r.id !== id)
      .map((r, idx) => ({ ...r, name: `Roof ${idx + 1}` }));
    const updatedInputs = { ...inputs, roofs: updatedRoofs };
    onChange(updatedInputs);

    const nextErrors = { ...errors };
    if (nextErrors.roofs) {
      delete nextErrors.roofs[id];
    }
    setErrors(nextErrors);
  };

  const handleSharedChange = (field: 'rainfall' | 'efficiency' | 'tankCapacity' | 'dailyRequirement', value: string) => {
    let updatedWeatherInfo = inputs.weatherInfo;
    if (field === 'rainfall') {
      if (inputs.weatherInfo) {
        const expectedStr = isImperial
          ? Number(mmToInches(inputs.weatherInfo.rainfallMm).toFixed(2)).toString()
          : String(inputs.weatherInfo.rainfallMm);
        const isStillAuto = expectedStr === value;
        updatedWeatherInfo = {
          ...inputs.weatherInfo,
          isAutoFetched: isStillAuto,
        };
      }
    }

    const updated = { ...inputs, [field]: value, weatherInfo: updatedWeatherInfo };
    onChange(updated);

    if (touched[field]) {
      const validation = validateInputs(updated, unit);
      setErrors((prev) => ({
        ...prev,
        [field]: validation.errors[field],
      }));
    }
  };

  const handleWeatherRainfallAutoFill = (rainfallMm: number, locationName: string, fullWeather: FullWeatherData) => {
    const rainfallVal = isImperial
      ? Number(mmToInches(rainfallMm).toFixed(2)).toString()
      : String(rainfallMm);

    const updated = {
      ...inputs,
      rainfall: rainfallVal,
      weatherInfo: {
        locationName,
        rainfallMm,
        dateStr: fullWeather.dateStr,
        isAutoFetched: true,
        latitude: fullWeather.latitude,
        longitude: fullWeather.longitude,
        fullWeather,
      },
    };
    onChange(updated);
    setErrors((prev) => ({ ...prev, rainfall: undefined }));
  };

  const handleSharedBlur = (field: 'rainfall' | 'efficiency' | 'tankCapacity' | 'dailyRequirement') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validation = validateInputs(inputs, unit);
    setErrors((prev) => ({
      ...prev,
      [field]: validation.errors[field],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allTouched: Record<string, boolean> = {
      rainfall: true,
      efficiency: true,
      tankCapacity: true,
      dailyRequirement: true,
    };
    roofs.forEach((r) => {
      allTouched[`roof_${r.id}_length`] = true;
      allTouched[`roof_${r.id}_width`] = true;
    });
    setTouched(allTouched);

    const validation = validateInputs(inputs, unit);
    setErrors(validation.errors);

    if (validation.isValid) {
      onCalculate();
    }
  };

  const applyPreset = (preset: PresetScenario) => {
    // Presets are authored in metric; convert if currently in imperial
    if (unit === 'imperial') {
      const converted = convertInputs(preset.inputs, 'metric', 'imperial');
      onChange(converted);
    } else {
      onChange(preset.inputs);
    }
    setErrors({});
    setTouched({});
  };

  // Live total roof area calculation
  const calculatedTotalArea = roofs.reduce((sum, r) => {
    const l = parseFloat(r.length) || 0;
    const w = parseFloat(r.width) || 0;
    return sum + l * w;
  }, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top Bar with Back, Unit Toggle, and Quick Presets */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          id="calc-back-btn"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white transition-colors px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Units Switch directly at top of Calculator page */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-2">Units:</span>
          <button
            type="button"
            id="calc-unit-metric-toggle"
            onClick={() => handleUnitSwitch('metric')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              unit === 'metric'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Metric (m, mm, L)
          </button>
          <button
            type="button"
            id="calc-unit-imperial-toggle"
            onClick={() => handleUnitSwitch('imperial')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              unit === 'imperial'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Imperial (ft, in, gal)
          </button>
        </div>

        {/* Quick Example Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mr-1">Quick examples:</span>
          {PRESET_SCENARIOS.map((p) => (
            <button
              key={p.id}
              type="button"
              id={`calc-preset-chip-${p.id}`}
              onClick={() => applyPreset(p)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-teal-700 hover:text-teal-900 dark:hover:text-teal-300 transition-all font-semibold shadow-2xs cursor-pointer"
            >
              {p.icon} {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        
        {/* Form Title & Introduction + Save This Building action */}
        <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-slate-900 dark:text-white">
              Rainwater Calculator
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1">
              Fill in your roof measurements and local rainfall to see how much rain you can save.
            </p>
          </div>

          {/* "Save This Building" button */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              id="calc-save-building-btn"
              onClick={onOpenSaveModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 font-bold text-sm shadow-2xs hover:shadow-xs transition-all cursor-pointer min-h-[44px]"
            >
              <Save className="w-4 h-4 text-teal-700 dark:text-teal-400" />
              <span>💾 Save This Building</span>
            </button>
          </div>
        </div>

        {/* Active Loaded Building Banner if a building was loaded from saved list */}
        {activeBuilding && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-teal-300/70 dark:border-teal-700 text-slate-800 dark:text-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🏡</span>
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wide text-teal-700 dark:text-teal-400 block">
                  Currently Loaded Building:
                </span>
                <span className="font-bold text-base text-slate-900 dark:text-white">
                  {activeBuilding.nickname}
                </span>
                {activeBuilding.locationLabel && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">
                    ({activeBuilding.locationLabel})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="calc-update-saved-building-btn"
                onClick={onOpenSaveModal}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-teal-700 text-white hover:bg-teal-800 transition cursor-pointer"
              >
                Update Building
              </button>
              {onClearActiveBuilding && (
                <button
                  type="button"
                  id="calc-clear-active-building-btn"
                  onClick={onClearActiveBuilding}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Unlink
                </button>
              )}
            </div>
          </div>
        )}

        {/* Weather & Location Section (Track vs. Type + Today's Weather + 7-Day Outlook) */}
        <div id="weather-location-section" className="mb-7">
          <WeatherLocationSection
            currentRainfallValue={inputs.rainfall}
            onRainfallAutoFill={handleWeatherRainfallAutoFill}
          />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-7">
          
          {/* ═══════════════════════════════════════
              ROOF SECTIONS (MULTIPLE ROOFS SUPPORT)
              ═══════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏠</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-['Outfit',sans-serif] text-slate-900 dark:text-white">
                    Roof Measurements
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    Add each roof or building section that catches rainwater
                  </p>
                </div>
              </div>

              {roofs.length > 1 && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 rounded-full">
                  {roofs.length} roofs added
                </span>
              )}
            </div>

            {/* List of Roof Blocks with smooth animation */}
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {roofs.map((roof, index) => {
                  const roofArea = (parseFloat(roof.length) || 0) * (parseFloat(roof.width) || 0);
                  const lengthError = touched[`roof_${roof.id}_length`]
                    ? errors.roofs?.[roof.id]?.length
                    : undefined;
                  const widthError = touched[`roof_${roof.id}_width`]
                    ? errors.roofs?.[roof.id]?.width
                    : undefined;

                  return (
                    <motion.div
                      key={roof.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 shadow-2xs space-y-4"
                    >
                      {/* Roof Header: Name + Optional Remove Button */}
                      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-base">
                            {roof.name || `Roof ${index + 1}`}
                          </span>
                          {roofArea > 0 && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                              {roofArea.toFixed(1)} {isImperial ? 'sq ft' : 'm²'}
                            </span>
                          )}
                        </div>

                        {/* Remove (×) Button — don't allow removing Roof 1 */}
                        {index > 0 && (
                          <button
                            type="button"
                            id={`remove-roof-${roof.id}`}
                            onClick={() => handleRemoveRoof(roof.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200/60 dark:border-rose-800 transition-colors cursor-pointer"
                            aria-label={`Remove ${roof.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {/* Roof Inputs: Length & Width with same style and steppers */}
                      <div className="space-y-4">
                        <StepperNumberInput
                          id={`input-roof-${roof.id}-length`}
                          label={`${roof.name} length`}
                          unit={`in ${labels.length}`}
                          helperText="Measure the longer side of this roof"
                          value={roof.length}
                          onChange={(val) => handleRoofChange(roof.id, 'length', val)}
                          onBlur={() => handleRoofBlur(roof.id, 'length')}
                          step={isImperial ? 5 : 1}
                          min={0.5}
                          placeholder={isImperial ? '50' : '15'}
                          error={lengthError}
                          icon="📏"
                          quickChips={isImperial ? [
                            { label: '25 ft', value: '25' },
                            { label: '40 ft', value: '40' },
                            { label: '50 ft', value: '50' },
                          ] : [
                            { label: '8m', value: '8' },
                            { label: '12m', value: '12' },
                            { label: '15m', value: '15' },
                          ]}
                        />

                        <StepperNumberInput
                          id={`input-roof-${roof.id}-width`}
                          label={`${roof.name} width`}
                          unit={`in ${labels.length}`}
                          helperText="Measure the shorter side of this roof"
                          value={roof.width}
                          onChange={(val) => handleRoofChange(roof.id, 'width', val)}
                          onBlur={() => handleRoofBlur(roof.id, 'width')}
                          step={isImperial ? 5 : 1}
                          min={0.5}
                          placeholder={isImperial ? '30' : '10'}
                          error={widthError}
                          icon="📐"
                          quickChips={isImperial ? [
                            { label: '20 ft', value: '20' },
                            { label: '25 ft', value: '25' },
                            { label: '30 ft', value: '30' },
                          ] : [
                            { label: '6m', value: '6' },
                            { label: '8m', value: '8' },
                            { label: '10m', value: '10' },
                          ]}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* "+ Add Another Roof" Button */}
            <button
              type="button"
              id="add-roof-btn"
              onClick={handleAddRoof}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-dashed border-teal-700/60 dark:border-teal-500/60 text-teal-800 dark:text-teal-300 hover:bg-teal-50/70 dark:hover:bg-slate-800 font-bold text-sm sm:text-base transition-all cursor-pointer min-h-[50px]"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>+ Add Another Roof</span>
            </button>

            {/* Live Combined Roof Area Badge */}
            {calculatedTotalArea > 0 && (
              <div className="p-3.5 rounded-xl bg-teal-50/90 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-950 dark:text-teal-200 flex items-center justify-between text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-700 dark:text-teal-400 shrink-0" />
                  <span>
                    Total Combined Roof Area: <strong>{calculatedTotalArea.toFixed(1)} {isImperial ? 'sq ft' : 'm²'}</strong>
                  </span>
                </div>
                <span className="text-xs text-teal-700 dark:text-teal-400 font-normal">
                  ({roofs.length} {roofs.length === 1 ? 'roof section' : 'roof sections'})
                </span>
              </div>
            )}
          </div>

          <hr className="border-slate-200/80 dark:border-slate-800 my-2" />

          {/* ═══════════════════════════════════════
              SHARED PROPERTY INPUTS
              ═══════════════════════════════════════ */}
          
          {/* Field: Rainfall */}
          <StepperNumberInput
            id="input-rainfall"
            label="Rainfall"
            unit={`in ${labels.rainfall}`}
            helperText="How much rain fell? (Auto-filled from weather, or check your rain gauge)"
            value={inputs.rainfall}
            onChange={(val) => handleSharedChange('rainfall', val)}
            onBlur={() => handleSharedBlur('rainfall')}
            step={isImperial ? 0.2 : 5}
            min={0}
            placeholder={isImperial ? '2.0' : '50'}
            error={touched.rainfall ? errors.rainfall : undefined}
            icon="🌧️"
            headerAction={
              inputs.weatherInfo ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/90 dark:border-teal-800 px-3 py-1.5 rounded-xl shadow-2xs">
                  <span>📍</span>
                  <span className="truncate max-w-[140px] sm:max-w-[220px]">{inputs.weatherInfo.locationName}</span>
                </div>
              ) : (
                <button
                  type="button"
                  id="check-today-rainfall-btn"
                  onClick={() => {
                    const el = document.getElementById('weather-location-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-300/90 dark:border-teal-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer min-h-[38px]"
                >
                  <span>📍</span>
                  <span>Set Location in Weather Card</span>
                </button>
              )
            }
            footerNote={
              inputs.weatherInfo ? (
                <div className="mt-2.5 p-3 rounded-xl bg-teal-50/80 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-xs sm:text-sm text-teal-950 dark:text-teal-200 flex items-start gap-2.5">
                  <span className="text-base shrink-0">ℹ️</span>
                  <p className="leading-relaxed">
                    Rainfall auto-filled from today&apos;s weather for <strong>{inputs.weatherInfo.locationName}</strong> on {inputs.weatherInfo.dateStr}. You can adjust this if your own rain gauge shows a different amount.
                  </p>
                </div>
              ) : null
            }
            quickChips={isImperial ? [
              { label: '1.0 in (light)', value: '1.0' },
              { label: '2.0 in (steady)', value: '2.0' },
              { label: '3.0 in (heavy)', value: '3.0' },
            ] : [
              { label: '25mm (light)', value: '25' },
              { label: '50mm (steady)', value: '50' },
              { label: '80mm (heavy)', value: '80' },
            ]}
          />

          {/* Field: Collection efficiency */}
          <StepperNumberInput
            id="input-efficiency"
            label="Collection efficiency"
            unit="in %"
            helperText="Some water is always lost — 80% is a safe average, you can change this if you know better"
            value={inputs.efficiency}
            onChange={(val) => handleSharedChange('efficiency', val)}
            onBlur={() => handleSharedBlur('efficiency')}
            step={5}
            min={10}
            max={100}
            placeholder="80"
            error={touched.efficiency ? errors.efficiency : undefined}
            icon="♻️"
            quickChips={[
              { label: '75% (tile)', value: '75' },
              { label: '80% (standard)', value: '80' },
              { label: '90% (metal/tin)', value: '90' },
            ]}
          />

          {/* Field: Tank size */}
          <StepperNumberInput
            id="input-tank-capacity"
            label="Tank size"
            unit={`in ${labels.volume}`}
            helperText="How much water can your storage tank hold?"
            value={inputs.tankCapacity}
            onChange={(val) => handleSharedChange('tankCapacity', val)}
            onBlur={() => handleSharedBlur('tankCapacity')}
            step={isImperial ? 250 : 500}
            min={isImperial ? 25 : 100}
            placeholder={isImperial ? '1300' : '5000'}
            error={touched.tankCapacity ? errors.tankCapacity : undefined}
            icon="🛢️"
            quickChips={isImperial ? [
              { label: '250 gal', value: '250' },
              { label: '500 gal', value: '500' },
              { label: '1,300 gal', value: '1300' },
              { label: '2,500 gal', value: '2500' },
            ] : [
              { label: '1,000L', value: '1000' },
              { label: '2,000L', value: '2000' },
              { label: '5,000L', value: '5000' },
              { label: '10,000L', value: '10000' },
            ]}
          />

          {/* Field: Daily water need (optional) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <StepperNumberInput
              id="input-daily-requirement"
              label="Daily water need"
              unit={`in ${labels.volume} (optional)`}
              helperText="Roughly how much water do you use per day? (optional)"
              value={inputs.dailyRequirement}
              onChange={(val) => handleSharedChange('dailyRequirement', val)}
              onBlur={() => handleSharedBlur('dailyRequirement')}
              step={isImperial ? 10 : 25}
              min={0}
              placeholder={isImperial ? '50' : '200'}
              error={touched.dailyRequirement ? errors.dailyRequirement : undefined}
              icon="📅"
              quickChips={isImperial ? [
                { label: '25 gal/day', value: '25' },
                { label: '50 gal/day', value: '50' },
                { label: '90 gal/day', value: '90' },
              ] : [
                { label: '100 L/day', value: '100' },
                { label: '200 L/day', value: '200' },
                { label: '350 L/day', value: '350' },
              ]}
            />
          </div>

          {/* Bottom Action with Loading Animation */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
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
