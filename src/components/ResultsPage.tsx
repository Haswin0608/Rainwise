import React from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Info,
  CheckCircle2,
  AlertTriangle,
  Share2,
  Check
} from 'lucide-react';
import { CalculationResult } from '../types';
import { AnimatedCounter } from './AnimatedCounter';
import { WaterBarChart } from './WaterBarChart';
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
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    const text = `RainWise Rainwater Harvest Results:
• Roof Size: ${result.roofArea} m²
• Rain Fell: ${result.rainfall} mm
• Total Rain on Roof: ${result.potentialWater.toLocaleString()} litres
• Water You Can Save: ${result.actuallyHarvested.toLocaleString()} litres
• Water You're Losing: ${result.wastedWater.toLocaleString()} litres
• Tank Size: ${result.tankCapacity.toLocaleString()} litres
${result.supplyDays ? `• Days Water Will Last: ${result.supplyDays} days` : ''}

${result.summarySentence}
${result.suggestionLine}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-7">
      
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          id="results-adjust-btn"
          onClick={onAdjustInputs}
          className="inline-flex items-center gap-2 text-base font-semibold text-teal-900 bg-white hover:bg-teal-50 px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5 text-teal-700" />
          <span>Change Measurements</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="results-copy-btn"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer min-h-[44px]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>Share Results</span>
              </>
            )}
          </button>

          <button
            id="results-start-over-btn"
            onClick={onReset}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Start Over</span>
          </button>
        </div>
      </div>

      {/* Plain Language Summary Sentence at Top */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`p-6 sm:p-7 rounded-3xl border shadow-xs ${
          result.wastedWater > 0
            ? 'bg-amber-50/90 border-amber-200/90'
            : 'bg-emerald-50/90 border-emerald-200/90'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl shrink-0">
            {result.wastedWater > 0 ? '⚠️' : '🎉'}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-900 leading-snug">
              {result.summarySentence}
            </h2>
            {result.suggestionLine && (
              <p className="text-base sm:text-lg text-slate-700 font-medium mt-2">
                {result.suggestionLine}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* The Two Emotional Highlights: "Water You Can Save" vs "Water You're Losing" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* ✅ "Water You Can Save" (Green, Large, Most Prominent Number) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-emerald-50 border-2 border-emerald-500 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base sm:text-lg font-bold text-emerald-900 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span>Water You Can Save</span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-200/70 text-emerald-900">
              Safe In Tank
            </span>
          </div>

          <div className="my-2">
            <div className="text-4xl sm:text-5xl font-extrabold font-['Outfit',sans-serif] text-emerald-800 tracking-tight">
              <AnimatedCounter value={result.actuallyHarvested} suffix=" litres" />
            </div>
            <p className="text-sm text-emerald-700 font-medium mt-2">
              Stored safely in your {result.tankCapacity.toLocaleString()}L tank ready for use.
            </p>
          </div>
        </div>

        {/* 🚫 "Water You're Losing" (Orange/Red, Second Most Prominent — Emotional Highlight) */}
        <div className={`p-6 sm:p-7 rounded-3xl border-2 shadow-sm flex flex-col justify-between ${
          result.wastedWater > 0
            ? 'bg-rose-50 border-rose-500'
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-base sm:text-lg font-bold flex items-center gap-2 ${
              result.wastedWater > 0 ? 'text-rose-900' : 'text-slate-800'
            }`}>
              <span className="text-2xl">🚫</span>
              <span>Water You&apos;re Losing</span>
            </span>
            {result.wastedWater > 0 ? (
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-200 text-rose-900">
                Overflowing
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Zero Loss
              </span>
            )}
          </div>

          <div className="my-2">
            <div className={`text-4xl sm:text-5xl font-extrabold font-['Outfit',sans-serif] tracking-tight ${
              result.wastedWater > 0 ? 'text-rose-700' : 'text-slate-700'
            }`}>
              <AnimatedCounter value={result.wastedWater} suffix=" litres" />
            </div>
            <p className={`text-sm font-medium mt-2 ${
              result.wastedWater > 0 ? 'text-rose-800' : 'text-slate-600'
            }`}>
              {result.wastedWater > 0
                ? 'Water spilled away because your tank was full.'
                : 'Great! All of the collectable rain fits inside your tank.'}
            </p>
          </div>
        </div>

      </div>

      {/* Supporting Cards with Plain Language Labels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* 🏠 Your Roof Size */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-2xl mb-1">🏠</div>
          <div className="text-xs sm:text-sm font-semibold text-slate-500">
            Your Roof Size
          </div>
          <div className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-900 mt-1">
            <AnimatedCounter value={result.roofArea} decimals={1} suffix=" m²" />
          </div>
        </div>

        {/* 🌧️ Rain That Fell */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-2xl mb-1">🌧️</div>
          <div className="text-xs sm:text-sm font-semibold text-slate-500">
            Rain That Fell
          </div>
          <div className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-900 mt-1">
            <AnimatedCounter value={result.rainfall} suffix=" mm" />
          </div>
        </div>

        {/* 💧 Total Rain on Your Roof */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-2xl mb-1">💧</div>
          <div className="text-xs sm:text-sm font-semibold text-slate-500">
            Total Rain on Your Roof
          </div>
          <div className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-900 mt-1">
            <AnimatedCounter value={result.potentialWater} suffix=" L" />
          </div>
        </div>

        {/* 🛢️ Your Tank Size */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="text-2xl mb-1">🛢️</div>
          <div className="text-xs sm:text-sm font-semibold text-slate-500">
            Your Tank Size
          </div>
          <div className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-900 mt-1">
            <AnimatedCounter value={result.tankCapacity} suffix=" L" />
          </div>
        </div>

      </div>

      {/* 📅 This Water Will Last You ___ Days (if daily need entered) */}
      {result.supplyDays !== undefined && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="text-3xl shrink-0">📅</div>
          <div>
            <div className="text-sm font-semibold text-slate-500">
              How Long This Water Lasts
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-slate-900 mt-0.5">
              This Water Will Last You <span className="text-teal-800">{result.supplyDays} Days</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Based on roughly {result.dailyRequirement} litres used per day.
            </p>
          </div>
        </div>
      )}

      {/* ONE Simple Bar Chart: "Rain that fell" vs "Water saved" vs "Water wasted" */}
      <WaterBarChart result={result} />

      {/* Expandable "How This Works" Section */}
      <EducationalSection result={result} />

      {/* Plain Language Note */}
      <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-200 text-slate-600 text-xs sm:text-sm flex items-start gap-2.5">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong>Please note:</strong> Actual water collected may vary depending on your roof and pipes.
        </p>
      </div>

    </div>
  );
};
