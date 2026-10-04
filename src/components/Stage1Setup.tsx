import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, X, AlertCircle, Building2, Check, Sparkles } from 'lucide-react';
import { BuildingDraft, BuildingTypeKey, BUILDING_TYPE_OPTIONS } from '../types';
import { isBuildingNameDuplicate } from '../utils/buildingStorage';
import { StageProgressBar } from './StageProgressBar';

interface Stage1SetupProps {
  draft: BuildingDraft;
  onUpdateDraft: (updated: Partial<BuildingDraft>) => void;
  onContinue: () => void;
  onCancel: () => void;
  isEditingExisting?: boolean;
}

export const Stage1Setup: React.FC<Stage1SetupProps> = ({
  draft,
  onUpdateDraft,
  onContinue,
  onCancel,
  isEditingExisting = false,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [touchedName, setTouchedName] = useState(false);
  const [touchedCustomType, setTouchedCustomType] = useState(false);

  const customInputId = useId();

  const nameTrimmed = draft.name.trim();
  const isNameEmpty = nameTrimmed.length === 0;
  const isNameTooLong = draft.name.length > 40;

  // Duplicate name check
  const isDuplicate = isBuildingNameDuplicate(nameTrimmed, draft.id);

  // Custom type validation
  const isCustomSelected = draft.buildingTypeKey === 'custom';
  const customTypeNameTrimmed = (draft.customTypeName || '').trim();
  const isCustomTypeEmpty = isCustomSelected && customTypeNameTrimmed.length === 0;
  const isCustomTypeTooLong = isCustomSelected && (draft.customTypeName || '').length > 30;

  // Overall validity
  const isValid = !isNameEmpty && !isNameTooLong && !isDuplicate && (!isCustomSelected || (!isCustomTypeEmpty && !isCustomTypeTooLong));

  // Determine helper message when disabled
  let disabledReason = '';
  if (isNameEmpty) {
    disabledReason = 'Please enter a name for your building';
  } else if (isDuplicate) {
    disabledReason = 'A building with this name already exists. Please pick another name.';
  } else if (isNameTooLong) {
    disabledReason = 'Building name must be 40 characters or fewer';
  } else if (isCustomSelected && isCustomTypeEmpty) {
    disabledReason = 'Please specify your custom building type (e.g. Temple, Warehouse)';
  } else if (isCustomTypeTooLong) {
    disabledReason = 'Custom building type must be 30 characters or fewer';
  }

  const handleCancelClick = () => {
    const hasEnteredData = draft.name.trim().length > 0 || (draft.customTypeName && draft.customTypeName.trim().length > 0);
    if (hasEnteredData) {
      setShowCancelConfirm(true);
    } else {
      onCancel();
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-left">
      {/* Stage Progress Bar (1 of 4) */}
      <StageProgressBar
        currentStage={1}
        buildingName={draft.name.trim() || undefined}
        buildingTypeIcon={BUILDING_TYPE_OPTIONS.find((b) => b.key === draft.buildingTypeKey)?.icon}
      />

      <div className="bg-[#131d2e] rounded-3xl border border-[#24354c] shadow-xl p-5 sm:p-8 space-y-7">
        {/* Header */}
        <div className="border-b border-[#1e293b] pb-4 flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>{isEditingExisting ? 'Edit Building Setup' : 'Stage 1 of 4 • New Building'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-['Outfit',sans-serif] text-white">
              {isEditingExisting ? 'Edit Building Details' : 'Create a New Building'}
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Give your building a name and select its type. Next, we’ll calculate rainwater harvesting potential.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCancelClick}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#1e293b] border border-transparent hover:border-[#24354c] transition-all cursor-pointer"
            title="Cancel and return to home"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cancel Confirmation Dialog */}
        <AnimatePresence>
          {showCancelConfirm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-2xl bg-amber-950/60 border border-amber-600/50 text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <span className="text-sm font-medium">
                  Discard entered information and return to home?
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#0e1626] hover:bg-[#1a273a] text-slate-200 text-xs font-bold border border-[#24354c] cursor-pointer"
                >
                  Keep Editing
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
                >
                  Yes, Discard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ───────── A) NAME YOUR BUILDING ───────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="building-name-input"
              className="block text-sm sm:text-base font-bold text-white font-['Outfit',sans-serif]"
            >
              Name your building <span className="text-rose-400">*</span>
            </label>
            <span
              className={`text-xs font-semibold ${
                draft.name.length > 40
                  ? 'text-rose-400 font-bold'
                  : draft.name.length >= 35
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              {draft.name.length}/40
            </span>
          </div>

          <div className="relative">
            <input
              id="building-name-input"
              type="text"
              maxLength={40}
              value={draft.name}
              onChange={(e) => {
                onUpdateDraft({ name: e.target.value });
                if (!touchedName) setTouchedName(true);
              }}
              onBlur={() => setTouchedName(true)}
              placeholder="e.g. My House, School Block A, Farm Shed, Main Office"
              className={`w-full px-4 py-3.5 rounded-2xl bg-[#0b1120] border text-white placeholder:text-slate-500 text-base font-medium focus:outline-none focus:ring-2 transition-all ${
                isDuplicate || (touchedName && isNameEmpty) || isNameTooLong
                  ? 'border-rose-500/80 focus:ring-rose-500/30'
                  : 'border-[#24354c] focus:border-teal-400 focus:ring-teal-400/20'
              }`}
            />
          </div>

          {/* Error / Warning feedback for Name */}
          {isDuplicate && (
            <p className="text-xs sm:text-sm font-semibold text-rose-400 flex items-center gap-1.5 pt-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>A building with this name already exists. Please choose a different name.</span>
            </p>
          )}
          {touchedName && isNameEmpty && (
            <p className="text-xs sm:text-sm font-semibold text-rose-400 flex items-center gap-1.5 pt-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Building name is required.</span>
            </p>
          )}
        </div>

        {/* ───────── B) WHAT TYPE OF BUILDING IS IT? ───────── */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-sm sm:text-base font-bold text-white font-['Outfit',sans-serif]">
              What type of building is it? <span className="text-rose-400">*</span>
            </label>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an icon to identify your building easily in your saved collection.
            </p>
          </div>

          {/* Grid of 10 building types */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
            {BUILDING_TYPE_OPTIONS.map((opt) => {
              const isSelected = draft.buildingTypeKey === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  id={`building-type-${opt.key}`}
                  onClick={() => {
                    onUpdateDraft({ buildingTypeKey: opt.key });
                  }}
                  className={`relative p-3.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 min-h-[90px] ${
                    isSelected
                      ? 'bg-teal-500/20 border-teal-400 text-white ring-2 ring-teal-400/40 shadow-md shadow-teal-500/10'
                      : 'bg-[#0b1120] hover:bg-[#162235] border-[#24354c] hover:border-slate-600 text-slate-300'
                  }`}
                >
                  <span className="text-2xl sm:text-3xl select-none" role="img" aria-label={opt.name}>
                    {opt.icon}
                  </span>
                  <span className={`text-xs font-bold line-clamp-2 ${isSelected ? 'text-teal-300' : 'text-slate-300'}`}>
                    {opt.name}
                  </span>

                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Controlled Custom Building Type text input when Custom is selected */}
          {isCustomSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-2"
            >
              <div className="p-4 rounded-2xl bg-[#0b1120] border border-teal-500/40 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={customInputId}
                    className="block text-xs sm:text-sm font-bold text-teal-300"
                  >
                    Type your building type <span className="text-rose-400">*</span>
                  </label>
                  <span
                    className={`text-xs font-semibold ${
                      (draft.customTypeName || '').length > 30
                        ? 'text-rose-400 font-bold'
                        : 'text-slate-400'
                    }`}
                  >
                    {(draft.customTypeName || '').length}/30
                  </span>
                </div>

                <input
                  id={customInputId}
                  type="text"
                  maxLength={30}
                  value={draft.customTypeName || ''}
                  onChange={(e) => {
                    onUpdateDraft({ customTypeName: e.target.value });
                    if (!touchedCustomType) setTouchedCustomType(true);
                  }}
                  onBlur={() => setTouchedCustomType(true)}
                  placeholder="e.g. Temple, Warehouse, Farm shed, Community hall"
                  autoFocus
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-[#131d2e] border text-white placeholder:text-slate-500 text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                    touchedCustomType && isCustomTypeEmpty
                      ? 'border-rose-500/80 focus:ring-rose-500/30'
                      : 'border-[#24354c] focus:border-teal-400 focus:ring-teal-400/20'
                  }`}
                />

                {touchedCustomType && isCustomTypeEmpty && (
                  <p className="text-xs font-semibold text-rose-400 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Please enter your custom building type.</span>
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ───────── C) ACTIONS: CONTINUE & CANCEL ───────── */}
        <div className="border-t border-[#1e293b] pt-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCancelClick}
            className="px-5 py-3 rounded-2xl bg-[#0b1120] hover:bg-[#162235] text-slate-300 hover:text-white border border-[#24354c] font-bold text-sm transition-all cursor-pointer text-center order-2 sm:order-1"
          >
            Cancel
          </button>

          <div className="flex flex-col items-stretch sm:items-end gap-1.5 order-1 sm:order-2">
            <button
              type="button"
              id="stage1-continue-btn"
              disabled={!isValid}
              onClick={onContinue}
              className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-black text-base shadow-lg transition-all min-h-[50px] ${
                isValid
                  ? 'bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-950 shadow-teal-500/20 cursor-pointer'
                  : 'bg-[#1e293b] text-slate-500 border border-[#24354c] cursor-not-allowed opacity-75'
              }`}
            >
              <span>Continue to Calculation</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {!isValid && (
              <span className="text-xs text-amber-300/90 font-medium text-center sm:text-right">
                {disabledReason}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
