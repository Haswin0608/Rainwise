import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Info,
  Share2,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CalculationResult } from '../types';
import { AnimatedCounter } from './AnimatedCounter';
import { WaterBarChart } from './WaterBarChart';
import { EducationalSection } from './EducationalSection';
import { ContextualTipCard } from './ContextualTipCard';
import { useAppSettings } from '../context/AppSettingsContext';
import { litersToGallons, mmToInches, sqMetersToSqFeet, metersToFeet } from '../utils/units';

interface ResultsPageProps {
  result: CalculationResult;
  onAdjustInputs: () => void;
  onReset: () => void;
  onOpenTips?: (tipId?: string) => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onAdjustInputs,
  onReset,
  onOpenTips = () => {},
}) => {
  const [copied, setCopied] = useState(false);
  const [showRoofBreakdown, setShowRoofBreakdown] = useState(false);
  const { unit, formatVolume, formatVolumeFull, formatRainfall, formatArea, formatLength } = useAppSettings();

  const isImperial = unit === 'imperial';

  // Formatted numbers based on active unit
  const displayActuallyHarvested = isImperial ? Math.round(litersToGallons(result.actuallyHarvested)) : result.actuallyHarvested;
  const displayWastedWater = isImperial ? Math.round(litersToGallons(result.wastedWater)) : result.wastedWater;
  const displayRoofArea = isImperial ? Math.round(sqMetersToSqFeet(result.roofArea)) : result.roofArea;
  const displayRainfall = isImperial ? Number(mmToInches(result.annualRainfallMm).toFixed(2)) : result.annualRainfallMm;
  const displayPotentialWater = isImperial ? Math.round(litersToGallons(result.potentialWater)) : result.potentialWater;
  const displayTankCapacity = isImperial ? Math.round(litersToGallons(result.tankCapacity)) : result.tankCapacity;

  const handleCopy = () => {
    const roofsText = result.roofs && result.roofs.length > 0
      ? result.roofs.map(r => `${r.name}: ${formatArea(r.area)}`).join(', ')
      : formatArea(result.roofArea);

    const text = `RainWise Rainwater Harvest Results:
• Total Roof Size: ${formatArea(result.roofArea)} (${roofsText})
• Typical Yearly Rain: ${formatRainfall(result.annualRainfallMm)} (Based on 3-year Open-Meteo archive for ${result.locationName || 'your location'})
• Total Rain on Your Roof: ${formatVolumeFull(result.potentialWater)}
• Water You Can Save: ${formatVolumeFull(result.actuallyHarvested)} (${result.savedComparison.primaryText})
• Water You're Losing: ${formatVolumeFull(result.wastedWater)} (${result.wastedComparison.primaryText})
• Tank Size: ${formatVolumeFull(result.tankCapacity)}
${result.supplyDays ? `• Days Water Will Last: ${result.supplyDays} days` : ''}

${result.summarySentence}
${result.suggestionLine}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const hasMultipleRoofs = result.roofs && result.roofs.length > 1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-7">
      
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          id="results-adjust-btn"
          onClick={onAdjustInputs}
          className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-teal-300 bg-[#131d2e] hover:bg-[#1b2a42] px-4 py-2.5 rounded-xl border border-[#24354c] shadow-2xs transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5 text-teal-400" />
          <span>Change Measurements</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="results-copy-btn"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200 bg-[#131d2e] hover:bg-[#1b2a42] border border-[#24354c] px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer min-h-[44px]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-400" />
                <span>Share Results</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="results-start-over-btn"
            onClick={onReset}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white bg-[#131d2e] hover:bg-[#1b2a42] border border-[#24354c] px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer min-h-[44px]"
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
            ? 'bg-[#261814] border-amber-500/40 text-slate-100'
            : 'bg-[#0f2820] border-emerald-500/40 text-slate-100'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl shrink-0">
            {result.wastedWater > 0 ? '⚠️' : '🎉'}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-100 leading-snug">
              {result.summarySentence}
            </h2>
            {result.suggestionLine && (
              <p className="text-base sm:text-lg text-slate-300 font-medium mt-2">
                {result.suggestionLine}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* The Two Emotional Highlights: "Water You Can Save" vs "Water You're Losing" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* ✅ "Water You Can Save" (Green, Large, Most Prominent Number) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-[#0c2920] border-2 border-emerald-500/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base sm:text-lg font-bold text-emerald-300 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span>Water You Can Save</span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300">
              Safe In Tank
            </span>
          </div>

          <div className="my-2 space-y-3">
            <div>
              <div className="text-4xl sm:text-5xl font-extrabold font-['Outfit',sans-serif] text-emerald-300 tracking-tight">
                <AnimatedCounter
                  value={displayActuallyHarvested}
                  suffix={isImperial ? ' gallons' : ' litres'}
                />
              </div>

              {/* Relatable Comparison Subtext directly under main number */}
              <div className="mt-2.5 px-3 py-2 rounded-xl bg-[#081f18] border border-emerald-700/50 text-slate-200">
                <div className="flex items-start gap-2 text-sm sm:text-base font-semibold">
                  <span className="text-lg leading-tight shrink-0">{result.savedComparison.icon}</span>
                  <span className="text-slate-100">{result.savedComparison.primaryText}</span>
                </div>
                {result.savedComparison.dailyNeedText && (
                  <p className="text-xs text-emerald-300 font-medium mt-1 pl-6">
                    {result.savedComparison.dailyNeedText}
                  </p>
                )}
              </div>
            </div>

            <p className="text-sm text-emerald-300/90 font-medium">
              Stored safely in your {formatVolume(result.tankCapacity)} tank ready for use.
            </p>
          </div>
        </div>

        {/* 🚫 "Water You're Losing" (Orange/Red, Second Most Prominent — Emotional Highlight) */}
        <div className={`p-6 sm:p-7 rounded-3xl border-2 shadow-sm flex flex-col justify-between ${
          result.wastedWater > 0
            ? 'bg-[#291616] border-rose-500/80'
            : 'bg-[#131d2e] border-[#24354c]'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-base sm:text-lg font-bold flex items-center gap-2 ${
              result.wastedWater > 0 ? 'text-rose-300' : 'text-slate-200'
            }`}>
              <span className="text-2xl">🚫</span>
              <span>Water You&apos;re Losing</span>
            </span>
            {result.wastedWater > 0 ? (
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-950 border border-rose-700/60 text-rose-300">
                Overflowing
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300">
                Zero Loss
              </span>
            )}
          </div>

          <div className="my-2 space-y-3">
            <div>
              <div className={`text-4xl sm:text-5xl font-extrabold font-['Outfit',sans-serif] tracking-tight ${
                result.wastedWater > 0 ? 'text-rose-400' : 'text-slate-200'
              }`}>
                <AnimatedCounter
                  value={displayWastedWater}
                  suffix={isImperial ? ' gallons' : ' litres'}
                />
              </div>

              {/* Relatable Comparison Subtext directly under main number */}
              <div className={`mt-2.5 px-3 py-2 rounded-xl border text-sm ${
                result.wastedWater > 0
                  ? 'bg-[#1f0e0e] border-rose-700/50 text-slate-200'
                  : 'bg-[#1a2538] border-[#334155] text-slate-200'
              }`}>
                <div className="flex items-start gap-2 text-sm sm:text-base font-semibold">
                  <span className="text-lg leading-tight shrink-0">{result.wastedComparison.icon}</span>
                  <span className="text-slate-100">{result.wastedComparison.primaryText}</span>
                </div>
                {result.wastedComparison.dailyNeedText && (
                  <p className="text-xs text-rose-300 font-medium mt-1 pl-6">
                    {result.wastedComparison.dailyNeedText}
                  </p>
                )}
              </div>
            </div>

            <p className={`text-sm font-medium ${
              result.wastedWater > 0 ? 'text-rose-300/90' : 'text-slate-300'
            }`}>
              {result.wastedWater > 0
                ? 'Water spilled away because your tank was full.'
                : 'Great! All of the collectable rain fits inside your tank.'}
            </p>
          </div>
        </div>

      </div>

      {/* 💡 CONTEXTUAL TIP CARD: Based directly on this calculation result */}
      <ContextualTipCard
        wastedWater={result.wastedWater}
        actuallyHarvested={result.actuallyHarvested}
        onOpenAllTips={onOpenTips}
      />

      {/* Supporting Cards with Plain Language Labels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        
        {/* 🏠 Your Roof Size with Expandable Multiple Roof Breakdown */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131d2e] border border-[#24354c] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-2xl mb-1">🏠</div>
              {hasMultipleRoofs && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                  {result.roofs.length} roofs
                </span>
              )}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-400">
              Your Roof Size
            </div>
            <div className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-100 mt-1">
              <AnimatedCounter
                value={displayRoofArea}
                decimals={isImperial ? 0 : 1}
                suffix={isImperial ? ' sq ft' : ' m²'}
              />
            </div>
          </div>

          {/* Small Expandable Breakdown */}
          {result.roofs && result.roofs.length > 0 && (
            <div className="mt-3 pt-2 border-t border-[#1e293b]">
              <button
                type="button"
                id="results-roof-breakdown-toggle"
                onClick={() => setShowRoofBreakdown(!showRoofBreakdown)}
                className="w-full text-left text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center justify-between py-1 cursor-pointer"
              >
                <span>{showRoofBreakdown ? 'Hide individual roofs' : 'See roof breakdown'}</span>
                {showRoofBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <AnimatePresence>
                {showRoofBreakdown && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-2.5 rounded-xl bg-[#0e1624] border border-[#24354c] text-xs text-slate-300 space-y-1.5">
                      {result.roofs.map((r, i) => (
                        <div key={r.id || i} className="flex justify-between items-center">
                          <span className="font-medium text-slate-200">{r.name}:</span>
                          <span>
                            <strong className="text-slate-100">{formatArea(r.area)}</strong>{' '}
                            <span className="text-slate-400 text-[10px]">
                              ({formatLength(r.length)}×{formatLength(r.width)})
                            </span>
                          </span>
                        </div>
                      ))}
                      <div className="pt-1.5 border-t border-[#24354c] font-bold text-slate-100 flex justify-between">
                        <span>Total:</span>
                        <span>{formatArea(result.roofArea)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* 🌧️ Rain That Fell */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131d2e] border border-[#24354c] shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-2xl mb-1">🌧️</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-400">
              Rain That Fell
            </div>
            <div className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-100 mt-1">
              <AnimatedCounter
                value={displayRainfall}
                decimals={isImperial ? 2 : 0}
                suffix={isImperial ? ' in' : ' mm'}
              />
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#1e293b] text-[11px] font-medium text-slate-400">
            {result.weatherInfo?.isAutoFetched ? (
              <span className="text-teal-300 font-semibold flex items-center gap-1">
                <span>📍 Auto-fetched</span>
                <span className="truncate">({result.weatherInfo.locationName})</span>
              </span>
            ) : result.weatherInfo ? (
              <span className="text-slate-400">
                ✏️ Edited ({result.weatherInfo.locationName})
              </span>
            ) : (
              <span className="text-slate-400">
                ✏️ Manually entered
              </span>
            )}
          </div>
        </div>

        {/* 💧 Total Rain on Your Roof */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131d2e] border border-[#24354c] shadow-2xs">
          <div className="text-2xl mb-1">💧</div>
          <div className="text-xs sm:text-sm font-semibold text-slate-400">
            Total Rain on Your Roof
          </div>
          <div className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-100 mt-1">
            <AnimatedCounter
              value={displayPotentialWater}
              suffix={isImperial ? ' gal' : ' L'}
            />
          </div>
        </div>

        {/* 🛢️ Your Tank Size */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#131d2e] border border-[#24354c] shadow-2xs">
          <div className="text-2xl mb-1">🛢️</div>
          <div className="text-xs sm:text-sm font-semibold text-slate-400">
            Your Tank Size
          </div>
          <div className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-100 mt-1">
            <AnimatedCounter
              value={displayTankCapacity}
              suffix={isImperial ? ' gal' : ' L'}
            />
          </div>
        </div>

      </div>

      {/* 📅 This Water Will Last You ___ Days (if daily need entered) */}
      {result.supplyDays !== undefined && (
        <div className="p-5 rounded-2xl bg-[#131d2e] border border-[#24354c] shadow-2xs flex items-center gap-4">
          <div className="text-3xl shrink-0">📅</div>
          <div>
            <div className="text-sm font-semibold text-slate-400">
              How Long This Water Lasts
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-slate-100 mt-0.5">
              This Water Will Last You <span className="text-teal-400 font-extrabold">{result.supplyDays} Days</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Based on roughly {formatVolume(result.dailyRequirement || 0)} used per day.
            </p>
          </div>
        </div>
      )}

      {/* UPGRADED INTERACTIVE CHART (Today's Breakdown vs This Week 7-Day Forecast) */}
      <WaterBarChart result={result} onGoToCalculator={onAdjustInputs} />

      {/* Expandable "How This Works" Section */}
      <EducationalSection result={result} />

      {/* Plain Language Note */}
      <div className="p-4 rounded-2xl bg-[#0e1624] border border-[#24354c] text-slate-300 text-xs sm:text-sm flex items-start gap-2.5">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong>Please note:</strong> Actual water collected may vary depending on your roof and pipes.
        </p>
      </div>

    </div>
  );
};
