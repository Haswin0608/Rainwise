import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Sparkles } from 'lucide-react';
import { CalculationResult } from '../types';

interface EducationalSectionProps {
  result: CalculationResult;
}

export const EducationalSection: React.FC<EducationalSectionProps> = ({ result }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);

  return (
    <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
      {/* Header Button */}
      <button
        type="button"
        id="how-this-works-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center text-xl shrink-0">
            💡
          </div>
          <div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 text-base sm:text-lg">
              How This Works
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              A simple explanation of the numbers (optional)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-sm font-semibold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-xl">
          <span>{isOpen ? 'Close' : 'Show'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Plain Language Content */}
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
          <p className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            We look at the size of your roof and how much rain fell to work out how much water landed on it. Then we check if your tank is big enough to hold that water. Whatever doesn&apos;t fit in your tank is counted as water you lost.
          </p>

          {/* Simple step-by-step in plain language */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-100">
              <span className="text-xs font-bold text-sky-800 uppercase tracking-wider block mb-1">
                Step 1 • Roof Area
              </span>
              <p className="text-xs text-slate-600">
                {result.roofArea} m² {result.roofs && result.roofs.length > 1 ? `across ${result.roofs.length} roofs ` : ''}caught the rain.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-100">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider block mb-1">
                Step 2 • Water Falling
              </span>
              <p className="text-xs text-slate-600">
                {result.potentialWater.toLocaleString()} litres of rain landed on your roof.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                Step 3 • Tank Check
              </span>
              <p className="text-xs text-slate-600">
                Your {result.tankCapacity.toLocaleString()}L tank saved {result.actuallyHarvested.toLocaleString()} litres.
              </p>
            </div>
          </div>

          {/* Optional deeper breakdown for curious users */}
          <div className="pt-2">
            <button
              type="button"
              id="math-details-toggle"
              onClick={() => setShowFormulas(!showFormulas)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-teal-800 transition-colors"
            >
              <span>{showFormulas ? '− Hide the math calculation details' : '+ Want to see the exact calculation steps?'}</span>
            </button>

            {showFormulas && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm space-y-2 text-slate-600 font-mono">
                <div>• <strong>Roof Area:</strong> {result.roofArea} m² {result.roofs && result.roofs.length > 1 ? `(Combined: ${result.roofs.map(r => `${r.name} = ${r.area}m²`).join(', ')})` : '(Length × Width)'}</div>
                <div>• <strong>Total Rain:</strong> {result.potentialWater.toLocaleString()} litres (1mm rain over 1m² = 1 litre)</div>
                <div>• <strong>Actual Collectable Rain:</strong> {result.harvestableWater.toLocaleString()} litres ({result.efficiency}% efficiency after small filter/gutter losses)</div>
                <div>• <strong>Saved in Tank:</strong> {result.actuallyHarvested.toLocaleString()} litres (the smaller of your tank size and collected rain)</div>
                <div>• <strong>Water Wasted:</strong> {result.wastedWater.toLocaleString()} litres (water that overflowed your tank)</div>
                {result.supplyDays !== undefined && (
                  <div>• <strong>Days Water Lasts:</strong> {result.supplyDays} days ({result.actuallyHarvested.toLocaleString()}L ÷ {result.dailyRequirement}L per day)</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
