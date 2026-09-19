import React from 'react';
import { motion, type Variants } from 'motion/react';
import { ArrowRight, Droplet, ShieldAlert, Sparkles, Waves, BarChart2, Layers } from 'lucide-react';
import { PRESET_SCENARIOS } from '../utils/calculations';
import { PresetScenario } from '../types';

interface HomePageProps {
  onStartCalculate: () => void;
  onSelectPreset: (preset: PresetScenario) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onStartCalculate,
  onSelectPreset,
}) => {
  // Stagger variants for entrance
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 sm:px-6 py-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl mx-auto text-center flex flex-col items-center"
      >
        {/* Soft Droplet Accent Badge */}
        <motion.div
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/70 border border-teal-200/80 text-teal-800 text-xs sm:text-sm font-medium shadow-xs mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-teal-600 animate-ping" />
          <Droplet className="w-3.5 h-3.5 text-teal-700" />
          <span>Intelligent Rainwater Mensuration & Loss Calculator</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-6xl lg:text-7xl font-bold font-['Outfit',sans-serif] tracking-tight text-slate-900 leading-[1.1] mb-6"
        >
          Rain<span className="text-teal-700">Wise</span>
        </motion.h1>

        {/* Short Tagline */}
        <motion.p
          variants={itemVariants}
          className="text-lg sm:text-2xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed mb-10"
        >
          Discover your true rainwater harvesting potential — calculate exact harvestable yields and quantify water wasted to tank overflow.
        </motion.p>

        {/* The Two Core Questions Cards */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-left"
        >
          {/* Harvested card */}
          <div className="p-5 rounded-2xl bg-white/90 border border-teal-200/70 shadow-xs relative overflow-hidden group hover:border-teal-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3">
              <Droplet className="w-5 h-5" />
            </div>
            <h3 className="font-['Outfit',sans-serif] font-semibold text-slate-900 text-base mb-1 flex items-center gap-2">
              <span>Harvestable Rainwater</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Saved</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Calculate the actual litres you can capture from your roof footprint based on real rainfall, runoff efficiency, and storage limits.
            </p>
          </div>

          {/* Wasted card */}
          <div className="p-5 rounded-2xl bg-white/90 border border-amber-200/70 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-['Outfit',sans-serif] font-semibold text-slate-900 text-base mb-1 flex items-center gap-2">
              <span>Wasted Runoff Overflow</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Overflow</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Identify lost water volume when rain events exceed your tank capacity, helping you optimize reservoir sizing.
            </p>
          </div>
        </motion.div>

        {/* Single Prominent CTA Button: "Calculate →" */}
        <motion.div variants={itemVariants} className="mb-14">
          <button
            id="home-calculate-cta"
            onClick={onStartCalculate}
            className="group relative inline-flex items-center gap-3 px-8 py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-teal-700 via-teal-800 to-slate-800 rounded-2xl shadow-md shadow-teal-900/20 hover:shadow-lg hover:shadow-teal-900/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/40"
          >
            <span>Calculate</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-200" />
            {/* Subtle animated water shine */}
            <span className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <span className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 group-hover:left-full transition-all duration-700" />
            </span>
          </button>
        </motion.div>

        {/* Quick Presets / Examples for fast exploring */}
        <motion.div variants={itemVariants} className="w-full max-w-2xl">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Or test with a representative scenario</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {PRESET_SCENARIOS.map((preset) => (
              <button
                key={preset.id}
                id={`home-preset-${preset.id}`}
                onClick={() => onSelectPreset(preset)}
                className="flex flex-col items-center p-3 rounded-xl bg-white/70 hover:bg-white border border-slate-200/80 hover:border-teal-300 shadow-2xs hover:shadow-xs transition-all text-center group"
              >
                <span className="text-xl mb-1 group-hover:scale-110 transition-transform">
                  {preset.icon}
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {preset.name}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {preset.inputs.tankCapacity}L tank • {preset.inputs.rainfall}mm
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Methodological reassurance footer */}
        <motion.div
          variants={itemVariants}
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500"
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-teal-700" />
            <span>Mensuration (Roof Area m²)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Waves className="w-4 h-4 text-teal-700" />
            <span>Unit Conversion (1mm / 1m² ≈ 1 Litre)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-teal-700" />
            <span>Capacity & Supply Analysis</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
