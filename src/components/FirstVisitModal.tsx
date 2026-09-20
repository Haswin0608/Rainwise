import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserCheck, ShieldCheck, ArrowRight, Droplets } from 'lucide-react';

interface FirstVisitModalProps {
  isOpen: boolean;
  onSignIn: () => void;
  onContinueAsGuest: () => void;
}

export const FirstVisitModal: React.FC<FirstVisitModalProps> = ({
  isOpen,
  onSignIn,
  onContinueAsGuest,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Top Banner with Rain motif */}
          <div className="bg-gradient-to-r from-teal-800 to-teal-950 p-6 sm:p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-700/60 border border-teal-500/40 text-xs font-semibold text-teal-100 mb-3">
                <Droplets className="w-3.5 h-3.5 text-teal-200" />
                <span>RainWise Calculator</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] tracking-tight">
                Welcome to RainWise
              </h2>
              <p className="text-teal-100/90 text-sm sm:text-base mt-2 leading-relaxed">
                Find out how much rain your roof is wasting, and how much you can save in your storage tank.
              </p>
            </div>
            
            {/* Subtle background decoration */}
            <div className="absolute right-3 -bottom-6 text-7xl opacity-15 select-none pointer-events-none">
              🌧️
            </div>
          </div>

          {/* Choices Section */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Choose how you want to start:
            </div>

            {/* Option 1: Sign In / Sign Up */}
            <button
              type="button"
              id="first-visit-signin-btn"
              onClick={onSignIn}
              className="w-full text-left p-4 sm:p-5 rounded-2xl bg-teal-50/70 hover:bg-teal-100/80 active:bg-teal-100 border-2 border-teal-600/40 hover:border-teal-700 transition-all flex items-start justify-between gap-4 group cursor-pointer shadow-2xs"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                  <LogIn className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                      Sign In / Sign Up
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-teal-200 text-teal-900">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Save your building &amp; roof sizes so you don&apos;t have to re-measure them every time rain falls.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-teal-700 mt-2 shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Option 2: Continue as Guest */}
            <button
              type="button"
              id="first-visit-guest-btn"
              onClick={onContinueAsGuest}
              className="w-full text-left p-4 sm:p-5 rounded-2xl bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 hover:border-slate-300 transition-all flex items-start justify-between gap-4 group cursor-pointer shadow-2xs"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                    Continue as Guest
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    No account needed. Skips straight to the calculator. You can always sign up later if you want to save.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 mt-2 shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Privacy note */}
            <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Free to use • Location &amp; accounts are always optional</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
