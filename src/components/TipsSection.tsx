import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { RAINWATER_TIPS, RainwaterTip } from '../data/tips';

interface TipsSectionProps {
  onOpenModal?: (tipId?: string) => void;
}

export const TipsSection: React.FC<TipsSectionProps> = ({ onOpenModal }) => {
  return (
    <section className="w-full text-left my-8">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-['Outfit',sans-serif] text-slate-900 dark:text-white">
              Practical Rainwater Tips
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Short, practical advice to catch more clean water
            </p>
          </div>
        </div>

        {onOpenModal && (
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="text-xs font-bold text-teal-800 dark:text-teal-300 hover:text-teal-950 dark:hover:text-teal-100 flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal scroll on mobile / clean 3-col grid on tablet & desktop */}
      <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 overflow-x-auto pb-3 sm:pb-0 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none snap-x snap-mandatory">
        {RAINWATER_TIPS.slice(0, 6).map((tip: RainwaterTip) => (
          <div
            key={tip.id}
            onClick={() => onOpenModal && onOpenModal(tip.id)}
            className="min-w-[260px] sm:min-w-0 snap-start p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-sm hover:border-teal-300 dark:hover:border-teal-700 transition-all flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl sm:text-3xl shrink-0 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 group-hover:scale-105 transition-transform">
                {tip.icon}
              </div>
              <div>
                <h4 className="font-['Outfit',sans-serif] font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">
                  {tip.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {tip.text}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
