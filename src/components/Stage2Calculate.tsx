import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Sliders, 
  MapPin, 
  Layers, 
  Container, 
  Users, 
  Info, 
  Check, 
  AlertCircle,
  Edit2
} from 'lucide-react';
import { 
  CalculatorInputs, 
  CalculationResult, 
  RoofItem, 
  StorageTankItem, 
  BuildingDraft, 
  ROOF_TYPES, 
  RoofTypeKey, 
  PlanningAssumptions,
  getBuildingTypeDisplay,
  FullWeatherData,
  HistoricalRainfallData
} from '../types';
import { 
  calculateHarvesting, 
  DEFAULT_ASSUMPTIONS, 
  normalizeRoofs, 
  normalizeTanks, 
  getRunoffCoefficient,
  toBuckets,
  MONTH_NAMES
} from '../utils/calculations';
import { sqMetersToSqFeet, sqFeetToSqMeters } from '../utils/units';
import { useAppSettings } from '../context/AppSettingsContext';
import { StageProgressBar } from './StageProgressBar';
import { WeatherLocationSection } from './WeatherLocationSection';
import { StepperNumberInput } from './StepperNumberInput';
import { PeriodSelector } from './PeriodSelector';
import { SavedVsWastedSection } from './SavedVsWastedSection';
import { AssumptionsModal } from './AssumptionsModal';

interface Stage2CalculateProps {
  draft: BuildingDraft;
  inputs: CalculatorInputs;
  onChange: (inputs: CalculatorInputs) => void;
  onBackToStage1: () => void;
  onFinish: () => void;
  onOpenTips?: (tipId?: string) => void;
  isEditingExisting?: boolean;
}

