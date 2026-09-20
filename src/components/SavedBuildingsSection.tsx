import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  MapPin,
  Trash2,
  Edit2,
  Plus,
  ArrowRight,
  Layers,
  Container,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { SavedBuilding } from '../types';

interface SavedBuildingsSectionProps {
  buildings: SavedBuilding[];
  isLoading: boolean;
  onSelectBuilding: (building: SavedBuilding) => void;
  onEditBuilding: (building: SavedBuilding) => void;
  onDeleteBuilding: (buildingId: string) => Promise<void>;
  onNewBlankBuilding: () => void;
}

export const SavedBuildingsSection: React.FC<SavedBuildingsSectionProps> = ({
  buildings,
  isLoading,
  onSelectBuilding,
  onEditBuilding,
  onDeleteBuilding,
  onNewBlankBuilding,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await onDeleteBuilding(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 mb-10 text-left">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <h2 className="text-2xl sm:text-3xl font-bold font-['Outfit',sans-serif] text-slate-900">
              Your Saved Buildings
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Tap any building to calculate today&apos;s rain without measuring again.
          </p>
        </div>

        {/* Small "+ Calculate a New Building" option */}
        <button
          type="button"
          id="saved-buildings-new-btn"
          onClick={onNewBlankBuilding}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 font-bold text-sm transition-all shadow-2xs cursor-pointer min-h-[42px] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-teal-700" />
          <span>+ Calculate a New Building</span>
        </button>
      </div>

      {isLoading ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-2xs">
          <Loader2 className="w-8 h-8 animate-spin text-teal-700 mx-auto mb-2" />
          <p className="text-sm text-slate-600 font-medium">Loading your saved buildings...</p>
        </div>
      ) : buildings.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-2xs">
          <div className="text-4xl mb-3">🏡</div>
          <h3 className="text-lg font-bold text-slate-900 font-['Outfit',sans-serif]">
            No saved buildings yet
          </h3>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-1 mb-5">
            Fill in your roof measurements on the calculator, then tap &quot;💾 Save This Building&quot; to keep it here for next time.
          </p>
          <button
            type="button"
            onClick={onNewBlankBuilding}
            className="px-5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
          >
            Start First Building
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buildings.map((building) => {
            const totalArea = (building.roofs || []).reduce((acc, r) => {
              const l = parseFloat(r.length) || 0;
              const w = parseFloat(r.width) || 0;
              return acc + l * w;
            }, 0);

            const isConfirmingDelete = deleteConfirmId === building.id;

            return (
              <div
                key={building.id}
                id={`saved-building-card-${building.id}`}
                onClick={() => onSelectBuilding(building)}
                className="group relative p-5 rounded-2xl bg-white hover:bg-slate-50/90 border border-slate-200 hover:border-teal-600 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                {/* Card Top */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🏡</span>
                      <div>
                        <h3 className="text-lg font-bold font-['Outfit',sans-serif] text-slate-900 group-hover:text-teal-900 transition-colors">
                          {building.nickname}
                        </h3>
                        {building.locationLabel && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                            <MapPin className="w-3 h-3 text-teal-600" />
                            <span>{building.locationLabel}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        title="Edit building details"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditBuilding(building);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        title="Delete building"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(isConfirmingDelete ? null : building.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Delete Confirmation Overlay inside card */}
                  <AnimatePresence>
                    {isConfirmingDelete && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="my-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex flex-col sm:flex-row items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Delete &quot;{building.nickname}&quot;?</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 rounded bg-white text-slate-700 border border-slate-200 font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === building.id}
                            onClick={(e) => handleDelete(building.id, e)}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer disabled:opacity-50"
                          >
                            {deletingId === building.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Badges Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-700">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                      <span>
                        <strong>{totalArea} m²</strong> ({building.roofs.length} {building.roofs.length === 1 ? 'roof' : 'roofs'})
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                      <Container className="w-3.5 h-3.5 text-sky-700 shrink-0" />
                      <span>
                        <strong>{Number(building.tankCapacity).toLocaleString()} L</strong> tank
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Bottom CTA */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-800 group-hover:text-teal-950">
                  <span>Calculate Today&apos;s Rain</span>
                  <div className="flex items-center gap-1 text-teal-700 group-hover:translate-x-1 transition-transform">
                    <span>Load</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
