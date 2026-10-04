import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Droplets } from 'lucide-react';
import { RAINWATER_TIPS, RainwaterTip } from '../data/tips';

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightTipId?: string;
}

export const TipsModal: React.FC<TipsModalProps> = ({
  isOpen,
  onClose,
  highlightTipId,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-[#131d2e] rounded-3xl shadow-2xl border border-[#24354c] p-6 sm:p-8 z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#1e293b] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold font-['Outfit',sans-serif] text-white">
                  Practical Rainwater Tips
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Simple, sensible advice to help you catch more clean water and prevent waste.
                </p>
              </div>
            </div>

            <button
              type="button"
              id="tips-modal-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#182438] transition-colors cursor-pointer"
              aria-label="Close tips"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Cards Grid / Strip */}
          <div className="overflow-y-auto py-5 space-y-3 sm:space-y-4 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {RAINWATER_TIPS.map((tip) => {
                const isHighlighted = tip.id === highlightTipId;
                return (
                  <div
                    key={tip.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      isHighlighted
                        ? 'bg-[#0a2528] border-teal-500 shadow-xs ring-2 ring-teal-500/30'
                        : 'bg-[#0e1626] hover:bg-[#182438] border-[#1e293b]'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="text-2xl sm:text-3xl shrink-0 p-2 rounded-xl bg-[#131d2e] shadow-2xs border border-[#24354c]">
                        {tip.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold font-['Outfit',sans-serif] text-white">
                            {tip.title}
                          </h3>
                          {isHighlighted && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-900/80 text-teal-200 border border-teal-600/60">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                          {tip.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Practical takeaway footnote */}
            <div className="p-4 rounded-2xl bg-[#0a2528] border border-teal-600/60 text-teal-200 text-xs sm:text-sm flex items-center gap-3">
              <Droplets className="w-5 h-5 text-teal-400 shrink-0" />
              <p className="leading-normal">
                Every drop saved from your roof protects your local water supply and reduces groundwater strain.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[#1e293b] flex justify-end shrink-0">
            <button
              type="button"
              id="tips-modal-done-btn"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold shadow-2xs cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              Got It, Thanks!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
