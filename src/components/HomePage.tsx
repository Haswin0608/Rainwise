import React from 'react';
import { motion, type Variants } from 'motion/react';
import { ArrowRight, Sparkles, Lightbulb, HelpCircle, Droplet, Layers, Sliders } from 'lucide-react';
import { PresetScenario, AuthUser, SavedBuilding } from '../types';
import { PRESET_SCENARIOS } from '../utils/calculations';
import { SavedBuildingsSection } from './SavedBuildingsSection';
import { useAppSettings } from '../context/AppSettingsContext';

interface HomePageProps {
  onStartSmartPlanner: () => void;
  onStartCalculate: () => void;
  onSelectPreset: (preset: PresetScenario) => void;
  currentUser: AuthUser | null;
  savedBuildings: SavedBuilding[];
  isLoadingBuildings: boolean;
  onSelectBuilding: (b: SavedBuilding) => void;
  onEditBuilding: (b: SavedBuilding) => void;
  onDeleteBuilding: (id: string) => Promise<void>;
  onNewBlankBuilding: () => void;
  onOpenTips?: () => void;
  onOpenTutorial?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartSmartPlanner,
  onStartCalculate,
  onSelectPreset,
  currentUser,
  savedBuildings,
  isLoadingBuildings,
  onSelectBuilding,
  onEditBuilding,
  onDeleteBuilding,
  onNewBlankBuilding,
  onOpenTips = () => {},
  onOpenTutorial = () => {},
}) => {
  const { formatVolume } = useAppSettings();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' },
    },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 text-center">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center"
      >
        {/* Simple Friendly Badge */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 dark:bg-teal-950/70 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs sm:text-sm font-semibold mb-6 shadow-2xs"
        >
          <span>🌧️</span>
          <span>Household Water-Planning Tool • India</span>
        </motion.div>

        {/* Big Bold Plain-Language Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-3xl sm:text-5xl md:text-6xl font-extrabold font-['Outfit',sans-serif] tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-4"
        >
          Is your roof losing <br className="hidden sm:inline" />
          <span className="text-teal-800 dark:text-teal-400 underline decoration-teal-300 dark:decoration-teal-600 underline-offset-8">
            thousands of litres
          </span>{' '}
          of free rain?
        </motion.h1>

        {/* Subtitle with direct plain value */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-2xl text-slate-700 dark:text-slate-300 font-normal leading-relaxed max-w-xl mx-auto mb-8"
        >
          Plan your household rainwater harvesting in 3 easy steps:
          <span className="font-bold text-teal-800 dark:text-teal-300 block mt-1">
            Calculate → Plan → Simulate
          </span>
        </motion.p>

        {/* ═══════════════════════════════════════
            SAVED BUILDINGS SECTION (FOR SIGNED-IN USERS)
            ═══════════════════════════════════════ */}
        {currentUser && (
          <motion.div variants={itemVariants} className="w-full">
            <SavedBuildingsSection
              buildings={savedBuildings}
              isLoading={isLoadingBuildings}
              onSelectBuilding={onSelectBuilding}
              onEditBuilding={onEditBuilding}
              onDeleteBuilding={onDeleteBuilding}
              onNewBlankBuilding={onNewBlankBuilding}
            />
          </motion.div>
        )}

        {/* SMART BUILDING PLANNER FEATURED CARD (New starting point) */}
        <motion.div variants={itemVariants} className="w-full mb-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white shadow-xl relative overflow-hidden border border-teal-700/50 text-left">
            <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 text-9xl pointer-events-none select-none">
              🏛️
            </div>
            <div className="relative z-10 max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-700/60 border border-teal-500/50 text-teal-200 text-xs font-bold uppercase tracking-wider">
                <span>✨ New Starting Point</span>
              </div>
              <h2 className="font-['Outfit',sans-serif] font-black text-2xl sm:text-3xl text-white tracking-tight leading-tight">
                Before you build, let RainWise design your rainwater system.
              </h2>
              <p className="text-sm sm:text-base text-teal-100/90 leading-relaxed">
                Step-by-step sizing for individual homes, apartments, schools, offices, hospitals, and factories.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  id="home-smart-planner-btn"
                  onClick={onStartSmartPlanner}
                  className="inline-flex items-center justify-center gap-2.5 px-7 py-4 text-base sm:text-lg font-black text-teal-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-2xl shadow-lg transition-all cursor-pointer min-h-[52px]"
                >
                  <span>Launch Smart Building Planner</span>
                  <ArrowRight className="w-5 h-5 text-teal-950" />
                </button>
                <button
                  id="home-calculate-cta"
                  onClick={onStartCalculate}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition cursor-pointer min-h-[48px]"
                >
                  <span>Detailed 3-Step Calculator</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* SECONDARY ACTION BUTTONS: "❓ Tutorial", "Practical Tips" */}
        <motion.div variants={itemVariants} className="mb-10 w-full sm:w-auto flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="home-tutorial-cta"
            onClick={onOpenTutorial}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-teal-900 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/80 hover:bg-teal-100 dark:hover:bg-teal-900 border border-teal-200 dark:border-teal-800 rounded-2xl shadow-2xs transition-all duration-200 cursor-pointer min-h-[52px]"
          >
            <HelpCircle className="w-4 h-4 text-teal-700 dark:text-teal-400" />
            <span>❓ How It Works</span>
          </button>

          <button
            id="home-tips-cta"
            onClick={onOpenTips}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs transition-all duration-200 cursor-pointer min-h-[52px]"
          >
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Practical Tips</span>
          </button>
        </motion.div>

        {/* 3-STEP WORKFLOW CARDS: CALCULATE → PLAN → SIMULATE */}
        <motion.div
          variants={itemVariants}
          className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-10 text-left"
        >
          {/* Step 1: Calculate */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-100 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-400 mb-3 text-2xl">
              💧
            </div>
            <div className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 mb-1">
              Step 1
            </div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 dark:text-white text-lg mb-1">
              1. CALCULATE
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Measure your roof &amp; select your city to calculate total litres of clean rainwater you can collect.
            </p>
          </div>

          {/* Step 2: Plan */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800 flex items-center justify-center text-sky-700 dark:text-sky-400 mb-3 text-2xl">
              🏡
            </div>
            <div className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 mb-1">
              Step 2
            </div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 dark:text-white text-lg mb-1">
              2. PLAN
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Plan non-drinking chores (flushing, mopping, plants), verify your tank size, and estimate yearly ₹ bill savings.
            </p>
          </div>

          {/* Step 3: Simulate */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-3 text-2xl">
              📊
            </div>
            <div className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 mb-1">
              Step 3
            </div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 dark:text-white text-lg mb-1">
              3. SIMULATE
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Move live sliders to simulate &quot;What if...?&quot; scenarios, watch the tank fill, and print your RainWise Plan.
            </p>
          </div>
        </motion.div>

        {/* Quick Example Scenarios for instant testing */}
        <motion.div variants={itemVariants} className="w-full max-w-xl">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Or try a sample Indian household scenario:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESET_SCENARIOS.map((preset) => {
              const capacityNum = parseFloat(preset.inputs.tankCapacity || '0') || 0;
              return (
                <button
                  key={preset.id}
                  id={`home-preset-${preset.id}`}
                  onClick={() => onSelectPreset(preset)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-left transition-all group min-h-[52px] cursor-pointer"
                >
                  <span className="text-2xl">{preset.icon}</span>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                      {preset.name.split(' ')[0]} {preset.name.split(' ')[1] || ''}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {formatVolume(capacityNum)} tank
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Plain language note */}
        <motion.p
          variants={itemVariants}
          className="mt-8 text-xs text-slate-500 dark:text-slate-400"
        >
          All calculations run 100% locally in your browser. No engineering jargon, no login needed.
        </motion.p>
      </motion.div>
    </div>
  );
};
