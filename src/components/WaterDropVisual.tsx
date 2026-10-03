import React from 'react';
import { motion } from 'motion/react';
import { Droplet, Info, ShieldCheck, Sparkles } from 'lucide-react';
import { useAppSettings } from '../context/AppSettingsContext';

interface WaterDropVisualProps {
  potentialWaterL: number;
  harvestableWaterL: number;
  waterLostL: number;
  runoffCoefficient: number;
  roofTypeLabel: string;
}

export const WaterDropVisual: React.FC<WaterDropVisualProps> = ({
  potentialWaterL,
  harvestableWaterL,
  waterLostL,
  runoffCoefficient,
  roofTypeLabel,
}) => {
  const { unit, formatVolumeFull } = useAppSettings();

  const harvestPct = Math.round(runoffCoefficient * 100);
  const lostPct = 100 - harvestPct;

  return (
    <div className="w-full p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-teal-50/80 via-white to-sky-50/70 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-800/80 border border-teal-200/80 dark:border-teal-900/60 shadow-xs">
      
      {/* Header explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-teal-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rainfall Capture Visual</span>
          </div>
          <h3 className="font-['Outfit',sans-serif] font-bold text-lg sm:text-xl text-slate-900 dark:text-white">
            What Happens When Rain Hits Your Roof?
          </h3>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100/70 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 text-xs font-semibold self-start sm:self-auto border border-teal-200 dark:border-teal-800">
          <span>{roofTypeLabel}:</span>
          <strong>{harvestPct}% captured</strong>
        </div>
      </div>

      {/* Visual Water-Drop Split Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        
        {/* Left: Animated Big Water Drops */}
        <div className="flex items-center justify-around py-3 px-4 rounded-2xl bg-white/80 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs">
          
          {/* Green Captured Drop */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.8, y: 5 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2.2, ease: 'easeInOut' }}
              className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full rounded-tr-none rotate-45 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-700/25 mb-2"
            >
              <span className="-rotate-45 font-['Outfit',sans-serif] font-black text-lg sm:text-xl">
                {harvestPct}%
              </span>
            </motion.div>
            <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm sm:text-base">
              Water Collected
            </span>
            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
              {formatVolumeFull(harvestableWaterL)}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Flows straight into pipes
            </span>
          </div>

          <div className="text-2xl text-slate-300 dark:text-slate-600 font-light">+</div>

          {/* Muted Lost Drop */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.85, y: -4 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2.5, ease: 'easeInOut', delay: 0.3 }}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full rounded-tr-none rotate-45 bg-gradient-to-br from-amber-300 to-amber-500/80 flex items-center justify-center text-amber-950 shadow-md shadow-amber-600/15 mb-2"
            >
              <span className="-rotate-45 font-['Outfit',sans-serif] font-bold text-sm sm:text-base">
                {lostPct}%
              </span>
            </motion.div>
            <span className="font-bold text-amber-700 dark:text-amber-400 text-xs sm:text-sm">
              Natural Loss
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-300">
              {formatVolumeFull(waterLostL)}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Splashed, absorbed, evaporated
            </span>
          </div>

        </div>

        {/* Right: Plain-Language Summary Box */}
        <div className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <span className="text-base">💧</span>
              <span>The Simple Golden Rule</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              <strong>1 mm of rain on 1 m² of roof = 1 litre of clean water.</strong>
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Total rain falling on your roof is{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {formatVolumeFull(potentialWaterL)}
              </strong>
              . Your {roofTypeLabel.toLowerCase()} roof lets you collect{' '}
              <strong className="text-emerald-700 dark:text-emerald-400">
                {formatVolumeFull(harvestableWaterL)}
              </strong>
              .
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/50 dark:border-teal-900/50 text-[11px] text-teal-900 dark:text-teal-200 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>
              Tip: Keeping your gutters and roof clean before monsoons helps you capture closer to 100%!
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
