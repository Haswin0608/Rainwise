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
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold font-['Outfit',sans-serif] text-white">
              Practical Rainwater Tips
            </h3>
            <p className="text-xs text-slate-400">
              Short, practical advice to catch more clean water
            </p>
          </div>
        </div>

        {onOpenModal && (
          <button
            type="button"
            onClick={() => onOpenModal()}
            className="text-xs font-bold text-teal-300 hover:text-teal-200 flex items-center gap-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-lg px-1.5 py-0.5"
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
            className="min-w-[260px] sm:min-w-0 snap-start p-4.5 rounded-2xl bg-[#131d2e] border border-[#24354c] shadow-2xs hover:border-teal-400/80 transition-all flex flex-col justify-between cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl sm:text-3xl shrink-0 p-2 rounded-xl bg-[#0e1626] border border-[#1e293b] group-hover:scale-105 transition-transform">
                {tip.icon}
              </div>
              <div>
                <h4 className="font-['Outfit',sans-serif] font-bold text-sm text-white group-hover:text-teal-300 transition-colors">
                  {tip.title}
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
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
