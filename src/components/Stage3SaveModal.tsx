import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Save, 
  Trash2, 
  Edit3, 
  MapPin, 
  Layers, 
  Container, 
  Droplet, 
  AlertTriangle, 
  Copy, 
  ArrowLeft, 
  CheckCircle2, 
  X
} from 'lucide-react';
import { 
  BuildingDraft, 
  CalculatorInputs, 
  RoofItem, 
  StorageTankItem, 
  getBuildingTypeDisplay 
} from '../types';
import { 
  normalizeRoofs, 
  normalizeTanks, 
  calculateHarvesting, 
  calcWaterSummary,
  DEFAULT_ASSUMPTIONS, 
  toBuckets 
} from '../utils/calculations';
import { useAppSettings } from '../context/AppSettingsContext';
import { StageProgressBar } from './StageProgressBar';

interface Stage3SaveModalProps {
  draft: BuildingDraft;
  inputs: CalculatorInputs;
  onSave: () => void;
  onUpdate?: () => void;
  onSaveAsCopy?: () => void;
  onDiscard: () => void;
  onKeepEditing: () => void;
  isEditingExisting?: boolean;
}

export const Stage3SaveModal: React.FC<Stage3SaveModalProps> = ({
  draft,
  inputs,
  onSave,
  onUpdate,
  onSaveAsCopy,
  onDiscard,
  onKeepEditing,
  isEditingExisting = false,
}) => {
  const { unit, formatArea, formatVolume } = useAppSettings();
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const buildingDisplay = getBuildingTypeDisplay(draft.buildingTypeKey, draft.customTypeName);
  const roofs: RoofItem[] = normalizeRoofs(inputs.roofs, inputs.directRoofArea, inputs.roofType);
  const { tanks, noTankYet } = normalizeTanks(inputs.tanks, inputs.tankCapacity, inputs.noTankYet);

  const totalRoofArea = roofs.reduce((acc, r) => acc + (parseFloat(r.area) || 0), 0);
  const totalTankL = noTankYet ? 0 : tanks.reduce((acc, t) => acc + (parseFloat(t.capacity) || 0), 0);

  // Compute calculated water summary
  const summary = calcWaterSummary(inputs, unit, inputs.assumptions || DEFAULT_ASSUMPTIONS);
  const yearlySavedL = summary.year.kept;
  const yearlyWastedL = summary.year.wasted;
  const yearlySavedB = summary.year.keptBuckets;
  const yearlyWastedB = summary.year.wastedBuckets;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-left">
      {/* Stage Progress Bar (Stage 3 of 4) */}
      <StageProgressBar
        currentStage={3}
        buildingName={draft.name}
        buildingTypeIcon={buildingDisplay.icon}
      />

      <div className="bg-[#131d2e] rounded-3xl border border-[#24354c] shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-[#1e293b] pb-5">
          <div className="w-16 h-16 rounded-3xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-3xl mx-auto shadow-inner">
            {buildingDisplay.icon}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-['Outfit',sans-serif] text-white">
            {isEditingExisting ? `Update "${draft.name}"?` : `Do you want to save "${draft.name}"?`}
          </h1>
          <p className="text-sm text-slate-300">
            {isEditingExisting
              ? 'Choose how you would like to apply your changes to My Buildings.'
              : 'Save this building to your collection so you can recalculate it anytime.'}
          </p>
        </div>

        {/* ───────── SUMMARY CARD ───────── */}
        <div className="p-5 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-3 text-xs font-bold uppercase tracking-wider text-teal-400">
            <span>Building Summary</span>
            <span className="text-slate-400 font-normal normal-case">{buildingDisplay.name}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {/* Location */}
            <div className="p-3 rounded-xl bg-[#131d2e] border border-[#24354c] flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Location</span>
                <span className="font-bold text-white truncate max-w-[180px] block">
                  {inputs.locationName || 'Current Location'}
                </span>
              </div>
            </div>

            {/* Roofs */}
            <div className="p-3 rounded-xl bg-[#131d2e] border border-[#24354c] flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-teal-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Roofs</span>
                <span className="font-bold text-white">
                  {formatArea(totalRoofArea)} ({roofs.length} {roofs.length === 1 ? 'roof' : 'roofs'})
                </span>
              </div>
            </div>

            {/* Tanks */}
            <div className="p-3 rounded-xl bg-[#131d2e] border border-[#24354c] flex items-center gap-2.5">
              <Container className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block">Storage</span>
                <span className="font-bold text-white">
                  {noTankYet ? (
                    'No tank yet'
                  ) : (
                    `${formatVolume(totalTankL)} (${tanks.length} ${tanks.length === 1 ? 'tank' : 'tanks'})`
                  )}
                </span>
              </div>
            </div>

            {/* Yearly Rainwater Saved & Wasted */}
            <div className="col-span-1 sm:col-span-2 p-3.5 rounded-xl bg-[#131d2e] border border-[#24354c] space-y-2">
              <span className="text-xs text-slate-400 block font-medium">Yearly Water Impact</span>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded-lg bg-[#0b1120] border border-teal-500/30">
                  <span className="text-[11px] text-teal-400 font-bold block">🟢 Saved Water</span>
                  <span className="font-bold text-teal-300 text-sm block">
                    {yearlySavedB.toLocaleString()} buckets
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({formatVolume(yearlySavedL)})
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-[#0b1120] border border-orange-500/30">
                  <span className="text-[11px] text-orange-400 font-bold block">🟠 Wasted Water</span>
                  <span className="font-bold text-orange-400 text-sm block">
                    {yearlyWastedB.toLocaleString()} buckets
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({formatVolume(yearlyWastedL)})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ───────── DISCARD CONFIRMATION MODAL / PANEL ───────── */}
        <AnimatePresence>
          {showDiscardConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-5 rounded-2xl bg-rose-950/80 border border-rose-700 text-rose-100 space-y-3 shadow-lg"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-base text-white">
                    Are you sure? Your calculation will be lost.
                  </h4>
                  <p className="text-xs text-rose-200 mt-0.5">
                    Nothing will be saved to My Buildings, and this building draft will be discarded.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-[#0b1120] hover:bg-[#162235] text-slate-200 text-xs font-bold border border-[#24354c] cursor-pointer"
                >
                  Go back
                </button>
                <button
                  type="button"
                  onClick={onDiscard}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Yes, discard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───────── ACTIONS ───────── */}
        {!showDiscardConfirm && (
          <div className="space-y-3 pt-2">
            {isEditingExisting ? (
              <div className="space-y-2.5">
                <button
                  type="button"
                  id="stage3-update-btn"
                  onClick={onUpdate || onSave}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-950 font-black text-base shadow-lg shadow-teal-500/20 cursor-pointer min-h-[52px]"
                >
                  <Save className="w-5 h-5 text-slate-950" />
                  <span>Update &quot;{draft.name}&quot;</span>
                </button>

                {onSaveAsCopy && (
                  <button
                    type="button"
                    onClick={onSaveAsCopy}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#0b1120] hover:bg-[#182438] text-teal-300 hover:text-white border border-[#24354c] font-bold text-sm transition cursor-pointer min-h-[46px]"
                  >
                    <Copy className="w-4 h-4 text-teal-400" />
                    <span>Save as new copy</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                id="stage3-save-btn"
                onClick={onSave}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-950 font-black text-base shadow-lg shadow-teal-500/20 cursor-pointer min-h-[52px]"
              >
                <Save className="w-5 h-5 text-slate-950" />
                <span>Save building</span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={onKeepEditing}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-[#0b1120] hover:bg-[#182438] text-slate-300 hover:text-white border border-[#24354c] font-semibold text-xs sm:text-sm transition cursor-pointer min-h-[46px]"
              >
                <Edit3 className="w-4 h-4 text-teal-400" />
                <span>Keep editing</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDiscardConfirm(true)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-[#0b1120] hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-[#24354c] hover:border-rose-800/50 font-semibold text-xs sm:text-sm transition cursor-pointer min-h-[46px]"
              >
                <Trash2 className="w-4 h-4 text-slate-400" />
                <span>Don&apos;t save</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
