import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Save, 
} from 'lucide-react';
import { 
  CalculatorInputs, 
  CalculationResult, 
  ToolStep, 
  AuthUser, 
  SavedBuilding, 
  PlanningAssumptions,
  FullWeatherData,
  HistoricalRainfallData
} from '../types';
import { calculateHarvesting, DEFAULT_ASSUMPTIONS } from '../utils/calculations';
import { Step1Calculate } from './Step1Calculate';
import { Step2Plan } from './Step2Plan';
import { Step3Simulate } from './Step3Simulate';
import { MyRainWisePlanReport } from './MyRainWisePlanReport';
import { AssumptionsModal } from './AssumptionsModal';
import { WeatherLocationSection } from './WeatherLocationSection';
import { useAppSettings } from '../context/AppSettingsContext';

interface CalculatorPageProps {
  inputs: CalculatorInputs;
  onChange: (inputs: CalculatorInputs) => void;
  onCalculate?: () => void;
  onBack: () => void;
  isCalculating?: boolean;
  currentUser: AuthUser | null;
  activeBuilding: SavedBuilding | null;
  onOpenSaveModal: () => void;
  onClearActiveBuilding?: () => void;
  initialStep?: ToolStep;
}

export const CalculatorPage: React.FC<CalculatorPageProps> = ({
  inputs,
  onChange,
  onBack,
  activeBuilding,
  onOpenSaveModal,
  onClearActiveBuilding,
  initialStep = 'calculate',
}) => {
  const [currentStep, setCurrentStep] = useState<ToolStep>(initialStep);
  const [showAssumptionsModal, setShowAssumptionsModal] = useState(false);
  const { unit } = useAppSettings();

  // Active calculation result computed dynamically
  const result: CalculationResult = calculateHarvesting(
    inputs, 
    unit, 
    inputs.assumptions || DEFAULT_ASSUMPTIONS
  );

  // Assumptions handler
  const handleSaveAssumptions = (newAssumptions: PlanningAssumptions) => {
    onChange({
      ...inputs,
      assumptions: newAssumptions,
    });
  };

  // Step transition helper
  const handleStepChange = (step: ToolStep) => {
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Location & Weather change handler (called when user picks GPS or searches a place)
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

  const stepsList: { key: ToolStep; label: string; icon: string; short: string }[] = [
    { key: 'calculate', label: '1. Calculate', icon: '💧', short: 'Calculate' },
    { key: 'plan', label: '2. Plan', icon: '🏡', short: 'Plan' },
    { key: 'simulate', label: '3. Simulate', icon: '📊', short: 'Simulate' },
    { key: 'report', label: 'Report', icon: '📋', short: 'Report' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6">
      
      {/* Top Header: Back to Home + Active Building Tag + Save Building Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          id="planner-back-to-home-btn"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          {activeBuilding ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-semibold">
              <span role="img" aria-label="building">🏠</span>
              <span className="font-bold truncate max-w-[120px] sm:max-w-[200px]">
                {activeBuilding.nickname}
              </span>
              {onClearActiveBuilding && (
                <button
                  type="button"
                  onClick={onClearActiveBuilding}
                  className="text-teal-600 hover:text-teal-900 dark:hover:text-teal-100 ml-1 text-xs font-bold cursor-pointer"
                  title="Unlink building"
                  aria-label="Unlink building"
                >
                  ×
                </button>
              )}
            </div>
          ) : null}

          <button
            type="button"
            id="planner-save-building-btn"
            onClick={onOpenSaveModal}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer min-h-[40px]"
          >
            <Save className="w-3.5 h-3.5 text-teal-600" />
            <span>{activeBuilding ? 'Update Building' : 'Save Building'}</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          FEATURE: LOCATION & 7-DAY WEATHER FORECAST & ARCHIVE
          ═══════════════════════════════════════════════════════ */}
      <WeatherLocationSection
        roofAreaM2={result.roofArea}
        runoffCoefficient={result.runoffCoefficient}
        tankCapacityL={result.tankCapacity}
        onLocationChange={handleLocationChange}
      />

      {/* ═══════════════════════════════════════════════════════
          STEPPER PROGRESS BAR: 1. CALCULATE → 2. PLAN → 3. SIMULATE → REPORT
          ═══════════════════════════════════════════════════════ */}
      <div className="w-full p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-4 gap-1 sm:gap-2">
          {stepsList.map((step) => {
            const isActive = currentStep === step.key;
            return (
              <button
                key={step.key}
                type="button"
                id={`planner-step-tab-${step.key}`}
                onClick={() => handleStepChange(step.key)}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-1 sm:px-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer min-h-[44px] ${
                  isActive
                    ? 'bg-teal-800 text-white shadow-md shadow-teal-900/15'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900'
                }`}
              >
                <span className="text-base sm:text-lg" role="img" aria-label={step.label}>{step.icon}</span>
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE STEP VIEW */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {currentStep === 'calculate' && (
            <motion.div
              key="step-calculate"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Step1Calculate
                inputs={inputs}
                result={result}
                onChange={onChange}
                onNext={() => handleStepChange('plan')}
                onOpenAssumptions={() => setShowAssumptionsModal(true)}
              />
            </motion.div>
          )}

          {currentStep === 'plan' && (
            <motion.div
              key="step-plan"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Step2Plan
                inputs={inputs}
                result={result}
                onChange={onChange}
                onPrev={() => handleStepChange('calculate')}
                onNext={() => handleStepChange('simulate')}
                onOpenAssumptions={() => setShowAssumptionsModal(true)}
              />
            </motion.div>
          )}

          {currentStep === 'simulate' && (
            <motion.div
              key="step-simulate"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Step3Simulate
                inputs={inputs}
                result={result}
                onChange={onChange}
                onPrev={() => handleStepChange('plan')}
                onViewReport={() => handleStepChange('report')}
              />
            </motion.div>
          )}

          {currentStep === 'report' && (
            <motion.div
              key="step-report"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <MyRainWisePlanReport
                result={result}
                inputs={inputs}
                onEditPlan={() => handleStepChange('calculate')}
                onStartOver={() => handleStepChange('calculate')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Assumptions Editor Modal */}
      <AssumptionsModal
        isOpen={showAssumptionsModal}
        onClose={() => setShowAssumptionsModal(false)}
        assumptions={inputs.assumptions || DEFAULT_ASSUMPTIONS}
        onSaveAssumptions={handleSaveAssumptions}
      />

    </div>
  );
};
