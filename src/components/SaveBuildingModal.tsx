import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, MapPin, Check, AlertCircle, Loader2, Sparkles, LogIn } from 'lucide-react';
import { AuthUser, CalculatorInputs, SavedBuilding } from '../types';
import { saveUserBuilding } from '../lib/firebase';
import { reverseGeocodeCoords } from '../utils/weather';
import { normalizeRoofs } from '../utils/calculations';

interface SaveBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  inputs: CalculatorInputs;
  existingBuilding?: SavedBuilding | null;
  onSavedSuccess: (building: SavedBuilding) => void;
  onRequestSignIn: () => void;
}

const COMMON_NICKNAMES = [
  'My House',
  "Grandpa's Farm",
  'Farmhouse & Barn',
  'North Shed',
  'School Building',
  'Apartment Block',
];

export const SaveBuildingModal: React.FC<SaveBuildingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  inputs,
  existingBuilding,
  onSavedSuccess,
  onRequestSignIn,
}) => {
  const [nickname, setNickname] = useState(existingBuilding?.nickname || '');
  const [locationLabel, setLocationLabel] = useState(
    existingBuilding?.locationLabel || inputs.weatherInfo?.locationName || ''
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // If user is not logged in, show the gentle prompt:
  // "Sign up to save this building for next time?"
  if (!currentUser) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-md bg-[#131d2e] rounded-3xl shadow-xl border border-[#24354c] overflow-hidden"
          >
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-3xl">
                💾
              </div>

              <div>
                <h3 className="text-xl font-bold font-['Outfit',sans-serif] text-white">
                  Sign up to save this building for next time?
                </h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  Create a free account or sign in so you don&apos;t have to measure your roof and tank every time it rains.
                </p>
              </div>

              <div className="pt-2 space-y-2.5">
                <button
                  type="button"
                  id="prompt-signin-to-save-btn"
                  onClick={() => {
                    onClose();
                    onRequestSignIn();
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-950 font-bold text-sm sm:text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Sign In / Sign Up</span>
                </button>

                <button
                  type="button"
                  id="prompt-cancel-save-btn"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  Continue as Guest without saving
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                You can always calculate as guest anytime without saving.
              </p>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // Calculate total roof area to preview in the summary
  const normalizedRoofs = normalizeRoofs(inputs.roofs, inputs.directRoofArea, inputs.roofType);
  const totalRoofArea = normalizedRoofs.reduce((acc, r) => acc + (parseFloat(r.area) || 0), 0);

  const handleDetectLocation = () => {
    setLocationError(null);
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const area = await reverseGeocodeCoords(pos.coords.latitude, pos.coords.longitude);
          setLocationLabel(area);
        } catch {
          setLocationError('Could not detect location. You can type your town name or leave it blank.');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
        setLocationError('Location permission was declined. You can type your town name manually.');
      },
      { timeout: 8000 }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!nickname.trim()) {
      setSaveError('Please give this building a short nickname (e.g. "My House").');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await saveUserBuilding(
        currentUser.uid,
        {
          nickname: nickname.trim(),
          locationLabel: locationLabel.trim() || undefined,
          roofs: inputs.roofs,
          tanks: inputs.tanks,
          noTankYet: inputs.noTankYet,
          householdSize: inputs.householdSize || '4',
          tankCapacity: inputs.tanks?.[0]?.capacity || inputs.tankCapacity || '1000',
          efficiency: inputs.efficiency || '80',
          dailyRequirement: inputs.dailyRequirement || undefined,
        },
        existingBuilding?.id
      );

      setSavedSuccessMessage('Saved! You can quickly reload this building next time.');
      setTimeout(() => {
        onSavedSuccess(saved);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Error saving building:', err);
      setSaveError(err.message || 'Failed to save building. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-[#131d2e] rounded-3xl shadow-xl border border-[#24354c] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-[#1e293b] flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">💾</span>
              <div>
                <h3 className="text-xl font-bold font-['Outfit',sans-serif] text-white">
                  {existingBuilding ? 'Update Saved Building' : 'Save This Building'}
                </h3>
                <p className="text-xs text-slate-400">
                  Save your building dimensions to easily reload next time.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#1e293b] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {savedSuccessMessage ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
                  <Check className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-white font-['Outfit',sans-serif]">
                  {savedSuccessMessage}
                </h4>
                <p className="text-sm text-slate-400">
                  Reload it anytime from &quot;Your Saved Buildings&quot; on the home page.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                {/* Building Nickname */}
                <div>
                  <label className="block text-sm font-bold text-slate-200 mb-1">
                    Building Nickname <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={60}
                    placeholder="e.g. My House, Grandpa's Farm, School Block"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-[#24354c] bg-[#0e1626] text-slate-100 placeholder:text-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  
                  {/* Quick suggestion chips */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-xs text-slate-400 font-medium">Suggestions:</span>
                    {COMMON_NICKNAMES.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setNickname(name)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-[#0e1626] hover:bg-[#1e293b] text-slate-300 hover:text-teal-300 border border-[#24354c] transition-colors cursor-pointer"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Location label */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-slate-300">
                      City / Area (optional)
                    </label>
                    <button
                      type="button"
                      id="save-building-detect-location-btn"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                    >
                      {isDetectingLocation ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Detecting...</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3 h-3" />
                          <span>📍 Use My Location</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={80}
                    placeholder="e.g. Coimbatore, North Farm"
                    value={locationLabel}
                    onChange={(e) => setLocationLabel(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#24354c] bg-[#0e1626] text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  {locationError && (
                    <p className="text-xs text-amber-300 mt-1">{locationError}</p>
                  )}
                </div>

                {/* What is being saved summary */}
                <div className="p-3.5 rounded-2xl bg-[#0e1626] border border-[#24354c] text-xs text-slate-300 space-y-1.5">
                  <div className="font-bold text-teal-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Fixed details being saved:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-slate-300">
                    <div>• {inputs.roofs.length} roof section(s) ({totalRoofArea} m²)</div>
                    <div>• {inputs.tankCapacity || '1,000'} L Tank size</div>
                    <div>• {inputs.efficiency || '80'}% Efficiency</div>
                    {inputs.dailyRequirement && (
                      <div>• {inputs.dailyRequirement} L/day need</div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    (Rainfall is NOT saved because it changes each storm — only the building structure is saved)
                  </p>
                </div>

                {saveError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs sm:text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{saveError}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="save-building-submit-btn"
                    disabled={isSaving}
                    className="px-6 py-3 rounded-xl bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-950 font-bold text-sm sm:text-base shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 min-h-[44px]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Building</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
