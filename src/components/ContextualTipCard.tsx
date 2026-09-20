import React from 'react';
import { ArrowRight, Lightbulb } from 'lucide-react';
import { getContextualTip } from '../data/tips';

interface ContextualTipCardProps {
  wastedWater: number;
  actuallyHarvested: number;
  onOpenAllTips: (tipId?: string) => void;
}

export const ContextualTipCard: React.FC<ContextualTipCardProps> = ({
  wastedWater,
  actuallyHarvested,
  onOpenAllTips,
}) => {
  const tip = getContextualTip(wastedWater, actuallyHarvested);

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 text-slate-900 dark:text-slate-100 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="text-3xl shrink-0 p-2 rounded-2xl bg-white dark:bg-slate-800 border border-amber-200/70 dark:border-amber-900/60 shadow-2xs">
            {tip.icon}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                <Lightbulb className="w-3 h-3" />
                Helpful Tip
              </span>
              <h4 className="font-['Outfit',sans-serif] font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {tip.title}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
              {tip.text}
            </p>
          </div>
        </div>

        <button
          type="button"
          id="results-view-all-tips-btn"
          onClick={() => onOpenAllTips(tip.id)}
          className="inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold text-amber-950 dark:text-amber-200 bg-amber-100/90 hover:bg-amber-200/80 dark:bg-amber-900/40 dark:hover:bg-amber-900/70 border border-amber-300/80 dark:border-amber-700/60 px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0 min-h-[40px]"
        >
          <span>All 7 Rain Tips</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
