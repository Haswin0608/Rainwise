import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Building2, 
  Plus, 
  RotateCcw, 
  Eye, 
  AlertOctagon, 
  Share2, 
  Download,
  Sparkles
} from 'lucide-react';
import { BuildingDraft, getBuildingTypeDisplay } from '../types';
import { StageProgressBar } from './StageProgressBar';

interface Stage4ResultProps {
  draft: BuildingDraft;
  saveSuccess: boolean;
  saveError?: string;
  onViewMyBuildings: () => void;
  onCreateAnother: () => void;
  onViewCalculation: () => void;
  onRetrySave: () => void;
  isUpdate?: boolean;
}

export const Stage4Result: React.FC<Stage4ResultProps> = ({
  draft,
  saveSuccess,
  saveError,
  onViewMyBuildings,
  onCreateAnother,
  onViewCalculation,
  onRetrySave,
  isUpdate = false,
}) => {
  const buildingDisplay = getBuildingTypeDisplay(draft.buildingTypeKey, draft.customTypeName);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-center">
      {/* Stage Progress Bar (Stage 4 of 4) */}
      <StageProgressBar
        currentStage={4}
        buildingName={draft.name}
        buildingTypeIcon={buildingDisplay.icon}
      />

      <div className="bg-[#131d2e] rounded-3xl border border-[#24354c] shadow-2xl p-6 sm:p-10 space-y-7 text-center">
        {saveSuccess ? (
          <>
            {/* Success Icon & Animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="space-y-4"
            >
              <div className="w-20 h-20 rounded-3xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center text-4xl mx-auto shadow-lg shadow-teal-500/10">
                <CheckCircle2 className="w-10 h-10 text-teal-400 stroke-[2.5]" />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isUpdate ? 'Successfully Updated' : 'Successfully Saved'}</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-['Outfit',sans-serif] text-white">
                  ✅ Saved as &quot;{draft.name}&quot;
                </h1>
                <p className="text-sm text-slate-300 max-w-md mx-auto">
                  Your building measurements and rainwater configuration have been saved to your collection.
                </p>
              </div>
            </motion.div>

            {/* Building Badge Info */}
            <div className="p-4 rounded-2xl bg-[#0b1120] border border-[#24354c] inline-flex items-center gap-3 text-left max-w-md w-full">
              <span className="text-3xl shrink-0 select-none">{buildingDisplay.icon}</span>
              <div className="overflow-hidden">
                <h3 className="font-bold text-white text-base truncate">{draft.name}</h3>
                <span className="text-xs text-teal-300 font-semibold">{buildingDisplay.name}</span>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                id="stage4-view-my-buildings-btn"
                onClick={onViewMyBuildings}
                className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-950 font-black text-base shadow-lg shadow-teal-500/20 cursor-pointer min-h-[52px]"
              >
                <span>🏗️ View my buildings</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  id="stage4-create-another-btn"
                  onClick={onCreateAnother}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-[#0b1120] hover:bg-[#182438] text-teal-300 hover:text-white border border-[#24354c] font-bold text-sm transition cursor-pointer min-h-[48px]"
                >
                  <Plus className="w-4 h-4 text-teal-400" />
                  <span>Create another building</span>
                </button>

                <button
                  type="button"
                  id="stage4-view-calculation-btn"
                  onClick={onViewCalculation}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-[#0b1120] hover:bg-[#182438] text-slate-300 hover:text-white border border-[#24354c] font-semibold text-sm transition cursor-pointer min-h-[48px]"
                >
                  <Eye className="w-4 h-4 text-teal-400" />
                  <span>View full calculation</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Error State with Retry Button */
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <AlertOctagon className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black font-['Outfit',sans-serif] text-white">
                Unable to save building
              </h2>
              <p className="text-sm text-rose-300 max-w-md mx-auto">
                {saveError || 'A storage error occurred while saving your building. Your calculation data is still safe.'}
              </p>
            </div>

            <div className="space-y-3 pt-3">
              <button
                type="button"
                onClick={onRetrySave}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-base shadow-lg cursor-pointer min-h-[50px]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Saving</span>
              </button>

              <button
                type="button"
                onClick={onViewCalculation}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#0b1120] hover:bg-[#182438] text-slate-300 border border-[#24354c] font-semibold text-sm cursor-pointer"
              >
                <span>Return to Calculation</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
