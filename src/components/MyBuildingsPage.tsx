import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Plus, 
  Search, 
  ArrowUpDown, 
  MapPin, 
  Layers, 
  Container, 
  Droplet, 
  Eye, 
  Edit2, 
  Copy, 
  Trash2, 
  Download, 
  Upload, 
  AlertTriangle, 
  RotateCcw,
  Sparkles,
  Calendar,
  X
} from 'lucide-react';
import { SavedBuilding, getBuildingTypeDisplay } from '../types';
import { normalizeRoofs, normalizeTanks, calcWaterSummary, toBuckets, DEFAULT_INPUTS } from '../utils/calculations';
import { useAppSettings } from '../context/AppSettingsContext';
import { BuildingCardWaterImpact } from './BuildingCardWaterImpact';
import { saveBuildingToStorage } from '../utils/buildingStorage';

interface MyBuildingsPageProps {
  buildings: SavedBuilding[];
  onOpenBuilding: (building: SavedBuilding) => void;
  onEditBuilding: (building: SavedBuilding) => void;
  onDuplicateBuilding: (buildingId: string) => void;
  onDeleteBuilding: (buildingId: string) => void;
  onRestoreBuilding?: (building: SavedBuilding) => void;
  onCreateNewBuilding: () => void;
  onImportBuildings?: (importedList: SavedBuilding[]) => void;
  onBackToHome?: () => void;
  onUpdateBuilding?: (building: SavedBuilding) => void;
}

type SortOption = 'newest' | 'oldest' | 'name' | 'area';

