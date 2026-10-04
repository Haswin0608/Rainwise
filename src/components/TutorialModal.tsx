import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPlanner?: () => void;
}

interface TutorialStep {
  badge: string;
  emoji: string;
  title: string;
  sentence: string;
  tip: string;
  bgGradient: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    badge: 'Step 1 of 6',
    emoji: '👋',
    title: 'Welcome to RainWise',
    sentence: "Let's see how much rain you can save.",
    tip: 'Rain falling on your roof is clean, natural water. RainWise helps you plan how to catch and use every drop.',
    bgGradient: 'from-teal-600 to-teal-800',
  },
  {
    badge: 'Step 2 of 6',
    emoji: '🏠',
    title: 'Tell us about your roof',
    sentence: 'Enter its size, or add more than one roof if your building has several.',
    tip: 'You can type your roof area directly (in m² or sq ft), or choose your roof type like concrete, tiles, or tin sheets.',
    bgGradient: 'from-amber-600 to-amber-800',
  },
  {
    badge: 'Step 3 of 6',
    emoji: '🌧️',
    title: "Check today's rain",
    sentence: "Track your location or type it in, and we'll fetch the rainfall for you automatically.",
    tip: 'Pick from popular Indian cities or type your town to get real monsoon rainfall figures instantly.',
    bgGradient: 'from-sky-600 to-sky-800',
  },
  {
    badge: 'Step 4 of 6',
    emoji: '💧',
    title: 'See your results',
    sentence: "We'll show how much water you can save, and how much would be wasted.",
    tip: 'Discover how many days of toilet flushing, mopping, and plant watering your stored rain can support.',
    bgGradient: 'from-blue-600 to-indigo-800',
  },
  {
    badge: 'Step 5 of 6',
    emoji: '💾',
    title: 'Save your building',
    sentence: "Sign in to save your measurements so you don't have to enter them again next time.",
    tip: 'Your roof measurements and tank setup stay safe in your account for whenever rain clouds arrive.',
    bgGradient: 'from-emerald-600 to-teal-800',
  },
  {
    badge: 'Step 6 of 6',
    emoji: '🚀',
    title: "You're all set!",
    sentence: "That's it! Tap 'Start' to try it yourself.",
    tip: 'Move through Calculate → Plan → Simulate to create your personalized water-saving plan.',
    bgGradient: 'from-teal-700 to-cyan-900',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onStartPlanner,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Reset to step 0 when reopened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = TUTORIAL_STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === TUTORIAL_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    localStorage.setItem('rainwise_tutorial_seen', 'true');
    onClose();
    if (onStartPlanner) {
      onStartPlanner();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('rainwise_tutorial_seen', 'true');
    onClose();
  };

  return (
    <AnimatePresence>
      <div 
        id="tutorial-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs transition-opacity"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
      >
        <motion.div
          key="tutorial-modal-card"
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-[#131d2e] rounded-3xl shadow-2xl border border-[#24354c] overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Bar with Skip & Close */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2 z-10 border-b border-[#1e293b]">
            <span className="text-xs font-bold tracking-wider uppercase text-slate-400">
              RainWise Walkthrough
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="tutorial-skip-btn"
                onClick={handleSkip}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition cursor-pointer"
              >
                Skip
              </button>
              <button
                type="button"
                id="tutorial-close-btn"
                onClick={handleSkip}
                aria-label="Close tutorial"
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1e293b] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Animated Card Body */}
          <div className="px-6 py-4 flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22, ease: 'easeInOut' }}
                className="flex flex-col items-center text-center space-y-4 my-2"
              >
                {/* Illustration Badge */}
                <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${currentStep.bgGradient} flex items-center justify-center text-5xl shadow-lg shadow-teal-950/40 transform hover:scale-105 transition-transform duration-200 select-none`}>
                  <span>{currentStep.emoji}</span>
                </div>

                {/* Step badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0e1626] border border-[#24354c] text-xs font-bold text-teal-400">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>{currentStep.badge}</span>
                </div>

                {/* Title */}
                <h3 
                  id="tutorial-title" 
                  className="text-2xl sm:text-3xl font-extrabold font-['Outfit',sans-serif] text-white tracking-tight"
                >
                  {currentStep.title}
                </h3>

                {/* Core Friendly One-Sentence */}
                <p className="text-base sm:text-lg font-medium text-slate-200 leading-relaxed px-2">
                  &ldquo;{currentStep.sentence}&rdquo;
                </p>

                {/* Supporting Plain-Language Tip */}
                <div className="w-full p-3.5 rounded-2xl bg-[#0e1626] border border-[#24354c] text-xs sm:text-sm text-slate-300 leading-normal text-left flex items-start gap-2.5">
                  <span className="text-base shrink-0">💡</span>
                  <p>{currentStep.tip}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Controls: Progress Dots & Next / Back Buttons */}
          <div className="px-6 py-4 bg-[#0e1626] border-t border-[#1e293b] flex items-center justify-between gap-3">
            {/* Progress Dots: ● ○ ○ ○ ○ ○ */}
            <div className="flex items-center gap-1.5">
              {TUTORIAL_STEPS.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentStepIndex(index)}
                  aria-label={`Go to step ${index + 1}`}
                  className={`transition-all duration-200 rounded-full cursor-pointer ${
                    index === currentStepIndex
                      ? 'w-6 h-2 bg-teal-400'
                      : 'w-2 h-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  type="button"
                  id="tutorial-back-btn"
                  onClick={handlePrev}
                  className="px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:bg-[#1e293b] transition flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              )}

              <button
                type="button"
                id="tutorial-next-btn"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 active:bg-teal-500 shadow-md shadow-teal-950/30 transition flex items-center gap-1.5 cursor-pointer min-h-[40px]"
              >
                {isLastStep ? (
                  <>
                    <span>Start Planning</span>
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
