import React from 'react';
import { motion, type Variants } from 'motion/react';
import { ArrowRight, Sparkles, Lightbulb } from 'lucide-react';
import { PresetScenario, AuthUser, SavedBuilding } from '../types';
import { PRESET_SCENARIOS } from '../utils/calculations';
import { SavedBuildingsSection } from './SavedBuildingsSection';
import { useAppSettings } from '../context/AppSettingsContext';

interface HomePageProps {
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
}

export const HomePage: React.FC<HomePageProps> = ({
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
          <span>Free Rainwater Harvesting Tool</span>
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
          className="text-xl sm:text-2xl text-slate-700 dark:text-slate-300 font-normal leading-relaxed max-w-xl mx-auto mb-8"
        >
          Find out how much rain you can save — and how much you&apos;re losing.
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

        {/* ONE BIG OBVIOUS BUTTON: "Check My Water" */}
        <motion.div variants={itemVariants} className="mb-10 w-full sm:w-auto flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            id="home-calculate-cta"
            onClick={onStartCalculate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 text-xl font-bold text-white bg-teal-800 hover:bg-teal-900 active:bg-teal-950 dark:bg-teal-700 dark:hover:bg-teal-800 rounded-2xl shadow-lg shadow-teal-900/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer min-h-[64px]"
          >
            <span>Check My Water</span>
            <ArrowRight className="w-6 h-6" />
          </button>

          <button
            id="home-tips-cta"
            onClick={onOpenTips}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs transition-all duration-200 cursor-pointer min-h-[60px]"
          >
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <span>Practical Tips</span>
          </button>
        </motion.div>

        {/* Pictorial Flow Cards (Roof -> Rain -> Tank) */}
        <motion.div
          variants={itemVariants}
          className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-10 text-left"
        >
          {/* Card 1: The Roof */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-400 mb-3 text-2xl">
              🏠
            </div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 dark:text-white text-lg mb-1">
              1. Your Roof
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Measure how long and wide your roof is to see how much rain lands on it.
            </p>
          </div>

          {/* Card 2: The Rain */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800 flex items-center justify-center text-sky-700 dark:text-sky-400 mb-3 text-2xl">
              🌧️
            </div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 dark:text-white text-lg mb-1">
              2. Rain Falling
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Enter rainfall manually or auto-fetch today&apos;s rain for your location.
            </p>
          </div>

          {/* Card 3: The Tank */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 mb-3 text-2xl">
              🛢️
            </div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 dark:text-white text-lg mb-1">
              3. Water Saved
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              See what your tank can hold, and see if any water is overflowing and wasted.
            </p>
          </div>
        </motion.div>

        {/* Quick Example Scenarios for instant testing */}
        <motion.div variants={itemVariants} className="w-full max-w-xl">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Or pick a quick example to see how it works</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESET_SCENARIOS.map((preset) => {
              const capacityNum = parseFloat(preset.inputs.tankCapacity) || 0;
              return (
                <button
                  key={preset.id}
                  id={`home-preset-${preset.id}`}
                  onClick={() => onSelectPreset(preset)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-800 text-left transition-all group min-h-[52px] cursor-pointer"
                >
                  <span className="text-2xl">{preset.icon}</span>
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
                      {preset.name.split(' ')[0]}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
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
          Actual water collected may vary depending on your roof and pipes.
        </motion.p>
      </motion.div>
    </div>
  );
};
