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
  const displayRainfall = isImperial ? Number(mmToInches(result.rainfall).toFixed(2)) : result.rainfall;
  const displayPotentialWater = isImperial ? Math.round(litersToGallons(result.potentialWater)) : result.potentialWater;
  const displayTankCapacity = isImperial ? Math.round(litersToGallons(result.tankCapacity)) : result.tankCapacity;

  const handleCopy = () => {
    const roofsText = result.roofs && result.roofs.length > 0
      ? result.roofs.map(r => `${r.name}: ${formatArea(r.area)}`).join(', ')
      : formatArea(result.roofArea);

    const text = `RainWise Rainwater Harvest Results:
• Total Roof Size: ${formatArea(result.roofArea)} (${roofsText})
• Rain Fell: ${formatRainfall(result.rainfall)} ${result.weatherInfo?.isAutoFetched ? `(Auto-fetched for ${result.weatherInfo.locationName})` : result.weatherInfo ? `(Edited from weather data for ${result.weatherInfo.locationName})` : '(Manually entered)'}
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
          className="inline-flex items-center gap-2 text-sm sm:text-base font-semibold text-teal-950 dark:text-teal-200 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer min-h-[44px]"
        >
          <ArrowLeft className="w-5 h-5 text-teal-700 dark:text-teal-400" />
          <span>Change Measurements</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="results-copy-btn"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer min-h-[44px]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Share Results</span>
              </>
            )}
          </button>

          <button
            type="button"
            id="results-start-over-btn"
            onClick={onReset}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer min-h-[44px]"
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
            ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-200/90 dark:border-amber-800/60'
            : 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-200/90 dark:border-emerald-800/60'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="text-3xl shrink-0">
            {result.wastedWater > 0 ? '⚠️' : '🎉'}
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-900 dark:text-white leading-snug">
              {result.summarySentence}
            </h2>
            {result.suggestionLine && (
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-medium mt-2">
                {result.suggestionLine}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* The Two Emotional Highlights: "Water You Can Save" vs "Water You're Losing" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* ✅ "Water You Can Save" (Green, Large, Most Prominent Number) */}
        <div className="p-6 sm:p-7 rounded-3xl bg-emerald-50/90 dark:bg-emerald-950/40 border-2 border-emerald-500 dark:border-emerald-600 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base sm:text-lg font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
              <span className="text-2xl">✅</span>
              <span>Water You Can Save</span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-200">
              Safe In Tank
            </span>
          </div>

          <div className="my-2 space-y-3">
            <div>
              <div className="text-4xl sm:text-5xl font-extrabold font-['Outfit',sans-serif] text-emerald-800 dark:text-emerald-300 tracking-tight">
                <AnimatedCounter
                  value={displayActuallyHarvested}
                  suffix={isImperial ? ' gallons' : ' litres'}
                />
              </div>

              {/* Relatable Comparison Subtext directly under main number */}
              <div className="mt-2.5 px-3 py-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-900/40 border border-emerald-300/80 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200">
                <div className="flex items-start gap-2 text-sm sm:text-base font-semibold">
                  <span className="text-lg leading-tight shrink-0">{result.savedComparison.icon}</span>
                  <span>{result.savedComparison.primaryText}</span>
                </div>
                {result.savedComparison.dailyNeedText && (
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium mt-1 pl-6">
                    {result.savedComparison.dailyNeedText}
                  </p>
                )}
              </div>
            </div>

            <p className="text-sm text-emerald-800 dark:text-emerald-300 font-medium">
              Stored safely in your {formatVolume(result.tankCapacity)} tank ready for use.
            </p>
          </div>
        </div>

        {/* 🚫 "Water You're Losing" (Orange/Red, Second Most Prominent — Emotional Highlight) */}
        <div className={`p-6 sm:p-7 rounded-3xl border-2 shadow-sm flex flex-col justify-between ${
          result.wastedWater > 0
            ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-500 dark:border-rose-600'
            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-base sm:text-lg font-bold flex items-center gap-2 ${
              result.wastedWater > 0 ? 'text-rose-950 dark:text-rose-200' : 'text-slate-800 dark:text-slate-200'
            }`}>
              <span className="text-2xl">🚫</span>
              <span>Water You&apos;re Losing</span>
            </span>
            {result.wastedWater > 0 ? (
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-rose-200/80 dark:bg-rose-900/60 text-rose-950 dark:text-rose-200">
                Overflowing
              </span>
            ) : (
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                Zero Loss
              </span>
            )}
          </div>

          <div className="my-2 space-y-3">
            <div>
              <div className={`text-4xl sm:text-5xl font-extrabold font-['Outfit',sans-serif] tracking-tight ${
                result.wastedWater > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
              }`}>
                <AnimatedCounter
                  value={displayWastedWater}
                  suffix={isImperial ? ' gallons' : ' litres'}
                />
              </div>

              {/* Relatable Comparison Subtext directly under main number */}
              <div className={`mt-2.5 px-3 py-2 rounded-xl border text-sm ${
                result.wastedWater > 0
                  ? 'bg-rose-100/70 dark:bg-rose-900/40 border-rose-300/80 dark:border-rose-800/80 text-rose-950 dark:text-rose-200'
                  : 'bg-white/80 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                <div className="flex items-start gap-2 text-sm sm:text-base font-semibold">
                  <span className="text-lg leading-tight shrink-0">{result.wastedComparison.icon}</span>
                  <span>{result.wastedComparison.primaryText}</span>
                </div>
                {result.wastedComparison.dailyNeedText && (
                  <p className="text-xs text-rose-800 dark:text-rose-300 font-medium mt-1 pl-6">
                    {result.wastedComparison.dailyNeedText}
                  </p>
                )}
              </div>
            </div>

            <p className={`text-sm font-medium ${
              result.wastedWater > 0 ? 'text-rose-800 dark:text-rose-300' : 'text-slate-600 dark:text-slate-400'
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
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-2xl mb-1">🏠</div>
              {hasMultipleRoofs && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                  {result.roofs.length} roofs
                </span>
              )}
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
              Your Roof Size
            </div>
            <div className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-900 dark:text-white mt-1">
              <AnimatedCounter
                value={displayRoofArea}
                decimals={isImperial ? 0 : 1}
                suffix={isImperial ? ' sq ft' : ' m²'}
              />
            </div>
          </div>

          {/* Small Expandable Breakdown */}
          {result.roofs && result.roofs.length > 0 && (
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                id="results-roof-breakdown-toggle"
                onClick={() => setShowRoofBreakdown(!showRoofBreakdown)}
                className="w-full text-left text-xs font-semibold text-teal-800 dark:text-teal-300 hover:text-teal-950 dark:hover:text-teal-100 flex items-center justify-between py-1 cursor-pointer"
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
                    <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                      {result.roofs.map((r, i) => (
                        <div key={r.id || i} className="flex justify-between items-center">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{r.name}:</span>
                          <span>
                            <strong>{formatArea(r.area)}</strong>{' '}
                            <span className="text-slate-400 text-[10px]">
                              ({formatLength(r.length)}×{formatLength(r.width)})
                            </span>
                          </span>
                        </div>
                      ))}
                      <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white flex justify-between">
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
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="text-2xl mb-1">🌧️</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
              Rain That Fell
            </div>
            <div className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-900 dark:text-white mt-1">
              <AnimatedCounter
                value={displayRainfall}
                decimals={isImperial ? 2 : 0}
                suffix={isImperial ? ' in' : ' mm'}
              />
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400">
            {result.weatherInfo?.isAutoFetched ? (
              <span className="text-teal-800 dark:text-teal-300 font-semibold flex items-center gap-1">
                <span>📍 Auto-fetched</span>
                <span className="truncate">({result.weatherInfo.locationName})</span>
              </span>
            ) : result.weatherInfo ? (
              <span className="text-slate-500 dark:text-slate-400">
                ✏️ Edited ({result.weatherInfo.locationName})
              </span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                ✏️ Manually entered
              </span>
            )}
          </div>
        </div>

        {/* 💧 Total Rain on Your Roof */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-2xl mb-1">💧</div>
          <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
            Total Rain on Your Roof
          </div>
          <div className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-900 dark:text-white mt-1">
            <AnimatedCounter
              value={displayPotentialWater}
              suffix={isImperial ? ' gal' : ' L'}
            />
          </div>
        </div>

        {/* 🛢️ Your Tank Size */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="text-2xl mb-1">🛢️</div>
          <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
            Your Tank Size
          </div>
          <div className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-slate-900 dark:text-white mt-1">
            <AnimatedCounter
              value={displayTankCapacity}
              suffix={isImperial ? ' gal' : ' L'}
            />
          </div>
        </div>

      </div>

      {/* 📅 This Water Will Last You ___ Days (if daily need entered) */}
      {result.supplyDays !== undefined && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="text-3xl shrink-0">📅</div>
          <div>
            <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              How Long This Water Lasts
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-slate-900 dark:text-white mt-0.5">
              This Water Will Last You <span className="text-teal-800 dark:text-teal-300">{result.supplyDays} Days</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
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
      <div className="p-4 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs sm:text-sm flex items-start gap-2.5">
        <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong>Please note:</strong> Actual water collected may vary depending on your roof and pipes.
        </p>
      </div>

    </div>
  );
};