export const Stage2Calculate: React.FC<Stage2CalculateProps> = ({
  draft,
  inputs,
  onChange,
  onBackToStage1,
  onFinish,
  onOpenTips,
  isEditingExisting = false,
}) => {
  const { unit, setUnit, formatArea, formatVolume, formatVolumeFull } = useAppSettings();
  const [showAssumptionsModal, setShowAssumptionsModal] = useState(false);

  const isImperial = unit === 'imperial';
  const roofs: RoofItem[] = normalizeRoofs(inputs.roofs, inputs.directRoofArea, inputs.roofType);
  const { tanks, noTankYet } = normalizeTanks(inputs.tanks, inputs.tankCapacity, inputs.noTankYet);

  // Demand calculations
  const peopleCount = parseInt(inputs.householdSize || '4', 10) || 0;
  const lPerPersonPerDay = (inputs.assumptions?.demands.toilet ?? 30) + (inputs.assumptions?.demands.cleaning ?? 10);
  const totalDailyDemandL = peopleCount * lPerPersonPerDay;

  // Active result computed on the fly
  const result: CalculationResult = calculateHarvesting(
    inputs,
    unit,
    inputs.assumptions || DEFAULT_ASSUMPTIONS
  );

  const buildingDisplay = getBuildingTypeDisplay(draft.buildingTypeKey, draft.customTypeName);

  // Total roof area in m²
  const totalRoofArea = roofs.reduce((acc, r) => acc + (parseFloat(r.area) || 0), 0);
  const totalRoofAreaM2 = roofs.reduce((acc, r) => {
    const a = parseFloat(r.area) || 0;
    return acc + (r.areaUnit === 'imperial' ? sqFeetToSqMeters(a) : a);
  }, 0);

  // Total tank capacity in L
  const totalTankL = noTankYet ? 0 : tanks.reduce((acc, t) => acc + (parseFloat(t.capacity) || 0), 0);

  // Check validation for "Finish" button
  const hasLocation = Boolean(result.hasLocation || (inputs.locationName && inputs.locationName.trim().length > 0));
  const hasValidRoofArea = totalRoofArea > 0 && roofs.some((r) => (parseFloat(r.area) || 0) > 0);
  const isRainfallLoading = Boolean(inputs.isLoadingArchive || (hasLocation && (!inputs.typicalMonthlyRainfallMm || inputs.typicalMonthlyRainfallMm.length === 0)));

  const isFinishEnabled = hasLocation && hasValidRoofArea && !isRainfallLoading;

  let finishDisabledReason = '';
  if (!hasLocation) {
    finishDisabledReason = 'Please select or search your location to fetch local rainfall data.';
  } else if (!hasValidRoofArea) {
    finishDisabledReason = 'Please enter a roof area greater than 0.';
  } else if (isRainfallLoading) {
    finishDisabledReason = 'Loading rainfall data for your location...';
  }

  // Unit toggle handler
  const handleToggleUnit = (newUnit: 'metric' | 'imperial') => {
    if (newUnit === unit) return;
    setUnit(newUnit);

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

  // Roof operations
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
  };

  const handleRemoveRoof = (id: string) => {
    if (roofs.length <= 1) return;
    const updated = roofs.filter((r) => r.id !== id);
    onChange({
      ...inputs,
      roofs: updated,
    });
  };

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
  };

  // Tank operations
  const handleAddTank = () => {
    if (tanks.length >= 8) return;
    const nextIdx = tanks.length + 1;
    const newTank: StorageTankItem = {
      id: `tank_${Date.now()}_${nextIdx}`,
      name: `Tank ${nextIdx}`,
      capacity: '1000',
    };
    onChange({
      ...inputs,
      tanks: [...tanks, newTank],
      noTankYet: false,
    });
  };

  const handleRemoveTank = (id: string) => {
    if (tanks.length <= 1) {
      onChange({
        ...inputs,
        tanks: [],
        noTankYet: true,
      });
      return;
    }
    const updated = tanks.filter((t) => t.id !== id);
    onChange({
      ...inputs,
      tanks: updated,
    });
  };

  const handleUpdateTank = (id: string, updates: Partial<StorageTankItem>) => {
    const updated = tanks.map((t) => {
      if (t.id === id) {
        return { ...t, ...updates };
      }
      return t;
    });
    onChange({
      ...inputs,
      tanks: updated,
      noTankYet: false,
    });
  };

  const handleToggleNoTank = (checked: boolean) => {
    if (checked) {
      onChange({
        ...inputs,
        noTankYet: true,
      });
    } else {
      const restoredTanks = tanks.length > 0 ? tanks : [{ id: 'tank_1', name: 'Tank 1', capacity: '2000' }];
      onChange({
        ...inputs,
        tanks: restoredTanks,
        noTankYet: false,
      });
    }
  };

  // Location & Weather update
  const handleLocationChange = (
    locationName: string,
    weatherData: FullWeatherData,
    historicalData: HistoricalRainfallData | null,
    archiveError: string | null
  ) => {
    onChange({
      ...inputs,
      locationName,
      latitude: weatherData.latitude,
      longitude: weatherData.longitude,
      weeklyRainfallMm: weatherData.weeklyPrecipitationSumMm,
      typicalAnnualRainfallMm: historicalData ? historicalData.typicalAnnualRainfallMm : undefined,
      typicalMonthlyRainfallMm: historicalData ? [...historicalData.typicalMonthlyRainfallMm] : undefined,
      historicalRainfall: historicalData,
      isLoadingArchive: false,
      archiveError: archiveError || null,
      weatherInfo: {
        locationName,
        weeklyRainfallMm: weatherData.weeklyPrecipitationSumMm,
        dateStr: weatherData.dateStr,
        isAutoFetched: true,
        latitude: weatherData.latitude,
        longitude: weatherData.longitude,
        fullWeather: weatherData,
        historical: historicalData,
        archiveError: archiveError || null,
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-7 text-left">
      {/* Stage Progress Bar (Stage 2 of 4) */}
      <StageProgressBar
        currentStage={2}
        buildingName={draft.name}
        buildingTypeIcon={buildingDisplay.icon}
      />

      {/* ───────── TOP BAR: ACTIVE BUILDING BADGE & EDIT SHORTCUT ───────── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0b1120] border border-[#24354c] flex items-center justify-center text-2xl shrink-0 shadow-inner">
            {buildingDisplay.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                {buildingDisplay.name}
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">
                {isEditingExisting ? 'Editing Saved Building' : 'Stage 2 • Water Calculation'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-['Outfit',sans-serif] text-white truncate max-w-xs sm:max-w-md">
              {draft.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToStage1}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0b1120] hover:bg-[#182438] text-slate-300 hover:text-white border border-[#24354c] font-semibold text-xs transition cursor-pointer min-h-[40px]"
            title="Edit name and building type"
          >
            <Edit2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Edit Name/Type</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAssumptionsModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0b1120] hover:bg-[#182438] text-slate-300 hover:text-white border border-[#24354c] font-semibold text-xs transition cursor-pointer min-h-[40px]"
            title="Assumptions & Water Usage"
          >
            <Sliders className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Assumptions</span>
          </button>
        </div>
      </div>

      {/* ───────── 1. LOCATION CARD ───────── */}
      <div id="location-card-container">
        <WeatherLocationSection
          roofAreaM2={totalRoofAreaM2}
          tankCapacityL={totalTankL}
          onLocationChange={handleLocationChange}
        />
      </div>

      {/* ───────── 2. ROOFS LIST (MULTIPLE ROOFS) ───────── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-md space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏠</span>
            <div>
              <h2 className="font-['Outfit',sans-serif] font-bold text-lg sm:text-xl text-white">
                Roof Surfaces ({roofs.length})
              </h2>
              <p className="text-xs text-slate-300">
                Total Area: <strong className="text-teal-300">{formatArea(totalRoofArea)}</strong>
              </p>
            </div>
          </div>

          {/* Unit Toggle */}
          <div className="inline-flex p-1 rounded-xl bg-[#0b1120] border border-[#24354c] text-xs font-bold">
            <button
              type="button"
              onClick={() => handleToggleUnit('metric')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer min-h-[36px] ${
                !isImperial ? 'bg-teal-500 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              m² (Metres)
            </button>
            <button
              type="button"
              onClick={() => handleToggleUnit('imperial')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer min-h-[36px] ${
                isImperial ? 'bg-teal-500 text-slate-950 font-black shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              sq ft (Feet)
            </button>
          </div>
        </div>

        {/* Roof Cards */}
        <div className="space-y-4">
          {roofs.map((roof, index) => {
            const activeType = ROOF_TYPES.find((t) => t.key === roof.typeKey) || ROOF_TYPES[0];
            const isCustom = roof.typeKey === 'custom';
            const coeff = getRunoffCoefficient(roof.typeKey, undefined, inputs.assumptions, roof.customEfficiency);

            return (
              <div
                key={roof.id}
                id={`roof-card-${roof.id}`}
                className="p-4 sm:p-5 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-4"
              >
                {/* Roof Header */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xl shrink-0">{activeType.icon}</span>
                    <input
                      type="text"
                      maxLength={30}
                      value={roof.name}
                      onChange={(e) => handleUpdateRoof(roof.id, { name: e.target.value })}
                      placeholder={`Roof ${index + 1}`}
                      className="bg-transparent text-white font-bold text-base focus:bg-[#131d2e] px-2 py-1 rounded-lg border border-transparent focus:border-teal-500/50 outline-none w-full max-w-[200px]"
                    />
                  </div>

                  {roofs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRoof(roof.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/50 transition cursor-pointer"
                      title="Remove roof"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Area Input & Stepper */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-6">
                    <StepperNumberInput
                      id={`roof-area-${roof.id}`}
                      label={`Roof Area (${isImperial ? 'sq ft' : 'm²'})`}
                      value={roof.area}
                      onChange={(newVal) => handleUpdateRoof(roof.id, { area: newVal })}
                      step={isImperial ? 50 : 10}
                      min={0}
                      max={isImperial ? 100000 : 10000}
                      unit={isImperial ? 'sq ft' : 'm²'}
                      helperText={`Efficiency: ${Math.round(coeff * 100)}% of rain captured`}
                    />
                  </div>

                  {/* Surface Type Selector */}
                  <div className="sm:col-span-6 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Roof Material &amp; Runoff Efficiency
                    </label>
                    <select
                      value={roof.typeKey}
                      onChange={(e) => handleUpdateRoof(roof.id, { typeKey: e.target.value as RoofTypeKey })}
                      className="w-full px-3.5 py-3 rounded-2xl bg-[#131d2e] border border-[#24354c] text-white text-sm font-medium focus:border-teal-400 focus:outline-none cursor-pointer"
                    >
                      {ROOF_TYPES.map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.icon} {t.label} ({Math.round(t.coefficient * 100)}% capture)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Working Custom Type details if Custom selected */}
                {isCustom && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3.5 rounded-xl bg-[#131d2e] border border-teal-500/30 grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    <div>
                      <label className="block text-xs font-bold text-teal-300 mb-1">
                        Custom Material Name
                      </label>
                      <input
                        type="text"
                        maxLength={30}
                        value={roof.customName || ''}
                        onChange={(e) => handleUpdateRoof(roof.id, { customName: e.target.value })}
                        placeholder="e.g. Polycarbonate, Slate, Green roof"
                        className="w-full px-3 py-2 rounded-xl bg-[#0b1120] border border-[#24354c] text-white text-xs font-medium focus:border-teal-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-teal-300 mb-1">
                        Runoff Efficiency ({roof.customEfficiency ?? 70}%)
                      </label>
                      <input
                        type="range"
                        min={10}
                        max={95}
                        step={5}
                        value={roof.customEfficiency ?? 70}
                        onChange={(e) => handleUpdateRoof(roof.id, { customEfficiency: parseInt(e.target.value, 10) })}
                        className="w-full accent-teal-400 cursor-pointer mt-2"
                      />
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Another Roof Button */}
        {roofs.length < 10 && (
          <button
            type="button"
            onClick={handleAddRoof}
            className="w-full py-3 rounded-2xl bg-[#0b1120] hover:bg-[#182438] text-teal-300 hover:text-teal-200 border border-dashed border-teal-500/40 hover:border-teal-400 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
          >
            <Plus className="w-4 h-4 text-teal-400" />
            <span>+ Add Another Roof ({roofs.length}/10)</span>
          </button>
        )}
      </div>

      {/* ───────── 3. STORAGE TANKS LIST (MULTIPLE TANKS) ───────── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-md space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🛢️</span>
            <div>
              <h2 className="font-['Outfit',sans-serif] font-bold text-lg sm:text-xl text-white">
                Storage Tanks ({noTankYet ? 0 : tanks.length})
              </h2>
              <p className="text-xs text-slate-300">
                {noTankYet ? (
                  <span className="text-amber-300 font-semibold">No storage tank planned yet</span>
                ) : (
                  <span>
                    Total Storage:{' '}
                    <strong className="text-sky-300">
                      {formatVolume(tanks.reduce((acc, t) => acc + (parseFloat(t.capacity) || 0), 0))}
                    </strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* No Tank Checkbox */}
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0b1120] border border-[#24354c] text-xs font-semibold text-slate-300 cursor-pointer select-none hover:border-slate-600">
            <input
              type="checkbox"
              checked={noTankYet}
              onChange={(e) => handleToggleNoTank(e.target.checked)}
              className="rounded accent-teal-400 w-4 h-4"
            />
            <span>I don&apos;t have a tank yet</span>
          </label>
        </div>

        {!noTankYet && (
          <div className="space-y-4">
            {tanks.map((tank, index) => (
              <div
                key={tank.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xl shrink-0">🛢️</span>
                    <input
                      type="text"
                      maxLength={30}
                      value={tank.name}
                      onChange={(e) => handleUpdateTank(tank.id, { name: e.target.value })}
                      placeholder={`Tank ${index + 1}`}
                      className="bg-transparent text-white font-bold text-base focus:bg-[#131d2e] px-2 py-1 rounded-lg border border-transparent focus:border-sky-500/50 outline-none w-full max-w-[200px]"
                    />
                  </div>

                  {tanks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTank(tank.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-800/50 transition cursor-pointer"
                      title="Remove tank"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-8">
                    <StepperNumberInput
                      id={`tank-cap-${tank.id}`}
                      label="Tank Capacity (Litres / Gallons)"
                      value={tank.capacity}
                      onChange={(newVal) => handleUpdateTank(tank.id, { capacity: newVal })}
                      step={isImperial ? 250 : 500}
                      min={100}
                      max={isImperial ? 25000 : 100000}
                      unit={isImperial ? 'gal' : 'L'}
                      helperText={`≈ ${toBuckets(parseFloat(tank.capacity) || 0, inputs.assumptions?.conversions.bucketSizeL || 15).toLocaleString()} buckets of storage`}
                    />
                  </div>

                  {/* Preset quick buttons */}
                  <div className="sm:col-span-4 flex flex-wrap gap-1.5 pt-1">
                    {[1000, 2000, 5000, 10000].map((presetL) => (
                      <button
                        key={presetL}
                        type="button"
                        onClick={() => handleUpdateTank(tank.id, { capacity: String(presetL) })}
                        className="px-2.5 py-1.5 rounded-lg bg-[#131d2e] hover:bg-[#1f2d42] border border-[#24354c] text-xs font-semibold text-sky-300 cursor-pointer"
                      >
                        {presetL >= 1000 ? `${presetL / 1000}k L` : `${presetL} L`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {tanks.length < 8 && (
              <button
                type="button"
                onClick={handleAddTank}
                className="w-full py-3 rounded-2xl bg-[#0b1120] hover:bg-[#182438] text-sky-300 hover:text-sky-200 border border-dashed border-sky-500/40 hover:border-sky-400 font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer min-h-[46px]"
              >
                <Plus className="w-4 h-4 text-sky-400" />
                <span>+ Add Another Tank ({tanks.length}/8)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ───────── 4. PEOPLE / OCCUPANTS SECTION ───────── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-md space-y-4">
        <div className="flex items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">👥</span>
            <div>
              <h2 className="font-['Outfit',sans-serif] font-bold text-lg sm:text-xl text-white">
                How many people use this building?
              </h2>
              <p className="text-xs text-slate-300">
                Optional: helps estimate non-drinking water needs (toilet flushing, cleaning, gardening).
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          <div className="sm:col-span-6">
            <StepperNumberInput
              id="household-people-input"
              label="Number of people / occupants"
              value={inputs.householdSize || '4'}
              onChange={(newVal) => {
                const num = parseInt(newVal, 10) || 0;
                onChange({
                  ...inputs,
                  householdSize: newVal,
                  dailyRequirement: String(num * lPerPersonPerDay),
                });
              }}
              step={1}
              min={0}
              max={500}
              unit="people"
              helperText={`Using ${lPerPersonPerDay} L / person / day for non-drinking needs`}
            />
          </div>

          <div className="sm:col-span-6 p-4 rounded-2xl bg-[#0b1120] border border-[#24354c] text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-400">Daily Demand:</span>
              <span className="text-teal-300 font-bold text-sm">{formatVolume(totalDailyDemandL)} / day</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span className="text-slate-400">Weekly Demand:</span>
              <span className="text-teal-300 font-bold text-sm">{formatVolume(totalDailyDemandL * 7)} / week</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1 border-t border-[#1e293b]">
              💡 <em>Note:</em> Water recommendations are uniform for all building types based purely on roof area and usage. Building type is used for your personal icon and organization.
            </p>
          </div>
        </div>
      </div>

      {/* ───────── 5. RESULTS & PERIOD BREAKDOWN ───────── */}
      <div className="space-y-6">
        {/* Period Selector */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">
              Calculation Timeline
            </span>
            <h3 className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-white">
              Choose Analysis Period
            </h3>
          </div>

          <PeriodSelector />
        </div>

        {/* Dynamic Saved vs Wasted Section */}
        <SavedVsWastedSection
          result={result}
          inputs={inputs}
          onOpenAssumptions={() => setShowAssumptionsModal(true)}
          onUpdateTanks={(newTanks, noTank) => {
            onChange({
              ...inputs,
              tanks: newTanks,
              noTankYet: noTank,
            });
          }}
        />
      </div>

      {/* ───────── BOTTOM ACTIONS: BACK & FINISH ───────── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBackToStage1}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#0b1120] hover:bg-[#182438] text-slate-300 hover:text-white border border-[#24354c] font-bold text-sm transition cursor-pointer min-h-[50px] order-2 sm:order-1"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span>Back to Stage 1 (Setup)</span>
        </button>

        <div className="flex flex-col items-stretch sm:items-end gap-1.5 order-1 sm:order-2">
          <button
            type="button"
            id="stage2-finish-btn"
            disabled={!isFinishEnabled}
            onClick={onFinish}
            className={`inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl font-black text-base sm:text-lg shadow-lg transition-all min-h-[52px] ${
              isFinishEnabled
                ? 'bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-slate-950 shadow-amber-500/20 cursor-pointer'
                : 'bg-[#1e293b] text-slate-500 border border-[#24354c] cursor-not-allowed opacity-75'
            }`}
          >
            <span>Finish &amp; Review</span>
            <ArrowRight className="w-5 h-5 text-slate-950" />
          </button>

          {!isFinishEnabled && (
            <span className="text-xs text-amber-300/90 font-medium text-center sm:text-right max-w-xs sm:max-w-md">
              {finishDisabledReason}
            </span>
          )}
        </div>
      </div>

      {/* Assumptions Modal */}
      <AssumptionsModal
        isOpen={showAssumptionsModal}
        onClose={() => setShowAssumptionsModal(false)}
        assumptions={inputs.assumptions || DEFAULT_ASSUMPTIONS}
        onSaveAssumptions={(newAssumptions: PlanningAssumptions) => {
          onChange({
            ...inputs,
            assumptions: newAssumptions,
          });
        }}
      />
    </div>
  );
};
