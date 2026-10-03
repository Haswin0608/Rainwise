import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, Check, Sliders, Info } from 'lucide-react';
import { PlanningAssumptions, ROOF_TYPES, RoofTypeKey } from '../types';
import { DEFAULT_ASSUMPTIONS } from '../utils/calculations';

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
  const [local, setLocal] = useState<PlanningAssumptions>(assumptions);

  if (!isOpen) return null;

  const handleReset = () => {
    setLocal(DEFAULT_ASSUMPTIONS);
  };

  const handleSave = () => {
    onSaveAssumptions(local);
    onClose();
  };

  const handleCoeffChange = (key: RoofTypeKey, val: number) => {
    setLocal((prev) => ({
      ...prev,
      runoffCoefficients: {
        ...prev.runoffCoefficients,
        [key]: val,
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

  const totalPerPersonDaily =
    local.demands.toilet +
    local.demands.cleaning +
    local.demands.gardening +
    local.demands.vehicle;

  return (
    <AnimatePresence>
      <div 
        id="assumptions-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assumptions-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 id="assumptions-title" className="font-['Outfit',sans-serif] font-bold text-lg text-slate-900 dark:text-white">
                  Calculation Assumptions
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Adjust default parameters to match your exact home conditions
                </p>
              </div>
            </div>

            <button
              type="button"
              id="assumptions-close-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <div className="px-6 py-4 flex-1 overflow-y-auto space-y-6 text-xs sm:text-sm">
            
            {/* 1. Daily Water Demand per person */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>🚰 Non-Drinking Daily Demand per Person</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Average water needed per individual for household non-drinking uses
                  </p>
                </div>
                <span className="font-extrabold text-teal-700 dark:text-teal-300 text-xs px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800">
                  Total: {totalPerPersonDaily} L / person / day
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="text-lg mb-1">🚽</div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Toilet Flush
                  </label>
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={150}
                      value={local.demands.toilet}
                      onChange={(e) => handleDemandChange('toilet', Number(e.target.value))}
                      className="w-full font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-lg px-2 py-1 border border-slate-300 dark:border-slate-600 text-sm"
                    />
                    <span className="text-[11px] text-slate-400">L</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="text-lg mb-1">🧹</div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Cleaning/Mopping
                  </label>
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={80}
                      value={local.demands.cleaning}
                      onChange={(e) => handleDemandChange('cleaning', Number(e.target.value))}
                      className="w-full font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-lg px-2 py-1 border border-slate-300 dark:border-slate-600 text-sm"
                    />
                    <span className="text-[11px] text-slate-400">L</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="text-lg mb-1">🌱</div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Gardening
                  </label>
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={local.demands.gardening}
                      onChange={(e) => handleDemandChange('gardening', Number(e.target.value))}
                      className="w-full font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-lg px-2 py-1 border border-slate-300 dark:border-slate-600 text-sm"
                    />
                    <span className="text-[11px] text-slate-400">L</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="text-lg mb-1">🚗</div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Vehicle Wash
                  </label>
                  <div className="mt-1 flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={local.demands.vehicle}
                      onChange={(e) => handleDemandChange('vehicle', Number(e.target.value))}
                      className="w-full font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-lg px-2 py-1 border border-slate-300 dark:border-slate-600 text-sm"
                    />
                    <span className="text-[11px] text-slate-400">L</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Runoff Coefficients by Roof Type */}
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>🏠 Runoff Coefficients (How much rain drains off)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fraction of rainwater actually captured (remainder lost to absorption or splash)
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROOF_TYPES.map((rt) => {
                  const currentCoeff = local.runoffCoefficients[rt.key] ?? rt.coefficient;
                  return (
                    <div
                      key={rt.key}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{rt.icon}</span>
                        <div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                            {rt.label}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Default: {Math.round(rt.coefficient * 100)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.05"
                          min="0.10"
                          max="1.0"
                          value={currentCoeff}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val > 0 && val <= 1) {
                              handleCoeffChange(rt.key, val);
                            }
                          }}
                          className="w-16 text-right font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-lg px-1.5 py-1 border border-slate-300 dark:border-slate-600 text-xs"
                        />
                        <span className="text-xs font-semibold text-slate-500">
                          ({Math.round(currentCoeff * 100)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Financial & Sizing Parameters */}
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>💰 Financial &amp; Tank Sizing Assumptions</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tariff and system setup costs used for savings and payback calculations
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Water Tariff (₹ per kL)
                  </label>
                  <p className="text-[10px] text-slate-400 mb-1.5">Per 1,000 litres</p>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={local.waterTariffPerKL}
                      onChange={(e) => setLocal({ ...local, waterTariffPerKL: Number(e.target.value) })}
                      className="w-full font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-lg px-2 py-1 border border-slate-300 dark:border-slate-600 text-sm"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Installation Cost (₹)
                  </label>
                  <p className="text-[10px] text-slate-400 mb-1.5">Filters, pipes, gutters</p>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-500">₹</span>
                    <input
                      type="number"
                      step={500}
                      min={1000}
                      max={200000}
                      value={local.installationCostRs}
                      onChange={(e) => setLocal({ ...local, installationCostRs: Number(e.target.value) })}
                      className="w-full font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-lg px-2 py-1 border border-slate-300 dark:border-slate-600 text-sm"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    Dry Days Buffer
                  </label>
                  <p className="text-[10px] text-slate-400 mb-1.5">For recommended tank</p>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={5}
                      max={90}
                      value={local.dryDaysBuffer}
                      onChange={(e) => setLocal({ ...local, dryDaysBuffer: Number(e.target.value) })}
                      className="w-full font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-900 rounded-lg px-2 py-1 border border-slate-300 dark:border-slate-600 text-sm"
                    />
                    <span className="text-[11px] text-slate-400">days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Rainfall Data Source */}
            <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-1.5">
              <div className="flex items-center gap-2 text-teal-900 dark:text-teal-200 font-bold text-xs sm:text-sm">
                <span className="text-base" role="img" aria-label="rain">🌧️</span>
                <span>Rainfall Data Source: Open-Meteo</span>
              </div>
              <p className="text-xs text-teal-800/90 dark:text-teal-300/90 leading-relaxed">
                Rainfall data is automatically loaded based on your location:
              </p>
              <ul className="text-xs text-teal-800/90 dark:text-teal-300/90 list-disc list-inside space-y-0.5 ml-1">
                <li><strong>7-day forecast:</strong> powers short-term live harvest figures.</li>
                <li><strong>3-year historical archive:</strong> powers annual litres, tank sizing, and monthly simulation.</li>
              </ul>
              <p className="text-[11px] text-teal-700/80 dark:text-teal-400/80 italic mt-1">
                Note: Yearly figures are realistic estimates. Real rainfall varies from year to year.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200/60 dark:border-slate-700 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <span>
                Changes saved here will immediately update all calculations, water use durations, and simulation results.
              </span>
            </div>

          </div>

          {/* Footer with Reset & Save */}
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              id="assumptions-reset-btn"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="assumptions-cancel-btn"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="assumptions-save-btn"
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-xl shadow-md transition cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Assumptions</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
