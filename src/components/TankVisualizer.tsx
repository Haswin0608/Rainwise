import React from 'react';
import { CalculationResult } from '../types';
import { ShieldAlert, CheckCircle2, ArrowUpRight, Droplet } from 'lucide-react';

interface TankVisualizerProps {
  result: CalculationResult;
}

export const TankVisualizer: React.FC<TankVisualizerProps> = ({ result }) => {
  const { tankCapacity, actuallyHarvested, wastedWater, harvestableWater } = result;
  
  // Percent fill of tank
  const fillPercent = tankCapacity > 0 ? Math.min(100, Math.round((actuallyHarvested / tankCapacity) * 100)) : 0;
  const isOverflowing = wastedWater > 0;
  const isFull = fillPercent >= 100;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 text-base sm:text-lg">
            Storage Tank Capacity Status
          </h3>
          <p className="text-xs text-slate-500">
            Physical reservoir fill level and overflow discharge analysis
          </p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          isOverflowing 
            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
        }`}>
          {isOverflowing ? 'Overflow Warning' : 'Within Tank Capacity'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Visual Tank Graphic */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200/70 relative">
          
          {/* Overflow animation banner if overflowing */}
          {isOverflowing && (
            <div className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-200 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>+{wastedWater.toLocaleString()}L Overflow</span>
            </div>
          )}

          {/* Tank Cylinder */}
          <div className="w-36 h-48 sm:w-40 sm:h-52 rounded-2xl border-4 border-slate-700 bg-slate-100 relative overflow-hidden flex flex-col justify-end shadow-inner my-2">
            {/* Water Fill Level */}
            <div 
              className={`w-full transition-all duration-1000 ease-out relative ${
                isFull ? 'bg-gradient-to-t from-teal-700 to-emerald-500' : 'bg-gradient-to-t from-teal-700 to-teal-500'
              }`}
              style={{ height: `${fillPercent}%` }}
            >
              {/* Wave ripples on top of water */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-white/25 -translate-y-1 animate-subtle-wave" />
              
              {/* Fill percent label */}
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm drop-shadow-sm">
                {fillPercent}% Full
              </div>
            </div>

            {/* Gauge markings */}
            <div className="absolute inset-y-2 right-1.5 flex flex-col justify-between text-[9px] font-mono text-slate-400 select-none">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            {/* Overflow spout on top right if overflowing */}
            {isOverflowing && (
              <div className="absolute top-2 -right-1 w-3 h-2 bg-amber-500 rounded-r-md" />
            )}
          </div>

          <div className="text-center mt-2">
            <span className="text-xs font-semibold text-slate-800 block">
              {actuallyHarvested.toLocaleString()}L of {tankCapacity.toLocaleString()}L
            </span>
            <span className="text-[11px] text-slate-500">
              {tankCapacity - actuallyHarvested > 0 
                ? `${(tankCapacity - actuallyHarvested).toLocaleString()}L remaining headroom`
                : '100% capacity reached'}
            </span>
          </div>
        </div>

        {/* Narrative & Recommendations */}
        <div className="md:col-span-7 space-y-3">
          <div className={`p-4 rounded-xl border ${
            isOverflowing 
              ? 'bg-amber-50/70 border-amber-200/80 text-amber-950' 
              : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
          }`}>
            <div className="flex items-start gap-2.5">
              {isOverflowing ? (
                <ShieldAlert className="w-5 h-5 text-amber-700 mt-0.5 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <h4 className="font-bold text-sm">
                  {isOverflowing 
                    ? `Storage Bottleneck: ${wastedWater.toLocaleString()}L Lost` 
                    : 'Optimal Storage Match'}
                </h4>
                <p className="text-xs mt-1 leading-relaxed text-slate-700">
                  {isOverflowing
                    ? `Your roof generated ${harvestableWater.toLocaleString()}L of collectable rainwater, but your ${tankCapacity.toLocaleString()}L reservoir capped capture at ${actuallyHarvested.toLocaleString()}L. The excess ${wastedWater.toLocaleString()}L overflowed.`
                    : `Your ${tankCapacity.toLocaleString()}L tank was able to contain 100% of the ${harvestableWater.toLocaleString()}L collected from this rainfall event with zero loss.`}
                </p>
              </div>
            </div>
          </div>

          {/* Quick recommendations */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs text-slate-600 space-y-1.5">
            <span className="font-semibold text-slate-900 block text-xs">
              System Optimization Insight:
            </span>
            {isOverflowing ? (
              <p>
                To harvest the overflow water during similar storm events, consider expanding your tank capacity to at least <strong className="text-slate-900">{harvestableWater.toLocaleString()}L</strong> or installing a linked overflow retention cistern.
              </p>
            ) : (
              <p>
                Your storage volume is well-proportioned for this rainfall depth. During extended wet periods, you may want to connect garden irrigation systems to draw down reserves ahead of the next storm.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
