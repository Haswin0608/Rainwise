import React from 'react';
import { motion, type Variants } from 'motion/react';
import { 
  Plus, 
  Building2, 
  CloudRain, 
  Layers, 
  Container, 
  BarChart3, 
  RotateCcw, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { UnfinishedDraftState } from '../utils/buildingStorage';
import { SavedBuilding } from '../types';

interface HomePageProps {
  onCreateNewBuilding: () => void;
  onOpenMyBuildings: () => void;
  savedBuildingsCount: number;
  unfinishedDraft: UnfinishedDraftState | null;
  onContinueDraft: () => void;
  onDiscardDraft: () => void;
  onOpenTips?: () => void;
  onOpenTutorial?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onCreateNewBuilding,
  onOpenMyBuildings,
  savedBuildingsCount,
  unfinishedDraft,
  onContinueDraft,
  onDiscardDraft,
  onOpenTips = () => {},
  onOpenTutorial = () => {},
}) => {
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
        {/* Friendly Top Badge */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs sm:text-sm font-semibold mb-6 shadow-2xs"
        >
          <span>🌧️</span>
          <span>Rainwater Harvesting &amp; Storage Planner • India</span>
        </motion.div>

        {/* Big Bold Headline */}
        <motion.h1
          variants={itemVariants}
          className="text-3xl sm:text-5xl md:text-6xl font-extrabold font-['Outfit',sans-serif] tracking-tight text-white leading-[1.15] mb-4"
        >
          Is your roof losing <br className="hidden sm:inline" />
          <span className="text-teal-400 underline decoration-teal-500 underline-offset-8">
            thousands of litres
          </span>{' '}
          of free rain?
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={itemVariants}
          className="text-base sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto mb-8"
        >
          Measure your roof, connect live rainfall data, and design the optimal storage tank for your house, office, or building.
        </motion.p>

        {/* ───────── UNFINISHED DRAFT BANNER ───────── */}
        {unfinishedDraft && (
          <motion.div
            variants={itemVariants}
            className="w-full max-w-xl mb-8 p-5 rounded-3xl bg-amber-950/50 border border-amber-500/50 text-amber-100 shadow-xl text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Resume Previous Session</span>
              </div>
              <h3 className="font-bold text-base text-white">
                Continue your unfinished building &quot;{unfinishedDraft.draftInfo.name}&quot;?
              </h3>
              <p className="text-xs text-amber-200">
                You have an uncompleted calculation draft in memory.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={onDiscardDraft}
                className="px-3.5 py-2 rounded-xl bg-[#0b1120] hover:bg-[#162235] text-slate-300 hover:text-white border border-[#24354c] text-xs font-bold cursor-pointer"
              >
                Start over
              </button>
              <button
                type="button"
                onClick={onContinueDraft}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md cursor-pointer flex items-center gap-1"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ───────── PRIMARY ACTION BUTTONS: CREATE NEW & MY BUILDINGS ───────── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 w-full max-w-md mx-auto mb-12"
        >
          {/* Create New Building Button */}
          <button
            type="button"
            id="home-create-building-btn"
            onClick={onCreateNewBuilding}
            className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 text-base sm:text-lg font-black text-slate-950 bg-teal-400 hover:bg-teal-300 active:bg-teal-500 rounded-2xl shadow-xl shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer min-h-[56px]"
          >
            <Plus className="w-5 h-5 text-slate-950 stroke-[3]" />
            <span>➕ Create new building</span>
          </button>

          {/* My Buildings Button */}
          <button
            type="button"
            id="home-my-buildings-btn"
            onClick={onOpenMyBuildings}
            className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 text-base sm:text-lg font-bold text-white bg-[#131d2e] hover:bg-[#1b2a40] active:bg-[#0e1626] border border-[#24354c] hover:border-teal-500/50 rounded-2xl shadow-md transition-all cursor-pointer min-h-[56px]"
          >
            <span>🏗️ My Buildings</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/30">
              {savedBuildingsCount}
            </span>
          </button>
        </motion.div>

        {/* ───────── FEATURE PILLARS / HIGHLIGHTS ───────── */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left"
        >
          <div className="p-5 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <CloudRain className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white font-['Outfit',sans-serif]">
              7-Day Live Weather
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Auto-fetches real precipitation forecasts and 3-year historical rainfall for your exact city or GPS pin.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white font-['Outfit',sans-serif]">
              Multi-Roof &amp; Multi-Tank
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Combine multiple concrete, tile, metal, or custom roofs with multiple interconnected storage tanks.
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-sm space-y-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-white font-['Outfit',sans-serif]">
              Saved vs Wasted Analysis
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Clear bucket and litre metrics showing exactly how much water you capture versus what overflows.
            </p>
          </div>
        </motion.div>

        {/* Helpful Tips & Guide shortcut */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex items-center justify-center gap-4 text-xs font-semibold text-slate-400"
        >
          <button
            type="button"
            onClick={onOpenTips}
            className="inline-flex items-center gap-1.5 hover:text-teal-300 cursor-pointer"
          >
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Harvesting Tips &amp; Rules of Thumb</span>
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={onOpenTutorial}
            className="inline-flex items-center gap-1.5 hover:text-teal-300 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span>How to use RainWise</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};
