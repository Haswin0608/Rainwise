import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, X } from 'lucide-react';

export const DICTIONARY_EXPLANATIONS: Record<string, { title: string; simpleText: string }> = {
  runoff: {
    title: 'What is Runoff?',
    simpleText: 'Rain that slides off your roof into your tank instead of soaking in.',
  },
  roof_area: {
    title: 'What is Roof Area?',
    simpleText: 'The total flat space on top of your house that catches rain.',
  },
  tank_capacity: {
    title: 'What is Tank Capacity?',
    simpleText: 'How much water your tank can hold when completely full.',
  },
  daily_demand: {
    title: 'What is Daily Water Use?',
    simpleText: 'The water your family needs each day for flushing and cleaning.',
  },
  bucket_size: {
    title: 'What is Bucket Size?',
    simpleText: 'One standard bucket holds 15 litres of water.',
  },
  runoff_efficiency: {
    title: 'What is Catch Efficiency?',
    simpleText: 'Smooth roofs catch almost all rain. Rough roofs lose a little.',
  },
  overflow: {
    title: 'What is Overflow?',
    simpleText: 'Water that spills out when your tank is already 100% full.',
  },
  period: {
    title: 'What is Timeline Period?',
    simpleText: 'Choose whether to see water numbers for this week, this month, or a full year.',
  },
  water_tariff: {
    title: 'What is Water Tariff?',
    simpleText: 'The money you pay the city for every 1,000 litres of tap water.',
  },
};

interface HelpExplainButtonProps {
  termKey: keyof typeof DICTIONARY_EXPLANATIONS | string;
  customTitle?: string;
  customExplanation?: string;
  className?: string;
}

export const HelpExplainButton: React.FC<HelpExplainButtonProps> = ({
  termKey,
  customTitle,
  customExplanation,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const info = DICTIONARY_EXPLANATIONS[termKey] || {
    title: customTitle || 'Quick Explanation',
    simpleText: customExplanation || 'Simple info to help you understand this number.',
  };

  const title = customTitle || info.title;
  const text = customExplanation || info.simpleText;

  return (
    <span className={`inline-flex items-center align-middle relative ${className}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-5 h-5 rounded-full bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 flex items-center justify-center text-xs font-bold transition cursor-pointer shrink-0 ml-1.5 focus:outline-none focus:ring-2 focus:ring-teal-400"
        title={`Click to explain "${title}"`}
        aria-label={`Explain ${title}`}
      >
        ?
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop click dismiss */}
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
            />

            {/* Popover Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 5 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3.5 rounded-2xl bg-[#1e293b] border border-teal-500/50 shadow-2xl text-white text-xs z-50 pointer-events-auto"
            >
              <div className="flex items-center justify-between font-bold text-teal-300 mb-1 border-b border-slate-700/60 pb-1">
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{title}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-0.5 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-slate-200 leading-relaxed font-medium mt-1">
                {text}
              </p>
              {/* Down arrow triangle */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-[#1e293b]" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </span>
  );
};
