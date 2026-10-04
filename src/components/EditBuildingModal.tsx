import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { SavedBuilding } from '../types';
import { saveUserBuilding } from '../lib/firebase';
import { reverseGeocodeCoords } from '../utils/weather';
import { StepperNumberInput } from './StepperNumberInput';

interface EditBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: SavedBuilding | null;
  onUpdated: (updated: SavedBuilding) => void;
}

export const EditBuildingModal: React.FC<EditBuildingModalProps> = ({
  isOpen,
  onClose,
  building,
  onUpdated,
}) => {
  if (!isOpen || !building) return null;

  const [nickname, setNickname] = useState(building.nickname);
  const [locationLabel, setLocationLabel] = useState(building.locationLabel || '');
  const [tankCapacity, setTankCapacity] = useState(building.tankCapacity || '1000');
  const [efficiency, setEfficiency] = useState(building.efficiency || '80');
  const [dailyRequirement, setDailyRequirement] = useState(building.dailyRequirement || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return;
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const area = await reverseGeocodeCoords(pos.coords.latitude, pos.coords.longitude);
          setLocationLabel(area);
        } catch {
          // ignore
        } finally {
          setIsDetecting(false);
        }
      },
      () => setIsDetecting(false),
      { timeout: 7000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Nickname cannot be empty.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // Update tanks list if present
      let updatedTanks = building.tanks;
      if (updatedTanks && updatedTanks.length > 0) {
        updatedTanks = [
          { ...updatedTanks[0], capacity: tankCapacity.trim() || '1000' },
          ...updatedTanks.slice(1),
        ];
      }

      const updated = await saveUserBuilding(
        building.userId,
        {
          nickname: nickname.trim(),
          locationLabel: locationLabel.trim() || undefined,
          roofs: building.roofs,
          tanks: updatedTanks,
          noTankYet: building.noTankYet,
          householdSize: building.householdSize || '4',
          tankCapacity: tankCapacity.trim() || '1000',
          efficiency: efficiency.trim() || '80',
          dailyRequirement: dailyRequirement.trim() || undefined,
        },
        building.id
      );
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update building details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">✏️</span>
              <h3 className="text-lg font-bold font-['Outfit',sans-serif] text-slate-900 dark:text-white">
                Edit Building Details
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Building Nickname
              </label>
              <input
                type="text"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  City / Area
                </label>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetecting}
                  className="text-xs text-teal-800 dark:text-teal-400 hover:text-teal-950 flex items-center gap-1 font-bold cursor-pointer"
                >
                  <MapPin className="w-3 h-3" />
                  <span>{isDetecting ? 'Detecting...' : 'Use My Location'}</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. Coimbatore"
                value={locationLabel}
                onChange={(e) => setLocationLabel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>

            <div className="space-y-3">
              <StepperNumberInput
                id="edit-tank-capacity"
                label="Storage Tank Size"
                unit="Litres"
                value={tankCapacity}
                onChange={setTankCapacity}
                step={(curr) => (curr >= 5000 ? 500 : 100)}
                min={100}
                max={500000}
                placeholder="1000"
                compact
              />

              <StepperNumberInput
                id="edit-efficiency"
                label="Catchment Runoff Efficiency"
                unit="%"
                value={efficiency}
                onChange={setEfficiency}
                step={5}
                min={10}
                max={100}
                placeholder="80"
                compact
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 min-h-[44px]"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
