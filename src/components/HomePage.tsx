import React from 'react';
import { motion, type Variants } from 'motion/react';
import { ArrowRight, Droplet, Sparkles } from 'lucide-react';
import { PRESET_SCENARIOS } from '../utils/calculations';
import { PresetScenario, SavedBuilding, AuthUser } from '../types';
import { SavedBuildingsSection } from './SavedBuildingsSection';

interface HomePageProps {
  onStartCalculate: () => void;
  onSelectPreset: (preset: PresetScenario) => void;
  currentUser: AuthUser | null;
  savedBuildings: SavedBuilding[];
  isLoadingBuildings: boolean;
  onSelectBuilding: (building: SavedBuilding) => void;
  onEditBuilding: (building: SavedBuilding) => void;
  onDeleteBuilding: (buildingId: string) => Promise<void>;
  onNewBlankBuilding: () => void;
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
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.25,
        ease: 'easeOut',
      },
    },
  };

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] flex flex-col justify-center items-center px-4 sm:px-6 py-8 sm:py-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl mx-auto text-center flex flex-col items-center"
      >
        {/* Friendly Top Badge */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-sm font-medium shadow-2xs mb-4"
        >
          <Droplet className="w-4 h-4 text-emerald-600 fill-emerald-600" />
          <span>Simple Rainwater Calculator</span>
        </motion.div>

        {/* Large Friendly App Name */}
        <motion.h1
          variants={itemVariants}
          className="text-5xl sm:text-6xl md:text-7xl font-bold font-['Outfit',sans-serif] tracking-tight text-slate-900 leading-tight mb-4"
        >
          Rain<span className="text-teal-700">Wise</span>
        </motion.h1>

        {/* One simple line requested */}
        <motion.p
          variants={itemVariants}
          className="text-xl sm:text-2xl text-slate-700 font-normal leading-relaxed max-w-xl mx-auto mb-8"
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
        <motion.div variants={itemVariants} className="mb-10 w-full sm:w-auto">
          <button
            id="home-calculate-cta"
            onClick={onStartCalculate}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-5 text-xl font-bold text-white bg-teal-800 hover:bg-teal-900 active:bg-teal-950 rounded-2xl shadow-lg shadow-teal-900/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer min-h-[64px]"
          >
            <span>Check My Water</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </motion.div>

        {/* Pictorial Flow Cards (Roof -> Rain -> Tank) */}
        <motion.div
          variants={itemVariants}
          className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-10 text-left"
        >
          {/* Card 1: The Roof */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 mb-3 text-2xl">
              🏠
            </div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 text-lg mb-1">
              1. Your Roof
            </h3>
            <p className="text-sm text-slate-600">
              Measure how long and wide your roof is to see how much rain lands on it.
            </p>
          </div>

          {/* Card 2: The Rain */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 mb-3 text-2xl">
              🌧️
            </div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 text-lg mb-1">
              2. Rain Falling
            </h3>
            <p className="text-sm text-slate-600">
              Enter rainfall manually or auto-fetch today&apos;s rain for your location.
            </p>
          </div>

          {/* Card 3: The Tank */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col items-start">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mb-3 text-2xl">
              🛢️
            </div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 text-lg mb-1">
              3. Water Saved
            </h3>
            <p className="text-sm text-slate-600">
              See what your tank can hold, and see if any water is overflowing and wasted.
            </p>
          </div>
        </motion.div>

        {/* Quick Example Scenarios for instant testing */}
        <motion.div variants={itemVariants} className="w-full max-w-xl">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Or pick a quick example to see how it works</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {PRESET_SCENARIOS.map((preset) => (
              <button
                key={preset.id}
                id={`home-preset-${preset.id}`}
                onClick={() => onSelectPreset(preset)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-left transition-all group min-h-[52px] cursor-pointer"
              >
                <span className="text-2xl">{preset.icon}</span>
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">
                    {preset.name.split(' ')[0]}
                  </span>
                  <span className="text-xs text-slate-500">
                    {preset.inputs.tankCapacity}L tank
                  </span>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Plain language note */}
        <motion.p
          variants={itemVariants}
          className="mt-8 text-xs text-slate-500"
        >
          Actual water collected may vary depending on your roof and pipes.
        </motion.p>
      </motion.div>
    </div>
  );
};
