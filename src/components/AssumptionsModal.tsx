import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, Check, Sliders, Info, Droplets, Settings } from 'lucide-react';
import { PlanningAssumptions, ROOF_TYPES, RoofTypeKey, EverydayConversionFactors } from '../types';
import { DEFAULT_ASSUMPTIONS, DEFAULT_EVERYDAY_CONVERSIONS, toBuckets } from '../utils/calculations';
import { HelpExplainButton } from './HelpExplainButton';

interface AssumptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assumptions: PlanningAssumptions;
  onSaveAssumptions: (newAssumptions: PlanningAssumptions) => void;
}

export const AssumptionsModal: React.FC<AssumptionsModalProps> = ({
  isOpen,
  onClose,
  assumptions,
  onSaveAssumptions,
}) => {
  const [local, setLocal] = useState<PlanningAssumptions>({
    ...assumptions,
    conversions: assumptions.conversions || DEFAULT_EVERYDAY_CONVERSIONS,
  });

  const [showAdvancedDecimals, setShowAdvancedDecimals] = useState(false);

  if (!isOpen) return null;

  const handleResetNormal = () => {
    setLocal(DEFAULT_ASSUMPTIONS);
  };

  const handleSave = () => {
    onSaveAssumptions(local);
    onClose();
  };

  const handleCoeffChangePct = (key: RoofTypeKey, pctVal: number) => {
    const decimal = Math.min(1, Math.max(0.1, pctVal / 100));
    setLocal((prev) => ({
      ...prev,
      runoffCoefficients: {
        ...prev.runoffCoefficients,
        [key]: decimal,
      },
    }));
  };

  const handleCoeffChangeDecimal = (key: RoofTypeKey, decVal: number) => {
    setLocal((prev) => ({
      ...prev,
      runoffCoefficients: {
        ...prev.runoffCoefficients,
        [key]: Math.min(1, Math.max(0.05, decVal)),
      },
    }));
  };

  const handleDemandChange = (field: keyof PlanningAssumptions['demands'], val: number) => {
    setLocal((prev) => ({
      ...prev,
      demands: {
        ...prev.demands,
        [field]: Math.max(0, val),
      },
    }));
  };

  const handleBucketSizeChange = (bucketSizeL: number) => {
    setLocal((prev) => ({
      ...prev,
      conversions: {
        ...(prev.conversions || DEFAULT_EVERYDAY_CONVERSIONS),
        bucketSizeL: Math.max(1, bucketSizeL),
      },
    }));
  };

  const totalPerPersonDailyL =
    local.demands.toilet +
    local.demands.cleaning +
    local.demands.gardening +
    local.demands.vehicle;

  const bucketSizeL = local.conversions?.bucketSizeL || 15;
  const totalBucketsPerPersonDaily = toBuckets(totalPerPersonDailyL, bucketSizeL);

  return (
    <AnimatePresence>
      <div 
        id="assumptions-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assumptions-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-[#131d2e] rounded-3xl shadow-2xl border border-[#24354c] overflow-hidden flex flex-col max-h-[90vh] text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e293b]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/30 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 id="assumptions-title" className="font-['Outfit',sans-serif] font-bold text-lg text-white">
                  Change the numbers
                </h3>
                <p className="text-xs text-slate-400">
                  Customize water use and roof efficiency to match your exact home
                </p>
              </div>
            </div>

            <button
              type="button"
              id="assumptions-close-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#182438] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <div className="px-6 py-5 flex-1 overflow-y-auto space-y-6 text-xs sm:text-sm">
            
            {/* 1. Water each person uses every day (not for drinking) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-1">
                    <span>🚰 Water each person uses every day (not for drinking)</span>
                    <HelpExplainButton termKey="daily_demand" />
                  </h4>
                  <p className="text-xs text-slate-400">
                    For flushing, cleaning, plants and washing vehicles.
                  </p>
                </div>
                <span className="font-extrabold text-teal-300 text-xs px-2.5 py-1 rounded-lg bg-[#0b1120] border border-[#24354c] shrink-0 self-start sm:self-auto">
                  About {totalBucketsPerPersonDaily} buckets per person per day
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#0b1120] border border-[#24354c]">
                  <div className="text-lg mb-1">🚽</div>
                  <label className="block text-[11px] font-semibold text-slate-200">
                    Toilet Flush
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={local.demands.toilet}
                      onChange={(e) => handleDemandChange('toilet', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1 rounded-lg bg-[#131d2e] border border-[#24354c] text-white font-bold text-xs"
                    />
                    <span className="text-[10px] text-slate-400 font-semibold">L</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0b1120] border border-[#24354c]">
                  <div className="text-lg mb-1">🧹</div>
                  <label className="block text-[11px] font-semibold text-slate-200">
                    Cleaning
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={local.demands.cleaning}
                      onChange={(e) => handleDemandChange('cleaning', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1 rounded-lg bg-[#131d2e] border border-[#24354c] text-white font-bold text-xs"
                    />
                    <span className="text-[10px] text-slate-400 font-semibold">L</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0b1120] border border-[#24354c]">
                  <div className="text-lg mb-1">🌱</div>
                  <label className="block text-[11px] font-semibold text-slate-200">
                    Gardening
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={local.demands.gardening}
                      onChange={(e) => handleDemandChange('gardening', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1 rounded-lg bg-[#131d2e] border border-[#24354c] text-white font-bold text-xs"
                    />
                    <span className="text-[10px] text-slate-400 font-semibold">L</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#0b1120] border border-[#24354c]">
                  <div className="text-lg mb-1">🚗</div>
                  <label className="block text-[11px] font-semibold text-slate-200">
                    Vehicles
                  </label>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="number"
                      min={0}
                      max={200}
                      value={local.demands.vehicle}
                      onChange={(e) => handleDemandChange('vehicle', parseInt(e.target.value, 10) || 0)}
                      className="w-full px-2 py-1 rounded-lg bg-[#131d2e] border border-[#24354c] text-white font-bold text-xs"
                    />
                    <span className="text-[10px] text-slate-400 font-semibold">L</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. How much rain each roof catches */}
            <div className="space-y-3 pt-2 border-t border-[#1e293b]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-1">
                    <span>🏠 How much rain each roof catches</span>
                    <HelpExplainButton termKey="runoff_efficiency" />
                  </h4>
                  <p className="text-xs text-slate-400">
                    Smooth, hard roofs catch more rain. Rough roofs catch less.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvancedDecimals(!showAdvancedDecimals)}
                  className="text-[11px] font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  {showAdvancedDecimals ? 'Hide Decimals' : 'Advanced (0.8)'}
                </button>
              </div>

              <div className="space-y-2.5">
                {ROOF_TYPES.map((typeOpt) => {
                  const currentDec = local.runoffCoefficients[typeOpt.key] ?? typeOpt.coefficient;
                  const currentPct = Math.round(currentDec * 100);

                  const displayName = typeOpt.key === 'custom' ? 'Your own roof type' : typeOpt.label;

                  return (
                    <div
                      key={typeOpt.key}
                      className="p-3 rounded-2xl bg-[#0b1120] border border-[#24354c] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{typeOpt.icon}</span>
                        <div>
                          <span className="font-bold text-white text-xs block">{displayName}</span>
                          <span className="text-[11px] text-teal-300 font-semibold">
                            {currentPct} out of 100 drops are caught ({currentPct}%)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <input
                          type="range"
                          min={20}
                          max={98}
                          step={5}
                          value={currentPct}
                          onChange={(e) => handleCoeffChangePct(typeOpt.key, parseInt(e.target.value, 10))}
                          className="accent-teal-400 cursor-pointer w-28 sm:w-32"
                        />

                        {showAdvancedDecimals && (
                          <input
                            type="number"
                            step="0.05"
                            min="0.10"
                            max="0.98"
                            value={currentDec}
                            onChange={(e) => handleCoeffChangeDecimal(typeOpt.key, parseFloat(e.target.value) || 0.8)}
                            className="w-16 px-2 py-1 rounded-lg bg-[#131d2e] border border-[#24354c] text-white font-mono text-xs text-center"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Change bucket size */}
            <div className="space-y-3 pt-2 border-t border-[#1e293b]">
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base flex items-center gap-1">
                  <span>🪣 Change bucket size</span>
                  <HelpExplainButton termKey="bucket_size" />
                </h4>
                <p className="text-xs text-slate-400">
                  Standard household bucket is 15 litres.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#0b1120] border border-[#24354c] flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-300">1 Bucket =</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={bucketSizeL}
                    onChange={(e) => handleBucketSizeChange(parseInt(e.target.value, 10) || 15)}
                    className="w-20 px-3 py-1.5 rounded-xl bg-[#131d2e] border border-[#24354c] text-white font-bold text-sm text-center"
                  />
                  <span className="text-xs font-bold text-teal-300">Litres</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-[#1e293b] flex items-center justify-between gap-3 bg-[#0b1120]">
            <button
              type="button"
              onClick={handleResetNormal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-slate-400 hover:text-white border border-[#24354c] hover:border-slate-600 font-semibold text-xs cursor-pointer transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Go back to normal</span>
            </button>

            <button
              type="button"
              id="assumptions-save-btn"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-950 font-black text-sm shadow-md cursor-pointer transition"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
