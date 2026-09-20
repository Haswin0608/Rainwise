import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Droplet, Plus, Trash2, Info, Layers, Loader2 } from 'lucide-react';
import { CalculatorInputs, FormErrors, PresetScenario, RoofSection } from '../types';
import { validateInputs, PRESET_SCENARIOS } from '../utils/calculations';
import { StepperNumberInput } from './StepperNumberInput';
import { CitySearchModal } from './CitySearchModal';
import { reverseGeocodeCoords, fetchRainfallFromOpenMeteo, CitySearchResult } from '../utils/weather';

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
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [showCityModal, setShowCityModal] = useState(false);

  // Ensure there is always at least one roof
  const roofs: RoofSection[] = inputs.roofs && inputs.roofs.length > 0
    ? inputs.roofs
    : [{ id: '1', name: 'Roof 1', length: '15', width: '10' }];

  const handleRoofChange = (id: string, field: 'length' | 'width', value: string) => {
    const updatedRoofs = roofs.map((roof) =>
      roof.id === id ? { ...roof, [field]: value } : roof
    );
    const updatedInputs = { ...inputs, roofs: updatedRoofs };
    onChange(updatedInputs);

    const touchKey = `roof_${id}_${field}`;
    if (touched[touchKey]) {
      const validation = validateInputs(updatedInputs);
      setErrors((prev) => ({
        ...prev,
        roofs: validation.errors.roofs,
      }));
    }
  };

  const handleRoofBlur = (id: string, field: 'length' | 'width') => {
    const touchKey = `roof_${id}_${field}`;
    setTouched((prev) => ({ ...prev, [touchKey]: true }));
    const validation = validateInputs(inputs);
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
      length: '10',
      width: '8',
    };
    const updatedInputs = { ...inputs, roofs: [...roofs, newRoof] };
    onChange(updatedInputs);
  };

  const handleRemoveRoof = (id: string) => {
    if (roofs.length <= 1) return; // Don't allow removing Roof 1
    const updatedRoofs = roofs
      .filter((r) => r.id !== id)
      .map((r, idx) => ({ ...r, name: `Roof ${idx + 1}` })); // keep Roof 1, Roof 2 sequence clear
    const updatedInputs = { ...inputs, roofs: updatedRoofs };
    onChange(updatedInputs);

    // Clean up touched & errors for deleted roof
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
        const isStillAuto = String(inputs.weatherInfo.rainfallMm) === value;
        updatedWeatherInfo = {
          ...inputs.weatherInfo,
          isAutoFetched: isStillAuto,
        };
      }
      setWeatherError(null);
    }

    const updated = { ...inputs, [field]: value, weatherInfo: updatedWeatherInfo };
    onChange(updated);

    if (touched[field]) {
      const validation = validateInputs(updated);
      setErrors((prev) => ({
        ...prev,
        [field]: validation.errors[field],
      }));
    }
  };

  const handleCheckRainfall = () => {
    setWeatherError(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setShowCityModal(true);
      return;
    }

    setIsFetchingWeather(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const locationName = await reverseGeocodeCoords(latitude, longitude);
          const result = await fetchRainfallFromOpenMeteo(latitude, longitude, locationName);

          const updated = {
            ...inputs,
            rainfall: String(result.rainfallMm),
            weatherInfo: {
              locationName: result.locationName,
              rainfallMm: result.rainfallMm,
              dateStr: result.dateStr,
              isAutoFetched: true,
            },
          };
          onChange(updated);
          setErrors((prev) => ({ ...prev, rainfall: undefined }));
          setWeatherError(null);
        } catch {
          // Do not fabricate rainfall numbers if the API fails — leave the field blank for manual entry instead
          setWeatherError("Couldn't fetch rainfall automatically — please enter it manually");
        } finally {
          setIsFetchingWeather(false);
        }
      },
      () => {
        // Geolocation denied, unavailable, or error -> show city search fallback
        setIsFetchingWeather(false);
        setShowCityModal(true);
      },
      {
        enableHighAccuracy: false,
        timeout: 9000,
        maximumAge: 300000,
      }
    );
  };

  const handleCitySelected = async (city: CitySearchResult) => {
    setShowCityModal(false);
    setIsFetchingWeather(true);
    setWeatherError(null);

    try {
      const locName = [city.name, city.admin1, city.country].filter(Boolean).slice(0, 2).join(', ');
      const result = await fetchRainfallFromOpenMeteo(city.latitude, city.longitude, locName);

      const updated = {
        ...inputs,
        rainfall: String(result.rainfallMm),
        weatherInfo: {
          locationName: result.locationName,
          rainfallMm: result.rainfallMm,
          dateStr: result.dateStr,
          isAutoFetched: true,
        },
      };
      onChange(updated);
      setErrors((prev) => ({ ...prev, rainfall: undefined }));
      setWeatherError(null);
    } catch {
      setWeatherError("Couldn't fetch rainfall automatically — please enter it manually");
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const handleEnterManually = () => {
    setShowCityModal(false);
    setWeatherError("Couldn't fetch rainfall automatically — please enter it manually");
  };

  const handleSharedBlur = (field: 'rainfall' | 'efficiency' | 'tankCapacity' | 'dailyRequirement') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const validation = validateInputs(inputs);
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

  // Live total roof area calculation
  const calculatedTotalArea = roofs.reduce((sum, r) => {
    const l = parseFloat(r.length) || 0;
    const w = parseFloat(r.width) || 0;
    return sum + l * w;
  }, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top Bar with Back and Quick Presets */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          id="calc-back-btn"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-base font-semibold text-slate-700 hover:text-slate-950 transition-colors px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-2xs cursor-pointer min-h-[44px]"
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
              className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-teal-700 hover:text-teal-900 transition-all font-semibold shadow-2xs cursor-pointer"
            >
              {p.icon} {p.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        
        {/* Form Title & Introduction */}
        <div className="mb-6 border-b border-slate-100 pb-5">
          <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-slate-900">
            Rainwater Calculator
          </h2>
          <p className="text-slate-600 text-base mt-1">
            Fill in your roof measurements and local rainfall to see how much rain you can save.
          </p>
        </div>

        {/* Mini weather summary near top once location is fetched */}
        {inputs.weatherInfo && (
          <div className="mb-6 p-4 rounded-2xl bg-teal-50/90 border border-teal-200 text-teal-950 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5 flex-wrap text-sm sm:text-base font-bold">
              <span className="text-xl">📍</span>
              <span className="text-teal-950">{inputs.weatherInfo.locationName}</span>
              <span className="text-teal-400 font-normal">—</span>
              <span className="text-teal-900 flex items-center gap-1.5">
                <span>🌧️ Rain Today:</span>
                <strong className="text-lg font-extrabold text-teal-950 font-['Outfit',sans-serif]">
                  {inputs.weatherInfo.rainfallMm} mm
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-teal-200 text-teal-800">
                {inputs.weatherInfo.dateStr}
              </span>
              <button
                type="button"
                id="calc-recheck-rainfall-top-btn"
                onClick={handleCheckRainfall}
                disabled={isFetchingWeather}
                className="text-xs font-bold text-teal-800 hover:text-teal-950 underline cursor-pointer"
              >
                {isFetchingWeather ? 'Checking...' : 'Check Again'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-7">
          
          {/* ═══════════════════════════════════════
              ROOF SECTIONS (MULTIPLE ROOFS SUPPORT)
              ═══════════════════════════════════════ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏠</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-['Outfit',sans-serif] text-slate-900">
                    Roof Measurements
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Add each roof or building section that catches rainwater
                  </p>
                </div>
              </div>

              {roofs.length > 1 && (
                <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200/80 rounded-full">
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
                      className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 shadow-2xs space-y-4"
                    >
                      {/* Roof Header: Name + Optional Remove Button */}
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-base">
                            {roof.name || `Roof ${index + 1}`}
                          </span>
                          {roofArea > 0 && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                              {roofArea.toFixed(1)} m²
                            </span>
                          )}
                        </div>

                        {/* Remove (×) Button — don't allow removing Roof 1 */}
                        {index > 0 && (
                          <button
                            type="button"
                            id={`remove-roof-${roof.id}`}
                            onClick={() => handleRemoveRoof(roof.id)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200/60 transition-colors cursor-pointer"
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
                          unit="in metres"
                          helperText="Measure the longer side of this roof"
                          value={roof.length}
                          onChange={(val) => handleRoofChange(roof.id, 'length', val)}
                          onBlur={() => handleRoofBlur(roof.id, 'length')}
                          step={1}
                          min={0.5}
                          placeholder="15"
                          error={lengthError}
                          icon="📏"
                          quickChips={[
                            { label: '8m', value: '8' },
                            { label: '12m', value: '12' },
                            { label: '15m', value: '15' },
                          ]}
                        />

                        <StepperNumberInput
                          id={`input-roof-${roof.id}-width`}
                          label={`${roof.name} width`}
                          unit="in metres"
                          helperText="Measure the shorter side of this roof"
                          value={roof.width}
                          onChange={(val) => handleRoofChange(roof.id, 'width', val)}
                          onBlur={() => handleRoofBlur(roof.id, 'width')}
                          step={1}
                          min={0.5}
                          placeholder="10"
                          error={widthError}
                          icon="📐"
                          quickChips={[
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

            {/* "+ Add Another Roof" Button — directly below last roof block */}
            <button
              type="button"
              id="add-roof-btn"
              onClick={handleAddRoof}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-dashed border-teal-700/60 text-teal-800 hover:bg-teal-50/70 hover:border-teal-700 font-bold text-sm sm:text-base transition-all cursor-pointer min-h-[50px]"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>+ Add Another Roof</span>
            </button>

            {/* Live Combined Roof Area Badge */}
            {calculatedTotalArea > 0 && (
              <div className="p-3.5 rounded-xl bg-teal-50/90 border border-teal-200 text-teal-950 flex items-center justify-between text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>
                    Total Combined Roof Area: <strong>{calculatedTotalArea.toFixed(1)} m²</strong>
                  </span>
                </div>
                <span className="text-xs text-teal-700 font-normal">
                  ({roofs.length} {roofs.length === 1 ? 'roof section' : 'roof sections'})
                </span>
              </div>
            )}
          </div>

          <hr className="border-slate-200/80 my-2" />

          {/* ═══════════════════════════════════════
              SHARED PROPERTY INPUTS
              ═══════════════════════════════════════ */}
          
          {/* Field: Rainfall */}
          <StepperNumberInput
            id="input-rainfall"
            label="Rainfall"
            unit="in mm"
            helperText="How much rain fell? (Auto-filled from weather, or check your rain gauge)"
            value={inputs.rainfall}
            onChange={(val) => handleSharedChange('rainfall', val)}
            onBlur={() => handleSharedBlur('rainfall')}
            step={5}
            min={0}
            placeholder="60"
            error={touched.rainfall ? errors.rainfall : undefined}
            icon="🌧️"
            headerAction={
              <button
                type="button"
                id="check-today-rainfall-btn"
                onClick={handleCheckRainfall}
                disabled={isFetchingWeather}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 active:bg-teal-200 border border-teal-300/90 px-3 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer min-h-[38px]"
              >
                {isFetchingWeather ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-teal-700" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    <span>Check Today&apos;s Rainfall</span>
                  </>
                )}
              </button>
            }
            footerNote={
              inputs.weatherInfo ? (
                <div className="mt-2.5 p-3 rounded-xl bg-teal-50/80 border border-teal-200 text-xs sm:text-sm text-teal-950 flex items-start gap-2.5">
                  <span className="text-base shrink-0">ℹ️</span>
                  <p className="leading-relaxed">
                    Rainfall auto-filled from weather data for <strong>{inputs.weatherInfo.locationName}</strong> on {inputs.weatherInfo.dateStr}. You can edit this if your own rain gauge shows a different amount.
                  </p>
                </div>
              ) : weatherError ? (
                <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-900 flex items-start gap-2.5">
                  <span className="text-base shrink-0">⚠️</span>
                  <p className="leading-relaxed">
                    {weatherError}
                  </p>
                </div>
              ) : null
            }
            quickChips={[
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
            unit="in litres"
            helperText="How much water can your storage tank hold?"
            value={inputs.tankCapacity}
            onChange={(val) => handleSharedChange('tankCapacity', val)}
            onBlur={() => handleSharedBlur('tankCapacity')}
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

          {/* Field: Daily water need (optional) */}
          <div className="pt-2 border-t border-slate-100">
            <StepperNumberInput
              id="input-daily-requirement"
              label="Daily water need"
              unit="in litres (optional)"
              helperText="Roughly how much water do you use per day? (optional)"
              value={inputs.dailyRequirement}
              onChange={(val) => handleSharedChange('dailyRequirement', val)}
              onBlur={() => handleSharedBlur('dailyRequirement')}
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

      {/* Fallback City / Town Search Modal */}
      <CitySearchModal
        isOpen={showCityModal}
        onClose={() => setShowCityModal(false)}
        onSelectCity={handleCitySelected}
        onEnterManually={handleEnterManually}
      />
    </div>
  );
};
