import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  ArrowRight, 
  ArrowLeft, 
  MapPin, 
  Check, 
  Sparkles, 
  HelpCircle, 
  Calculator, 
  Ruler, 
  Droplet,
  Compass,
  Layers,
  ChevronRight,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { 
  BuildingTypeKey, 
  BuildingStatus, 
  BuildingPlannerAnswers, 
  RoofTypeKey, 
  ROOF_TYPES,
  FullWeatherData,
  HistoricalRainfallData,
  PlanningAssumptions
} from '../types';
import { BUILDING_PROFILES, PLANNER_STRINGS } from '../data/buildingProfiles';
import { saveBuildingPlannerAnswers, loadBuildingPlannerAnswers } from '../utils/buildingPlanner';
import { WeatherLocationSection } from './WeatherLocationSection';
import { useAppSettings } from '../context/AppSettingsContext';
import { sqFeetToSqMeters, sqMetersToSqFeet } from '../utils/units';
import { StepperNumberInput } from './StepperNumberInput';

interface SmartBuildingPlannerProps {
  onPlanGenerated: (
    answers: BuildingPlannerAnswers, 
    weatherData: FullWeatherData | null, 
    historicalData: HistoricalRainfallData | null
  ) => void;
  initialAnswers?: Partial<BuildingPlannerAnswers>;
  assumptions?: PlanningAssumptions;
  onOpenAssumptions?: () => void;
  onBackToHome?: () => void;
}

