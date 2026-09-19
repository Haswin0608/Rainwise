import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Share2, 
  Check, 
  Droplet, 
  AlertTriangle, 
  Home, 
  CloudRain, 
  Recycle, 
  CheckCircle2, 
  ShieldAlert, 
  Container, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { CalculationResult } from '../types';
import { AnimatedCounter } from './AnimatedCounter';
import { WaterBarChart } from './WaterBarChart';
import { TankVisualizer } from './TankVisualizer';
import { EducationalSection } from './EducationalSection';

interface ResultsPageProps {
  result: CalculationResult;
  onAdjustInputs: () => void;
  onReset: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onAdjustInputs,
  onReset,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    const text = `RainWise Rainwater Harvest Report:
• Roof Area: ${result.roofArea} m²
• Rainfall: ${result.rainfall} mm
• Potential Water: ${result.potentialWater.toLocaleString()} L
• Harvestable Water: ${result.harvestableWater.toLocaleString()} L
• Actually Harvested: ${result.actuallyHarvested.toLocaleString()} L
• Wasted to Overflow: ${result.wastedWater.toLocaleString()} L
• Tank Capacity: ${result.tankCapacity.toLocaleString()} L
${result.supplyDays ? `• Water Supply Days: ${result.supplyDays} days (${result.dailyRequirement}L/day)` : ''}
${result.summarySentence}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          id="results-adjust-btn"
          onClick={onAdjustInputs}
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-800 bg-teal-50 hover:bg-teal-100/80 px-3.5 py-2 rounded-xl border border-teal-200/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Adjust Inputs / Recalculate</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="results-copy-summary-btn"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            id="results-start-over-btn"
            onClick={onReset}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200/90 px-3.5 py-2 rounded-xl transition-colors shadow-2xs"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Start Over</span>
          </button>
        </div>
      </div>

      {/* Auto-Generated Summary Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`p-6 sm:p-7 rounded-3xl border shadow-xs relative overflow-hidden ${
          result.wastedWater > 0
            ? 'bg-gradient-to-br from-amber-500/10 via-white to-slate-50 border-amber-300/80'
            : 'bg-gradient-to-br from-teal-500/10 via-white to-slate-50 border-teal-300/80'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 bg-white/90 border shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-700" />
              <span className="text-slate-800">Harvest Analysis Summary</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-900 leading-snug">
              {result.summarySentence}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] text-slate-500 block uppercase font-medium">Harvest Rate</span>
              <span className="text-xl font-bold font-['Outfit',sans-serif] text-emerald-600">
                <AnimatedCounter value={result.harvestEfficiencyRate} suffix="%" />
              </span>
            </div>
            <div className="text-center px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] text-slate-500 block uppercase font-medium">Tank Fill</span>
              <span className="text-xl font-bold font-['Outfit',sans-serif] text-teal-700">
                <AnimatedCounter value={result.storageUtilizationRate} suffix="%" />
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* The 8 Clean Stat Cards */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold font-['Outfit',sans-serif] text-slate-900">
            Harvesting Metrics & Calculations
          </h3>
          <span className="text-xs text-slate-500">Live animated totals</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: 🏠 Roof Area */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Roof Area</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Home className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-slate-900">
              <AnimatedCounter value={result.roofArea} decimals={1} suffix=" m²" />
            </div>
            <p className="text-[12px] text-slate-500 mt-1">Catchment plane surface</p>
          </div>

