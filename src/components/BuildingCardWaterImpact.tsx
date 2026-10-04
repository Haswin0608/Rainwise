import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Droplet, 
  RotateCcw, 
  AlertTriangle, 
  HelpCircle, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  SavedBuilding, 
  FullWaterSummary, 
  PeriodWaterSummary, 
  CalculationPeriod,
  UnitSystem 
} from '../types';
import { 
  getBuildingWaterSummary, 
  normalizeRoofs, 
  normalizeTanks, 
  toBuckets 
} from '../utils/calculations';
import { fetch3YearHistoricalRainfall } from '../utils/weather';
import { saveBuildingToStorage } from '../utils/buildingStorage';
import { useAppSettings } from '../context/AppSettingsContext';

interface BuildingCardWaterImpactProps {
  building: SavedBuilding;
  unit?: UnitSystem;
}

export const BuildingCardWaterImpact: React.FC<BuildingCardWaterImpactProps> = ({
  building,
  unit = 'metric',
}) => {
  const { formatVolume } = useAppSettings();
  const [activeTab, setActiveTab] = useState<CalculationPeriod>('week');
  const [summary, setSummary] = useState<FullWaterSummary | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'no_rain' | 'error' | 'no_roof'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showTooltip, setShowTooltip] = useState(false);

  // Guard to prevent re-fetching for the same building ID if already resolved
  const processedBuildingIdRef = useRef<string | null>(null);

  // Roof & Tank checks
  const normalizedRoofs = normalizeRoofs(building.roofs, building.directRoofArea, building.roofType);
  const totalRoofArea = normalizedRoofs.reduce((acc, r) => acc + (parseFloat(r.area) || 0), 0);

  const { tanks, noTankYet } = normalizeTanks(building.tanks, building.tankCapacity, building.noTankYet);
  const totalTankL = noTankYet ? 0 : tanks.reduce((acc, t) => acc + (parseFloat(t.capacity) || 0), 0);
  const isNoTank = noTankYet || tanks.length === 0 || totalTankL === 0;

  useEffect(() => {
    let isMounted = true;

    async function loadOrFetchWaterSummary() {
      if (totalRoofArea <= 0) {
        if (isMounted) setStatus('no_roof');
        return;
      }

      // 1. Check if existing snapshot is valid & non-zero
      const existingSnapshot = building.summarySnapshot?.summary;
      const isSnapshotValid = 
        existingSnapshot &&
        (existingSnapshot.year.kept + existingSnapshot.year.wasted > 0 || existingSnapshot.week.kept + existingSnapshot.week.wasted > 0);

      if (isSnapshotValid && existingSnapshot) {
        if (isMounted) {
          setSummary(existingSnapshot);
          setStatus('success');
        }
        return;
      }

      // 2. Check if stored rainfall array exists
      if (building.monthlyRainfallMm && building.monthlyRainfallMm.length === 12) {
        const computed = getBuildingWaterSummary(building, unit);
        if (isMounted) {
          setSummary(computed);
          setStatus('success');
        }

        // Persist silently without triggering parent state loop
        const updatedB: SavedBuilding = {
          ...building,
          summarySnapshot: {
            calculatedAt: new Date().toISOString(),
            summary: computed,
          },
        };
        saveBuildingToStorage(updatedB);
        return;
      }

      // 3. Need to fetch from lat/lon or check location
      if (building.location?.latitude && building.location?.longitude) {
        if (isMounted) setStatus('loading');
        try {
          const historical = await fetch3YearHistoricalRainfall(
            building.location.latitude,
            building.location.longitude,
            building.location.name
          );

          if (!isMounted) return;

          const updatedBuilding: SavedBuilding = {
            ...building,
            monthlyRainfallMm: historical.typicalMonthlyRainfallMm,
            rainfallFetchedAt: new Date().toISOString(),
          };

          const computed = getBuildingWaterSummary(updatedBuilding, unit);
          setSummary(computed);
          setStatus('success');

          saveBuildingToStorage({
            ...updatedBuilding,
            summarySnapshot: {
              calculatedAt: new Date().toISOString(),
              summary: computed,
            },
          });
        } catch (err) {
          if (isMounted) {
            setStatus('error');
            setErrorMessage("Couldn't load rainfall. Tap to retry.");
          }
        }
      } else if (building.location?.name) {
        const computed = getBuildingWaterSummary(building, unit);
        if (isMounted) {
          if (computed.year.rainOnRoof > 0) {
            setSummary(computed);
            setStatus('success');
          } else {
            setStatus('no_rain');
          }
        }
      } else {
        if (isMounted) setStatus('no_rain');
      }
    }

    loadOrFetchWaterSummary();

    return () => {
      isMounted = false;
    };
  }, [
    building.id,
    building.updatedAt,
    building.monthlyRainfallMm,
    building.summarySnapshot,
    building.location?.latitude,
    building.location?.longitude,
    totalRoofArea,
    unit,
  ]);

  // Handle Retry
  const handleRetry = () => {
    setStatus('loading');
    if (building.location?.latitude && building.location?.longitude) {
      fetch3YearHistoricalRainfall(building.location.latitude, building.location.longitude, building.location.name)
        .then((historical) => {
          const updatedBuilding: SavedBuilding = {
            ...building,
            monthlyRainfallMm: historical.typicalMonthlyRainfallMm,
            rainfallFetchedAt: new Date().toISOString(),
          };
          const computed = getBuildingWaterSummary(updatedBuilding, unit);
          setSummary(computed);
          setStatus('success');
          saveBuildingToStorage({
            ...updatedBuilding,
            summarySnapshot: {
              calculatedAt: new Date().toISOString(),
              summary: computed,
            },
          });
        })
        .catch(() => {
          setStatus('error');
          setErrorMessage("Couldn't load rainfall. Tap to retry.");
        });
    }
  };

  if (status === 'no_roof') {
    return (
      <div className="p-3.5 rounded-2xl bg-[#0b1120] border border-[#24354c] text-xs text-slate-400 text-center font-medium">
        🏠 Add a roof to see water impact.
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="p-3.5 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-2 animate-pulse">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Water Impact</span>
          <span className="text-[10px] text-teal-400 font-mono">Calculating...</span>
        </div>
        <div className="h-10 bg-[#131d2e] rounded-xl w-full" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-3.5 rounded-2xl bg-[#0b1120] border border-amber-500/40 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-amber-300">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (status === 'no_rain' || !summary) {
    return (
      <div className="p-3.5 rounded-2xl bg-[#0b1120] border border-[#24354c] text-xs text-slate-400 text-center font-medium">
        🌧️ No rain data for this place. Set location to calculate.
      </div>
    );
  }

  // Active period summary
  const activePeriodSummary: PeriodWaterSummary =
    activeTab === 'week' ? summary.week : activeTab === 'month' ? summary.month : summary.year;

  const savedBuckets = isNoTank ? 0 : activePeriodSummary.keptBuckets;
  const savedLitres = isNoTank ? 0 : activePeriodSummary.kept;
  const wastedBuckets = activePeriodSummary.wastedBuckets;
  const wastedLitres = activePeriodSummary.wasted;

  const calculatedDateStr = building.summarySnapshot?.calculatedAt
    ? new Date(building.summarySnapshot.calculatedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="p-3.5 sm:p-4 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-3">
      {/* Header & Mini Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-[#1e293b] pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-200">Water Impact</span>
          <button
            type="button"
            onClick={() => setShowTooltip(!showTooltip)}
            className="w-4 h-4 rounded-full bg-[#131d2e] border border-[#24354c] text-slate-400 hover:text-white text-[10px] font-bold flex items-center justify-center cursor-pointer shrink-0"
            title="What is Saved and Wasted?"
            aria-label="Explain saved and wasted water"
          >
            ?
          </button>
        </div>

        {/* Mini Tab Switcher: Week | Month | Year */}
        <div className="inline-flex p-0.5 rounded-xl bg-[#131d2e] border border-[#24354c] text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('week')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'week' ? 'bg-teal-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Week
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('month')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'month' ? 'bg-teal-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('year')}
            className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
              activeTab === 'year' ? 'bg-teal-400 text-slate-950 font-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Tooltip Explanation */}
      {showTooltip && (
        <div className="p-2.5 rounded-xl bg-[#131d2e] border border-[#24354c] text-[11px] text-slate-300">
          💡 <strong>Saved</strong> = rain you keep and use in your tank. <strong>Wasted</strong> = rain that soaks into the roof or spills out of a full tank.
        </div>
      )}

      {/* Main Numbers Grid: Saved & Wasted */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Saved Box */}
        <div className="p-2.5 rounded-xl bg-[#131d2e] border border-teal-500/30">
          <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wider block">
            🟢 Saved
          </span>
          <strong className="text-base sm:text-lg font-black text-teal-300 font-['Outfit',sans-serif] block mt-0.5">
            {savedBuckets.toLocaleString()} <span className="text-xs font-normal text-slate-400"><span className="hidden sm:inline">buckets</span><span className="sm:hidden">bkt</span></span>
          </strong>
          <span className="text-[10px] text-slate-400 font-mono block">
            ({formatVolume(savedLitres)})
          </span>

          {isNoTank && (
            <span className="text-[10px] text-amber-300 font-semibold block mt-1 leading-tight">
              Add a tank to keep this water
            </span>
          )}
        </div>

        {/* Wasted Box */}
        <div className="p-2.5 rounded-xl bg-[#131d2e] border border-orange-500/30">
          <span className="text-[10px] text-orange-400 font-extrabold uppercase tracking-wider block">
            🟠 Wasted
          </span>
          <strong className="text-base sm:text-lg font-black text-orange-400 font-['Outfit',sans-serif] block mt-0.5">
            {wastedBuckets.toLocaleString()} <span className="text-xs font-normal text-slate-400"><span className="hidden sm:inline">buckets</span><span className="sm:hidden">bkt</span></span>
          </strong>
          <span className="text-[10px] text-slate-400 font-mono block">
            ({formatVolume(wastedLitres)})
          </span>
        </div>
      </div>

      {/* Dual Color Progress Bar & Date */}
      <div className="space-y-1 pt-1">
        <div className="w-full h-2 rounded-full bg-[#1e293b] overflow-hidden flex">
          <div
            style={{ width: `${activePeriodSummary.keptPercent}%` }}
            className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full"
          />
          <div
            style={{ width: `${activePeriodSummary.wastedPercent}%` }}
            className="bg-gradient-to-r from-orange-500 to-amber-500 h-full"
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>Updated {calculatedDateStr}</span>
          <span className="text-slate-400 font-medium">
            {activePeriodSummary.periodLabel}
          </span>
        </div>
      </div>
    </div>
  );
};