export const SmartBuildingPlanner: React.FC<SmartBuildingPlannerProps> = ({
  onPlanGenerated,
  initialAnswers,
  assumptions,
  onOpenAssumptions,
  onBackToHome,
}) => {
  const { unit, formatArea, formatVolume } = useAppSettings();

  // Load saved state or default
  const saved = loadBuildingPlannerAnswers();

  const [step, setStep] = useState<number>(1);
  const [buildingType, setBuildingType] = useState<BuildingTypeKey>(
    initialAnswers?.buildingType || saved?.buildingType || 'house'
  );
  const [buildingStatus, setBuildingStatus] = useState<BuildingStatus>(
    initialAnswers?.buildingStatus || saved?.buildingStatus || 'new'
  );

  // Occupancy State
  const [primaryOccupancy, setPrimaryOccupancy] = useState<number>(
    initialAnswers?.primaryOccupancy || saved?.primaryOccupancy || BUILDING_PROFILES[buildingType]?.occupancyPrimaryDefault || 4
  );
  const [secondaryOccupancy, setSecondaryOccupancy] = useState<number>(
    initialAnswers?.secondaryOccupancy ?? saved?.secondaryOccupancy ?? (BUILDING_PROFILES[buildingType]?.secondaryDefault || 0)
  );

  // Roof State
  const [roofUnit, setRoofUnit] = useState<'metric' | 'imperial'>(unit);
  const [roofArea, setRoofArea] = useState<number>(
    initialAnswers?.roofAreaM2 || saved?.roofAreaM2 || 100
  );
  const [isCalculatedRoof, setIsCalculatedRoof] = useState<boolean>(
    saved?.isCalculatedRoof || false
  );
  const [roofLength, setRoofLength] = useState<string>(saved?.roofLength || '12.5');
  const [roofWidth, setRoofWidth] = useState<string>(saved?.roofWidth || '8');
  const [roofType, setRoofType] = useState<RoofTypeKey>(
    initialAnswers?.roofType || saved?.roofType || 'concrete'
  );

  // Location & Weather Data
  const [locationName, setLocationName] = useState<string>(
    initialAnswers?.locationName || saved?.locationName || ''
  );
  const [weatherData, setWeatherData] = useState<FullWeatherData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalRainfallData | null>(null);

  // Tank State (Optional)
  const [tankCapacityL, setTankCapacityL] = useState<number | undefined>(
    initialAnswers?.tankCapacityL ?? saved?.tankCapacityL ?? undefined
  );
  const [isTankUserSpecified, setIsTankUserSpecified] = useState<boolean>(
    saved?.isTankUserSpecified || false
  );

  // Errors / validation message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeProfile = BUILDING_PROFILES[buildingType] || BUILDING_PROFILES.house;

  // Sync default occupancies when building type switches
  const handleSelectBuildingType = (key: BuildingTypeKey) => {
    setBuildingType(key);
    const prof = BUILDING_PROFILES[key];
    setPrimaryOccupancy(prof.occupancyPrimaryDefault);
    setSecondaryOccupancy(prof.secondaryDefault || 0);
  };

  // Helper calculation for length x width
  useEffect(() => {
    if (isCalculatedRoof) {
      const l = parseFloat(roofLength) || 0;
      const w = parseFloat(roofWidth) || 0;
      const computedArea = l * w;
      if (computedArea > 0) {
        const areaInM2 = roofUnit === 'imperial' ? sqFeetToSqMeters(computedArea) : computedArea;
        setRoofArea(Math.round(areaInM2 * 10) / 10);
      }
    }
  }, [isCalculatedRoof, roofLength, roofWidth, roofUnit]);

  // Persist answers to localStorage whenever inputs change
  useEffect(() => {
    const currentAnswers: BuildingPlannerAnswers = {
      buildingType,
      buildingStatus,
      primaryOccupancy,
      secondaryOccupancy,
      roofAreaM2: roofArea,
      roofUnit,
      roofLength,
      roofWidth,
      isCalculatedRoof,
      roofType,
      locationName,
      latitude: weatherData?.latitude,
      longitude: weatherData?.longitude,
      tankCapacityL: isTankUserSpecified ? tankCapacityL : undefined,
      isTankUserSpecified,
    };
    saveBuildingPlannerAnswers(currentAnswers);
  }, [
    buildingType,
    buildingStatus,
    primaryOccupancy,
    secondaryOccupancy,
    roofArea,
    roofUnit,
    roofLength,
    roofWidth,
    isCalculatedRoof,
    roofType,
    locationName,
    weatherData,
    tankCapacityL,
    isTankUserSpecified,
  ]);

  // Step validation
  const handleNextStep = () => {
    setErrorMessage(null);

    if (step === 1) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (step === 2) {
      if (primaryOccupancy <= 0 || isNaN(primaryOccupancy)) {
        setErrorMessage(`Please enter a valid count of ${activeProfile.occupancyPrimaryLabel.toLowerCase()} (at least 1).`);
        return;
      }
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (step === 3) {
      if (roofArea <= 0 || isNaN(roofArea)) {
        setErrorMessage('Please enter a valid roof area greater than 0.');
        return;
      }
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (step === 4) {
      // Step 4 is Location
      if (!locationName) {
        setErrorMessage('Please pick your location so RainWise can fetch your accurate 3-year rainfall history.');
        return;
      }
      setStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (onBackToHome) {
      onBackToHome();
    }
  };

  // Final Action: Create my RainWise Plan
  const handleCreatePlan = () => {
    setErrorMessage(null);
    if (roofArea <= 0) {
      setErrorMessage('Please provide your roof size before generating the plan.');
      setStep(3);
      return;
    }

    const finalAnswers: BuildingPlannerAnswers = {
      buildingType,
      buildingStatus,
      primaryOccupancy,
      secondaryOccupancy,
      roofAreaM2: roofArea,
      roofUnit,
      roofLength,
      roofWidth,
      isCalculatedRoof,
      roofType,
      locationName: locationName || 'India',
      latitude: weatherData?.latitude,
      longitude: weatherData?.longitude,
      tankCapacityL: isTankUserSpecified ? tankCapacityL : undefined,
      isTankUserSpecified,
    };

    onPlanGenerated(finalAnswers, weatherData, historicalData);
  };

  // Location change listener from WeatherLocationSection
  const handleLocationChange = (
    locName: string,
    wData: FullWeatherData,
    hData: HistoricalRainfallData | null
  ) => {
    setLocationName(locName);
    setWeatherData(wData);
    setHistoricalData(hData);
    setErrorMessage(null);
  };

  const stepTitles = [
    'Building Type',
    'Occupancy',
    'Roof Size',
    'Location',
    'Storage Tank'
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      
      {/* ═══════════════════════════════════════════════════════════════
          TAGLINE ON THE FIRST SCREEN (Prompt Requirement)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold uppercase tracking-wider shadow-2xs">
          <span>🌧️</span>
          <span>Smart Building Planner</span>
        </div>
        <h1 className="font-['Outfit',sans-serif] font-black text-2xl sm:text-4xl text-slate-900 dark:text-white tracking-tight leading-snug">
          {PLANNER_STRINGS.tagline}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Tailored rainwater harvesting calculations for Indian homes, apartments, schools, hospitals, and commercial buildings.
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          PROGRESS BAR ON TOP
          ═══════════════════════════════════════════════════════════════ */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
          <span>Step {step} of 5: {stepTitles[step - 1]}</span>
          <span className="text-teal-700 dark:text-teal-400">{Math.round((step / 5) * 100)}% Complete</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Error message alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP 1: "What is this building going to be used for?"
          ═══════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <motion.div 
          key="step-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6"
        >
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-1">
              Step 1 of 5
            </span>
            <h2 className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
              {PLANNER_STRINGS.step1Title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {PLANNER_STRINGS.step1Subtitle}
            </p>
          </div>

          {/* New vs Existing Building Toggle */}
          <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setBuildingStatus('new')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
                buildingStatus === 'new'
                  ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>{PLANNER_STRINGS.statusNew}</span>
            </button>
            <button
              type="button"
              onClick={() => setBuildingStatus('existing')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
                buildingStatus === 'existing'
                  ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>{PLANNER_STRINGS.statusExisting}</span>
            </button>
          </div>

          {/* Big Icon Cards Grid (Single Select) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.values(BUILDING_PROFILES).map((prof) => {
              const isSelected = buildingType === prof.key;
              return (
                <button
                  key={prof.key}
                  type="button"
                  id={`building-card-${prof.key}`}
                  onClick={() => handleSelectBuildingType(prof.key)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer min-h-[110px] flex flex-col justify-between group ${
                    isSelected
                      ? 'bg-teal-50/90 dark:bg-teal-950/60 border-teal-600 dark:border-teal-500 shadow-md ring-2 ring-teal-600/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-3xl select-none group-hover:scale-110 transition-transform">
                      {prof.icon}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mt-2 leading-tight">
                      {prof.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {prof.shortDesc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              id="step1-continue-btn"
              onClick={handleNextStep}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-base shadow-lg shadow-teal-900/15 transition cursor-pointer min-h-[48px]"
            >
              <span>Next: People &amp; Occupancy</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP 2: "How many people will use it?"
          ═══════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <motion.div 
          key="step-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6"
        >
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-1">
              Step 2 of 5 • {activeProfile.name}
            </span>
            <h2 className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
              {activeProfile.occupancyQuestion}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Used to calculate daily non-drinking requirements ({activeProfile.dailyNonDrinkingUsePerPerson} L / {activeProfile.occupancyPrimaryUnit} / day).
            </p>
          </div>

          <div className="space-y-4">
            {/* Primary Occupancy Input with Stepper */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
              <StepperNumberInput
                id="planner-primary-occupancy"
                label={activeProfile.occupancyPrimaryLabel}
                unit={activeProfile.occupancyPrimaryUnit}
                value={String(primaryOccupancy)}
                onChange={(val) => setPrimaryOccupancy(Math.max(1, parseInt(val) || 1))}
                step={1}
                min={1}
                max={10000}
                placeholder="4"
                inputMode="numeric"
                icon="👥"
                helperText={`Estimated daily non-drinking requirement: ~${(primaryOccupancy * activeProfile.dailyNonDrinkingUsePerPerson).toLocaleString()} L/day`}
              />
            </div>

            {/* Secondary Input if applicable (e.g. flats for apartment, staff for hospital/school/mall, extra process water for factory) */}
            {activeProfile.hasSecondaryInput && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
                <StepperNumberInput
                  id="planner-secondary-occupancy"
                  label={activeProfile.secondaryLabel}
                  unit={activeProfile.secondaryUnit}
                  value={String(secondaryOccupancy)}
                  onChange={(val) => setSecondaryOccupancy(Math.max(0, parseInt(val) || 0))}
                  step={1}
                  min={0}
                  max={10000}
                  placeholder={`e.g. ${activeProfile.secondaryDefault}`}
                  inputMode="numeric"
                  helperText={activeProfile.secondaryHelper}
                />
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevStep}
              className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              id="step2-continue-btn"
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-base shadow-lg shadow-teal-900/15 transition cursor-pointer min-h-[48px]"
            >
              <span>Next: Roof Size</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP 3: "How big is the roof?"
          ═══════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <motion.div 
          key="step-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-1">
                Step 3 of 5
              </span>
              <h2 className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
                {PLANNER_STRINGS.step3Title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                {PLANNER_STRINGS.step3Subtitle}
              </p>
            </div>

            {/* m² vs sq ft toggle */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setRoofUnit('metric')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
                  roofUnit === 'metric' ? 'bg-teal-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                m² (Metres)
              </button>
              <button
                type="button"
                onClick={() => setRoofUnit('imperial')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer min-h-[36px] ${
                  roofUnit === 'imperial' ? 'bg-teal-800 text-white shadow-xs' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                sq ft (Feet)
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Direct Area Input with Stepper */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700">
              <StepperNumberInput
                id="planner-roof-area"
                label="Total Roof Catchment Area"
                unit={roofUnit === 'imperial' ? 'sq ft' : 'm²'}
                value={String(roofUnit === 'imperial' ? Math.round(sqMetersToSqFeet(roofArea)) : roofArea)}
                onChange={(val) => {
                  const raw = parseFloat(val) || 0;
                  const valInM2 = roofUnit === 'imperial' ? sqFeetToSqMeters(raw) : raw;
                  setRoofArea(Math.round(valInM2 * 10) / 10);
                  setIsCalculatedRoof(false);
                }}
                step={roofUnit === 'imperial' ? 50 : 5}
                min={1}
                max={roofUnit === 'imperial' ? 200000 : 20000}
                placeholder={roofUnit === 'imperial' ? '1000' : '100'}
                inputMode="decimal"
                icon="📐"
                helperText={isCalculatedRoof ? `Calculated from length × width: ${roofLength} × ${roofWidth} ${roofUnit === 'imperial' ? 'ft' : 'm'}` : undefined}
              />
            </div>

            {/* Helper: "Not sure? Enter the length and width of your roof" */}
            <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-teal-200">
                <Ruler className="w-4 h-4 text-teal-700" />
                <span>{PLANNER_STRINGS.roofHelper}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <StepperNumberInput
                  id="planner-roof-length"
                  label={`Roof Length (${roofUnit === 'imperial' ? 'feet' : 'metres'})`}
                  value={roofLength}
                  onChange={(val) => {
                    setRoofLength(val);
                    setIsCalculatedRoof(true);
                  }}
                  step={1}
                  min={0.5}
                  max={500}
                  placeholder="12.5"
                  inputMode="decimal"
                  compact
                />
                <StepperNumberInput
                  id="planner-roof-width"
                  label={`Roof Width (${roofUnit === 'imperial' ? 'feet' : 'metres'})`}
                  value={roofWidth}
                  onChange={(val) => {
                    setRoofWidth(val);
                    setIsCalculatedRoof(true);
                  }}
                  step={1}
                  min={0.5}
                  max={500}
                  placeholder="8.0"
                  inputMode="decimal"
                  compact
                />
              </div>
              <p className="text-[11px] text-teal-800 dark:text-teal-300 italic">
                Calculated: {formatArea(roofArea)} total roof area
              </p>
            </div>

            {/* Roof Type Selection from existing runoff coefficient list */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Roof Material / Surface Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ROOF_TYPES.map((rt) => {
                  const isSelected = roofType === rt.key;
                  return (
                    <button
                      key={rt.key}
                      type="button"
                      onClick={() => setRoofType(rt.key)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 min-h-[48px] ${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950 border-teal-600 text-teal-950 dark:text-teal-200 ring-2 ring-teal-600/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl shrink-0">{rt.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-bold block truncate">{rt.label}</span>
                        <span className="text-[10px] text-slate-400 block">{Math.round(rt.coefficient * 100)}% runoff</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevStep}
              className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              id="step3-continue-btn"
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-base shadow-lg shadow-teal-900/15 transition cursor-pointer min-h-[48px]"
            >
              <span>Next: Location &amp; Weather</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP 4: "Where is it?"
          ═══════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <motion.div 
          key="step-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6"
        >
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-1">
              Step 4 of 5
            </span>
            <h2 className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
              {PLANNER_STRINGS.step4Title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {PLANNER_STRINGS.step4Subtitle}
            </p>
          </div>

          {/* Reusing existing WeatherLocationSection with Geolocation & Open-Meteo search */}
          <div className="space-y-4">
            <WeatherLocationSection
              roofAreaM2={roofArea}
              runoffCoefficient={0.8}
              tankCapacityL={tankCapacityL || 2000}
              onLocationChange={handleLocationChange}
            />

            {locationName && (
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📍</span>
                  <div>
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
                      Location active: {locationName}
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      Historical annual rainfall: {historicalData?.typicalAnnualRainfallMm || 950} mm
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                  Ready ✅
                </span>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevStep}
              className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              id="step4-continue-btn"
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-base shadow-lg shadow-teal-900/15 transition cursor-pointer min-h-[48px]"
            >
              <span>Next: Storage Tank</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STEP 5 (Optional): "Do you already have a storage tank in mind?"
          ═══════════════════════════════════════════════════════════════ */}
      {step === 5 && (
        <motion.div 
          key="step-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-5 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6"
        >
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 dark:text-teal-400 block mb-1">
              Step 5 of 5 • Optional
            </span>
            <h2 className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-slate-900 dark:text-white">
              {PLANNER_STRINGS.step5Title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              {PLANNER_STRINGS.step5Subtitle}
            </p>
          </div>

          <div className="space-y-4">
            {/* Quick Option A: "Not sure, suggest one for me" */}
            <div className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
              !isTankUserSpecified
                ? 'bg-teal-50 dark:bg-teal-950/70 border-teal-600 text-teal-950 dark:text-teal-200 ring-2 ring-teal-600/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
            }`}
            onClick={() => {
              setIsTankUserSpecified(false);
              setTankCapacityL(undefined);
            }}
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">✨</span>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {PLANNER_STRINGS.suggestTankBtn}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    RainWise will automatically calculate the minimum, recommended, and ideal tank sizes based on your {activeProfile.name.toLowerCase()} demands.
                  </p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                !isTankUserSpecified ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-400'
              }`}>
                {!isTankUserSpecified && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            {/* Quick Option B: Enter Existing Tank Capacity */}
            <div className={`p-4 sm:p-5 rounded-2xl border transition space-y-3 ${
              isTankUserSpecified
                ? 'bg-teal-50 dark:bg-teal-950/70 border-teal-600 text-teal-950 dark:text-teal-200 ring-2 ring-teal-600/30'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}>
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsTankUserSpecified(true)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🛢️</span>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      I have an existing or planned tank size
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enter the capacity so RainWise can verify if it may overflow or if it is adequately sized.
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                  isTankUserSpecified ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-400'
                }`}>
                  {isTankUserSpecified && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              {isTankUserSpecified && (
                <div className="pt-2 space-y-3">
                  <StepperNumberInput
                    id="planner-tank-capacity"
                    label="Tank Storage Capacity"
                    unit="Litres"
                    value={String(tankCapacityL || '')}
                    onChange={(val) => setTankCapacityL(Math.max(0, parseInt(val) || 0))}
                    step={(curr) => (curr >= 5000 ? 500 : 100)}
                    min={100}
                    max={1000000}
                    placeholder="2000"
                    inputMode="numeric"
                    icon="🛢️"
                    compact
                  />

                  {/* Common Tank Size Buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Common:</span>
                    {[1000, 2000, 5000, 10000, 25000].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setTankCapacityL(size)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          tankCapacityL === size
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {size >= 1000 ? `${size / 1000}kL` : `${size}L`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation & FINAL CREATE PLAN BUTTON */}
          <div className="pt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrevStep}
              className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer min-h-[48px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              id="final-create-plan-btn"
              onClick={handleCreatePlan}
              className="inline-flex items-center justify-center gap-2.5 px-9 py-4 rounded-2xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-black text-base sm:text-lg shadow-xl shadow-teal-900/25 hover:-translate-y-0.5 transition cursor-pointer min-h-[52px]"
            >
              <span>{PLANNER_STRINGS.createPlanBtn}</span>
              <Sparkles className="w-5 h-5 text-amber-300" />
            </button>
          </div>
        </motion.div>
      )}

    </div>
  );
};
