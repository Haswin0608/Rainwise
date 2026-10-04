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
    <div className="w-full p-4 sm:p-6 rounded-3xl bg-[#131d2e] border border-[#24354c] shadow-xs">
      
      {/* Header explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-300">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Rainfall Capture Visual</span>
          </div>
          <h3 className="font-['Outfit',sans-serif] font-bold text-lg sm:text-xl text-white">
            What Happens When Rain Hits Your Roof?
          </h3>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e1626] text-teal-300 text-xs font-semibold self-start sm:self-auto border border-[#24354c]">
          <span className="text-slate-300">{roofTypeLabel}:</span>
          <strong className="text-teal-300">{harvestPct}% captured</strong>
        </div>
      </div>

      {/* Visual Water-Drop Split Diagram */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        
        {/* Left: Animated Big Water Drops */}
        <div className="flex items-center justify-around py-4 px-4 rounded-2xl bg-[#0e1626] border border-[#1e293b] shadow-2xs">
          
          {/* Green Captured Drop */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.8, y: 5 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2.2, ease: 'easeInOut' }}
              className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full rounded-tr-none rotate-45 bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-700/30 mb-2"
            >
              <span className="-rotate-45 font-['Outfit',sans-serif] font-black text-lg sm:text-xl text-white">
                {harvestPct}%
              </span>
            </motion.div>
            <span className="font-bold text-emerald-300 text-sm sm:text-base">
              Water Collected
            </span>
            <span className="text-xs font-extrabold text-white">
              {formatVolumeFull(harvestableWaterL)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Flows straight into pipes
            </span>
          </div>

          <div className="text-2xl text-slate-500 font-light">+</div>

          {/* Muted Lost Drop */}
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.85, y: -4 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2.5, ease: 'easeInOut', delay: 0.3 }}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full rounded-tr-none rotate-45 bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-md shadow-amber-600/20 mb-2"
            >
              <span className="-rotate-45 font-['Outfit',sans-serif] font-bold text-sm sm:text-base text-slate-950">
                {lostPct}%
              </span>
            </motion.div>
            <span className="font-bold text-amber-300 text-xs sm:text-sm">
              Natural Loss
            </span>
            <span className="text-xs font-bold text-slate-200">
              {formatVolumeFull(waterLostL)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Splashed, absorbed, evaporated
            </span>
          </div>

        </div>

        {/* Right: Plain-Language Summary Box */}
        <div className="space-y-2 text-xs sm:text-sm text-slate-200">
          <div className="p-3.5 rounded-2xl bg-[#0e1626] border border-[#1e293b] shadow-2xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="text-base">💧</span>
              <span>The Simple Golden Rule</span>
            </div>
            <p className="text-xs text-slate-200">
              <strong className="text-white">1 mm of rain on 1 m² of roof = 1 litre of clean water.</strong>
            </p>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Total rain falling on your roof is{' '}
              <strong className="text-slate-100">
                {formatVolumeFull(potentialWaterL)}
              </strong>
              . Your {roofTypeLabel.toLowerCase()} roof lets you collect{' '}
              <strong className="text-emerald-300">
                {formatVolumeFull(harvestableWaterL)}
              </strong>
              .
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0a2528] border border-teal-600/60 text-[11px] text-teal-200 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>
              Tip: Keeping your gutters and roof clean before monsoons helps you capture closer to 100%!
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};