          {/* Card 2: 🌧️ Rainfall */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Rainfall</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-sky-700">
                <CloudRain className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-slate-900">
              <AnimatedCounter value={result.rainfall} suffix=" mm" />
            </div>
            <p className="text-[12px] text-slate-500 mt-1">Total depth of rain event</p>
          </div>

          {/* Card 3: 💧 Potential Rainwater */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Potential Rainwater</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-700">
                <Droplet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-cyan-900">
              <AnimatedCounter value={result.potentialWater} suffix=" L" />
            </div>
            <p className="text-[12px] text-slate-500 mt-1">100% theoretical precipitation</p>
          </div>

          {/* Card 4: ♻️ Harvestable Rainwater */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Harvestable Rainwater</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                <Recycle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-teal-900">
              <AnimatedCounter value={result.harvestableWater} suffix=" L" />
            </div>
            <p className="text-[12px] text-slate-500 mt-1">{result.efficiency}% collection efficiency</p>
          </div>

          {/* Card 5: ✅ Actually Harvested (green accent) */}
          <div className="bg-gradient-to-b from-emerald-50/50 to-white p-5 rounded-2xl border-2 border-emerald-500/80 shadow-xs hover:shadow-sm transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <span>Actually Harvested</span>
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-emerald-800">
              <AnimatedCounter value={result.actuallyHarvested} suffix=" L" />
            </div>
            <p className="text-[12px] text-emerald-700/90 mt-1 font-medium">
              Saved safely in reservoir
            </p>
          </div>

          {/* Card 6: 🚫 Wasted Water (red/amber accent — visually prominent) */}
          <div className={`p-5 rounded-2xl border-2 shadow-xs hover:shadow-sm transition-all ${
            result.wastedWater > 0
              ? 'bg-gradient-to-b from-amber-50/90 to-white border-amber-500 ring-2 ring-amber-500/15'
              : 'bg-white border-slate-200/80'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1 ${
                result.wastedWater > 0 ? 'text-amber-900 font-bold' : 'text-slate-500'
              }`}>
                <span>Wasted Water</span>
                {result.wastedWater > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 font-bold">
                    OVERFLOW
                  </span>
                )}
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                result.wastedWater > 0 ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
              }`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] ${
              result.wastedWater > 0 ? 'text-amber-900 font-extrabold' : 'text-slate-700'
            }`}>
              <AnimatedCounter value={result.wastedWater} suffix=" L" />
            </div>
            <p className={`text-[12px] mt-1 font-medium ${
              result.wastedWater > 0 ? 'text-amber-800' : 'text-slate-500'
            }`}>
              {result.wastedWater > 0 ? 'Lost due to tank capacity limit' : 'Zero overflow loss!'}
            </p>
          </div>

          {/* Card 7: 🛢️ Tank Capacity */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tank Capacity</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <Container className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-slate-900">
              <AnimatedCounter value={result.tankCapacity} suffix=" L" />
            </div>
            <p className="text-[12px] text-slate-500 mt-1">
              {result.storageUtilizationRate}% utilized in this rain event
            </p>
          </div>

          {/* Card 8: 📅 Water Supply Days */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Water Supply Days</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-700">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-purple-950">
              {result.supplyDays !== undefined ? (
                <AnimatedCounter value={result.supplyDays} decimals={1} suffix=" days" />
              ) : (
                <span className="text-slate-400 text-xl font-normal">Not specified</span>
              )}
            </div>
            <p className="text-[12px] text-slate-500 mt-1">
              {result.dailyRequirement 
                ? `@ ${result.dailyRequirement}L/day requirement`
                : 'Enter daily usage to calculate'}
            </p>
          </div>

        </div>
      </div>

      {/* Visual Bar Chart Section */}
      <WaterBarChart result={result} />

      {/* Storage Tank Cutaway Visualizer */}
      <TankVisualizer result={result} />

      {/* Educational Section ("The Math Behind It") */}
      <EducationalSection result={result} />

      {/* Disclaimer */}
      <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200/70 flex items-start gap-3 text-xs text-slate-500">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="leading-relaxed">
          <strong>Technical Disclaimer:</strong> Calculations provide theoretical engineering estimates based on projected roof area and entered precipitation depth. Actual water collection varies depending on roof surface material (e.g., corrugated metal vs. asphalt shingles), slope angle, first-flush diverter diversion volumes, gutter cleaning maintenance, wind drift loss, and localized microclimate patterns.
        </p>
      </div>

    </div>
  );
};
