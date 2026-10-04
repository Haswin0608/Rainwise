import React from 'react';
import { Check } from 'lucide-react';

export type StageNumber = 1 | 2 | 3 | 4;

interface StageProgressBarProps {
  currentStage: StageNumber;
  buildingName?: string;
  buildingTypeIcon?: string;
}

const STAGES = [
  { stage: 1, label: 'Building Setup', shortLabel: '1. Setup' },
  { stage: 2, label: 'Calculate & Design', shortLabel: '2. Calculate' },
  { stage: 3, label: 'Review & Save', shortLabel: '3. Save' },
  { stage: 4, label: 'Complete', shortLabel: '4. Done' },
];

export const StageProgressBar: React.FC<StageProgressBarProps> = ({
  currentStage,
  buildingName,
  buildingTypeIcon,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-6 px-3 sm:px-4">
      {/* Progress container */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#131d2e]/90 border border-[#24354c] shadow-md backdrop-blur-sm">
        {/* Top Info row */}
        <div className="flex items-center justify-between gap-2 mb-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-teal-400 font-bold uppercase tracking-wider text-[11px] sm:text-xs">
              Stage {currentStage} of 4:
            </span>
            <span className="text-white font-semibold truncate">
              {STAGES[currentStage - 1]?.label}
            </span>
          </div>

          {buildingName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0e1626] border border-[#24354c] text-xs font-medium text-slate-200 shrink-0">
              <span>{buildingTypeIcon || '🏢'}</span>
              <span className="max-w-[140px] sm:max-w-[200px] truncate">{buildingName}</span>
            </div>
          )}
        </div>

        {/* Multi-step progress track */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
          {STAGES.map((s) => {
            const isCompleted = s.stage < currentStage;
            const isCurrent = s.stage === currentStage;
            const isUpcoming = s.stage > currentStage;

            return (
              <div key={s.stage} className="flex flex-col gap-1.5">
                {/* Bar line */}
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCompleted
                      ? 'bg-teal-400'
                      : isCurrent
                      ? 'bg-gradient-to-r from-teal-400 to-sky-400 shadow-sm shadow-teal-500/30 ring-1 ring-teal-400'
                      : 'bg-[#1e293b]'
                  }`}
                />

                {/* Step badge & label */}
                <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium">
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      isCompleted
                        ? 'bg-teal-400 text-slate-950'
                        : isCurrent
                        ? 'bg-sky-400 text-slate-950 ring-2 ring-sky-400/30'
                        : 'bg-[#1e293b] text-slate-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : s.stage}
                  </div>
                  <span
                    className={`truncate hidden sm:inline ${
                      isCurrent
                        ? 'text-sky-300 font-bold'
                        : isCompleted
                        ? 'text-teal-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {s.label}
                  </span>
                  <span
                    className={`truncate sm:hidden ${
                      isCurrent
                        ? 'text-sky-300 font-bold'
                        : isCompleted
                        ? 'text-teal-300'
                        : 'text-slate-500'
                    }`}
                  >
                    {s.shortLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
