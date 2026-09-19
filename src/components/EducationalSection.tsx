import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Layers, ArrowRightLeft, Percent, Scale, HelpCircle } from 'lucide-react';
import { CalculationResult } from '../types';

interface EducationalSectionProps {
  result?: CalculationResult;
}

export const EducationalSection: React.FC<EducationalSectionProps> = ({ result }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-full rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Header / Toggle button */}
      <button
        id="math-explanation-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <span>The Math Behind It</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/50">
                Formula Breakdown
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Clear mathematical principles powering your rainwater harvest analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <span>{isOpen ? 'Collapse' : 'Expand'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100 divide-y divide-slate-100">
          
          {/* Formula 1: Mensuration (Roof Area) */}
          <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-4 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 mt-0.5">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">1. Mensuration (Roof Area)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Catchment footprint plane area</p>
              </div>
            </div>
            <div className="md:col-span-8 bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 text-xs sm:text-sm">
              <div className="font-mono text-teal-900 font-semibold bg-teal-50/80 px-2.5 py-1.5 rounded-md border border-teal-100 inline-block mb-2">
                Area = Length × Width (m²)
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Mensuration calculates the geometric 2D projected roof footprint in square metres. 
                {result ? (
                  <span className="block mt-1 font-medium text-slate-800">
                    Your calculation: {result.roofArea} m²
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {/* Formula 2: Unit Conversion (Rainfall to Litres) */}
          <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-4 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 mt-0.5">
                <ArrowRightLeft className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">2. Unit Conversion (Litres)</h4>
                <p className="text-xs text-slate-500 mt-0.5">1mm over 1m² ≈ 1 Litre</p>
              </div>
            </div>
            <div className="md:col-span-8 bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 text-xs sm:text-sm">
              <div className="font-mono text-teal-900 font-semibold bg-teal-50/80 px-2.5 py-1.5 rounded-md border border-teal-100 inline-block mb-2">
                Potential (L) = Roof Area (m²) × Rainfall (mm)
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Since 1mm depth over 1 square metre equals 0.001m × 1m² = 0.001 cubic metres (m³), and 1m³ is exactly 1,000 litres, each millimetre of rainfall on each square metre yields precisely 1 litre of theoretical precipitation.
                {result ? (
                  <span className="block mt-1 font-medium text-slate-800">
                    Your calculation: {result.roofArea}m² × {result.rainfall}mm = {result.potentialWater.toLocaleString()} Litres potential
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {/* Formula 3: Percentage (Collection Efficiency) */}
          <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-4 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 mt-0.5">
                <Percent className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">3. Percentage (Efficiency)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Runoff coefficient & filtration</p>
              </div>
            </div>
            <div className="md:col-span-8 bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 text-xs sm:text-sm">
              <div className="font-mono text-teal-900 font-semibold bg-teal-50/80 px-2.5 py-1.5 rounded-md border border-teal-100 inline-block mb-2">
                Harvestable (L) = Potential Rainwater × (Efficiency / 100)
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Roof materials, gutter leaf filters, first-flush diverters, and evaporative evaporation prevent 100% collection. Standard systems achieve 75% to 90% collection efficiency.
                {result ? (
                  <span className="block mt-1 font-medium text-slate-800">
                    Your calculation: {result.potentialWater.toLocaleString()}L × {result.efficiency}% = {result.harvestableWater.toLocaleString()} Litres harvestable
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {/* Formula 4: Comparison Logic (Harvested vs Wasted) */}
          <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <div className="md:col-span-4 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 mt-0.5">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">4. Comparison Logic (Min & Subtraction)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Storage bottleneck & overflow</p>
              </div>
            </div>
            <div className="md:col-span-8 bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 text-xs sm:text-sm space-y-2">
              <div>
                <div className="font-mono text-teal-900 font-semibold bg-teal-50/80 px-2.5 py-1 rounded-md border border-teal-100 inline-block mr-2">
                  Actually Harvested = MIN(Harvestable, Tank Capacity)
                </div>
                <div className="font-mono text-rose-900 font-semibold bg-rose-50/80 px-2.5 py-1 rounded-md border border-rose-100 inline-block mt-1 sm:mt-0">
                  Wasted = Harvestable − Actually Harvested
                </div>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                If your harvestable rain volume exceeds the storage tank capacity, the remaining volume overflows into stormwater and cannot be conserved.
                {result ? (
                  <span className="block mt-1 font-medium text-slate-800">
                    Your calculation: MIN({result.harvestableWater.toLocaleString()}L, {result.tankCapacity.toLocaleString()}L) = {result.actuallyHarvested.toLocaleString()}L saved, {result.wastedWater.toLocaleString()}L wasted.
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          {/* Formula 5: Supply Days (optional, Division) */}
          {result?.supplyDays !== undefined && (
            <div className="py-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-4 flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 mt-0.5">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">5. Water Supply Days (Division)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Daily requirement endurance</p>
                </div>
              </div>
              <div className="md:col-span-8 bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 text-xs sm:text-sm">
                <div className="font-mono text-teal-900 font-semibold bg-teal-50/80 px-2.5 py-1.5 rounded-md border border-teal-100 inline-block mb-2">
                  Supply Days = Actually Harvested / Daily Water Requirement
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  Calculates how many days your stored water will sustain your household, garden, or livestock at your current usage rate.
                  <span className="block mt-1 font-medium text-slate-800">
                    Your calculation: {result.actuallyHarvested.toLocaleString()}L ÷ {result.dailyRequirement}L/day = {result.supplyDays} days of supply.
                  </span>
                </p>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