export const MyBuildingsPage: React.FC<MyBuildingsPageProps> = ({
  buildings,
  onOpenBuilding,
  onEditBuilding,
  onDuplicateBuilding,
  onDeleteBuilding,
  onRestoreBuilding,
  onCreateNewBuilding,
  onImportBuildings,
  onBackToHome,
  onUpdateBuilding,
}) => {
  const { unit, formatArea, formatVolume } = useAppSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Undo state
  const [undoItem, setUndoItem] = useState<{ building: SavedBuilding; timerId: NodeJS.Timeout } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Filter & Sort
  const filteredBuildings = useMemo(() => {
    let list = [...buildings];

    // Search filter
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter((b) => {
        const typeInfo = getBuildingTypeDisplay(b.buildingTypeKey, b.customTypeName);
        return (
          b.name.toLowerCase().includes(q) ||
          typeInfo.name.toLowerCase().includes(q) ||
          (b.location?.name && b.location.name.toLowerCase().includes(q)) ||
          (b.locationLabel && b.locationLabel.toLowerCase().includes(q))
        );
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'area') {
        const areaA = normalizeRoofs(a.roofs, a.directRoofArea, a.roofType).reduce((acc, r) => acc + (parseFloat(r.area) || 0), 0);
        const areaB = normalizeRoofs(b.roofs, b.directRoofArea, b.roofType).reduce((acc, r) => acc + (parseFloat(r.area) || 0), 0);
        return areaB - areaA;
      }
      return 0;
    });

    return list;
  }, [buildings, searchTerm, sortBy]);

  // Handle Delete with 5-second Undo
  const handleDeleteClick = (building: SavedBuilding, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);

    // Call delete
    onDeleteBuilding(building.id);

    // If previous undo timer exists, clear it
    if (undoItem) {
      clearTimeout(undoItem.timerId);
    }

    const timer = setTimeout(() => {
      setUndoItem(null);
    }, 5000);

    setUndoItem({
      building,
      timerId: timer,
    });
  };

  const handleUndo = () => {
    if (undoItem && onRestoreBuilding) {
      clearTimeout(undoItem.timerId);
      onRestoreBuilding(undoItem.building);
      setUndoItem(null);
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(buildings, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `rainwise-buildings-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  // Import JSON Backup
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && onImportBuildings) {
          onImportBuildings(parsed);
        }
      } catch (err) {
        alert('Invalid JSON backup file. Please select a valid RainWise backup.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 text-left space-y-7">
      
      {/* ───────── 5-SECOND UNDO BANNER ───────── */}
      <AnimatePresence>
        {undoItem && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-2xl bg-[#1e293b] border border-teal-500/50 shadow-xl flex items-center justify-between gap-3 text-white sticky top-20 z-40"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-5 h-5 text-rose-400" />
              <span className="text-sm font-medium">
                Deleted &quot;<strong>{undoItem.building.name}</strong>&quot;
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndo}
                className="px-3.5 py-1.5 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo (5s)</span>
              </button>
              <button
                type="button"
                onClick={() => setUndoItem(null)}
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ───────── TOP BAR & ACTIONS ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🏗️</span>
            <h1 className="text-2xl sm:text-3xl font-black font-['Outfit',sans-serif] text-white">
              My Buildings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold text-xs border border-teal-500/40">
              {buildings.length} {buildings.length === 1 ? 'building' : 'buildings'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Manage your saved properties, recalculate with live weather, or update designs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Create New Building */}
          <button
            type="button"
            id="my-buildings-create-btn"
            onClick={onCreateNewBuilding}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-md transition cursor-pointer min-h-[42px]"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[3]" />
            <span>+ Create new building</span>
          </button>

          {/* Backup Import / Export */}
          {buildings.length > 0 && (
            <button
              type="button"
              onClick={handleExportBackup}
              title="Download JSON Backup of all buildings"
              className="p-2.5 rounded-xl bg-[#131d2e] hover:bg-[#1f2d42] text-slate-300 hover:text-white border border-[#24354c] text-xs font-semibold transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Import JSON Backup"
            className="p-2.5 rounded-xl bg-[#131d2e] hover:bg-[#1f2d42] text-slate-300 hover:text-white border border-[#24354c] text-xs font-semibold transition cursor-pointer"
          >
            <Upload className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>

      {/* ───────── SEARCH & SORT CONTROLS ───────── */}
      {buildings.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by building name, type, or location..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#131d2e] border border-[#24354c] text-white placeholder:text-slate-500 text-sm focus:border-teal-400 focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="sm:col-span-4 relative">
            <ArrowUpDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#131d2e] border border-[#24354c] text-white text-sm focus:border-teal-400 focus:outline-none cursor-pointer"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="name">Sort: Name (A-Z)</option>
              <option value="area">Sort: Largest Roof Area</option>
            </select>
          </div>
        </div>
      )}

      {/* ───────── EMPTY STATE ───────── */}
      {buildings.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-[#131d2e] rounded-3xl border border-dashed border-[#24354c] shadow-md space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#0b1120] border border-[#24354c] flex items-center justify-center text-3xl mx-auto">
            🏡
          </div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black font-['Outfit',sans-serif] text-white">
              You haven&apos;t saved any buildings yet
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Create your first building to measure its roof, calculate rainwater harvest with local rainfall, and save the design.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onCreateNewBuilding}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-teal-400 hover:bg-teal-300 active:bg-teal-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer min-h-[48px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>➕ Create new building</span>
            </button>
          </div>
        </div>
      ) : filteredBuildings.length === 0 ? (
        /* No search results */
        <div className="p-8 text-center bg-[#131d2e] rounded-3xl border border-[#24354c] text-slate-400">
          <p>No saved buildings matched &quot;{searchTerm}&quot;.</p>
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="mt-2 text-xs font-bold text-teal-300 hover:underline"
          >
            Clear Search Filter
          </button>
        </div>
      ) : (
        /* ───────── BUILDINGS CARDS GRID ───────── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredBuildings.map((building) => {
            const typeInfo = getBuildingTypeDisplay(building.buildingTypeKey, building.customTypeName);
            const normalizedRoofs = normalizeRoofs(building.roofs, building.directRoofArea, building.roofType);
            const totalArea = normalizedRoofs.reduce((acc, r) => acc + (parseFloat(r.area) || 0), 0);

            const { tanks: normalizedTanks, noTankYet } = normalizeTanks(building.tanks, building.tankCapacity, building.noTankYet);
            const totalTankL = noTankYet ? 0 : normalizedTanks.reduce((acc, t) => acc + (parseFloat(t.capacity) || 0), 0);

            // Compute building water summary
            const bInputs = {
              ...DEFAULT_INPUTS,
              roofs: normalizedRoofs,
              tanks: normalizedTanks,
              noTankYet,
              householdSize: String(building.people || 4),
              locationName: building.location?.name || building.locationLabel || '',
            };
            const bSummary = calcWaterSummary(bInputs, unit);
            const savedB = bSummary.year.keptBuckets;
            const wastedB = bSummary.year.wastedBuckets;
            const savedL = bSummary.year.kept;
            const wastedL = bSummary.year.wasted;

            const locationDisplay = building.location?.name || building.locationLabel || 'Location not set';
            const savedDateStr = new Date(building.updatedAt || building.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            const isConfirmingDelete = confirmDeleteId === building.id;

            return (
              <div
                key={building.id}
                id={`my-building-card-${building.id}`}
                className="group relative p-5 sm:p-6 rounded-3xl bg-[#131d2e] hover:bg-[#162235] border border-[#24354c] hover:border-teal-500/60 shadow-md hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top: Icon + Name + Actions */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#0b1120] border border-[#24354c] flex items-center justify-center text-2xl shrink-0">
                        {typeInfo.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-teal-400">
                            {typeInfo.name}
                          </span>
                        </div>
                        <h2 className="text-lg font-black font-['Outfit',sans-serif] text-white group-hover:text-teal-300 transition-colors">
                          {building.name}
                        </h2>
                      </div>
                    </div>

                    {/* Quick action buttons on card */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        title="Duplicate building"
                        onClick={() => onDuplicateBuilding(building.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        title="Edit building"
                        onClick={() => onEditBuilding(building)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-[#1e293b] transition cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        title="Delete building"
                        onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : building.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Location label */}
                  <div className="flex items-center gap-1 text-xs text-slate-400 mb-3.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span className="truncate">{locationDisplay}</span>
                  </div>

                  {/* Delete Confirmation Overlay */}
                  <AnimatePresence>
                    {isConfirmingDelete && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="my-3 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-inner"
                      >
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>Delete &quot;{building.name}&quot;?</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 rounded-lg bg-[#0b1120] text-slate-300 border border-[#24354c] font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteClick(building, e)}
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="p-2.5 rounded-xl bg-[#0b1120] border border-[#24354c] flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-slate-400 block">Total Roof</span>
                        <span className="font-bold text-white truncate block">
                          {formatArea(totalArea)} ({normalizedRoofs.length} {normalizedRoofs.length === 1 ? 'roof' : 'roofs'})
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#0b1120] border border-[#24354c] flex items-center gap-2">
                      <Container className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <div className="overflow-hidden">
                        <span className="text-[10px] text-slate-400 block">Storage</span>
                        <span className="font-bold text-white truncate block">
                          {noTankYet ? 'No tank' : `${formatVolume(totalTankL)} (${normalizedTanks.length})`}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <BuildingCardWaterImpact
                        building={building}
                        unit={unit}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Open / Recalculate CTA */}
                <div className="mt-4 pt-3.5 border-t border-[#1e293b] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenBuilding(building)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-300 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Open &amp; Recalculate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditBuilding(building)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                  >
                    <span>Edit</span>
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
