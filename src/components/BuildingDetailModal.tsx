import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MapPin, 
  Layers, 
  Container, 
  Users, 
  Droplet, 
  Edit2, 
  Eye, 
  Download, 
  Sparkles,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { 
  SavedBuilding, 
  FullWaterSummary, 
  PeriodWaterSummary, 
  CalculationPeriod, 
  UnitSystem,
  getBuildingTypeDisplay 
} from '../types';
import { 
  normalizeRoofs, 
  normalizeTanks, 
  getBuildingWaterSummary, 
  toBuckets,
  MONTH_NAMES 
} from '../utils/calculations';
import { useAppSettings } from '../context/AppSettingsContext';

interface BuildingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: SavedBuilding;
  unit: UnitSystem;
  onOpenAndRecalculate: (building: SavedBuilding) => void;
  onEdit: (building: SavedBuilding) => void;
}

export const BuildingDetailModal: React.FC<BuildingDetailModalProps> = ({
  isOpen,
  onClose,
  building,
  unit,
  onOpenAndRecalculate,
  onEdit,
}) => {
  const { formatVolume, formatArea } = useAppSettings();
  const [activeTab, setActiveTab] = useState<CalculationPeriod>('week');
  const [selectedChartMonthIdx, setSelectedChartMonthIdx] = useState<number>(new Date().getMonth());

  if (!isOpen) return null;

  const typeInfo = getBuildingTypeDisplay(building.buildingTypeKey, building.customTypeName);
  const roofs = normalizeRoofs(building.roofs, building.directRoofArea, building.roofType);
  const totalRoofArea = roofs.reduce((acc, r) => acc + (parseFloat(r.area) || 0), 0);

  const { tanks, noTankYet } = normalizeTanks(building.tanks, building.tankCapacity, building.noTankYet);
  const totalTankL = noTankYet ? 0 : tanks.reduce((acc, t) => acc + (parseFloat(t.capacity) || 0), 0);

  const summary = getBuildingWaterSummary(building, unit);
  const activePeriodSummary: PeriodWaterSummary =
    activeTab === 'week' ? summary.week : activeTab === 'month' ? summary.month : summary.year;

  const savedDateStr = new Date(building.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const updatedDateStr = new Date(building.updatedAt || building.createdAt || Date.now()).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Friendly sentence generator
  const getFriendlySentence = (period: CalculationPeriod, s: PeriodWaterSummary) => {
    const pWord = period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'this year';
    if (s.keptBuckets <= 0) {
      return `No water collected ${pWord} yet. Add a tank or check rainfall!`;
    }
    return `For ${period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'this year'} you save about ${s.keptBuckets.toLocaleString()} buckets and waste about ${s.wastedBuckets.toLocaleString()} buckets.`;
  };

  // Personalized tips
  const tips: string[] = [];
  if (summary.year.spilled > 0) {
    tips.push(`Because about ${summary.year.spilledBuckets.toLocaleString()} buckets spilled over in typical rains, adding a larger or second tank will keep much more water.`);
  }
  if (summary.year.lostOnRoof > summary.year.kept) {
    tips.push(`A large portion of roof rain is lost on the roof surface. Cleaning gutters and maintaining smooth surfaces can increase your catch efficiency.`);
  }
  if (roofs.length === 1 && totalRoofArea > 80) {
    tips.push(`Consider catching rain from separate sheds or outbuildings to boost your total collection.`);
  }
  if (tips.length === 0) {
    tips.push(`Your rainwater setup is well-balanced for your location and roof area!`);
  }

  const monthlyBreakdown = summary.monthlyBreakdown || [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-[#131d2e] border border-[#24354c] rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-left my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 px-5 sm:px-7 py-4 sm:py-5 border-b border-[#1e293b] bg-[#0b1120]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#131d2e] border border-[#24354c] flex items-center justify-center text-2xl shrink-0">
              {typeInfo.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">{typeInfo.name}</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">Saved on {savedDateStr}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-['Outfit',sans-serif] text-white truncate max-w-xs sm:max-w-md">
                {building.name}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-[#131d2e] hover:bg-[#1f2d42] border border-[#24354c] text-slate-400 hover:text-white flex items-center justify-center cursor-pointer min-h-[44px] min-w-[44px]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-7 space-y-6 overflow-y-auto">
          
          {/* 1. Setup Summary */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-3">
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider flex items-center gap-2">
              <span>🏗️ Setup Summary</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#131d2e] border border-[#24354c]">
                <span className="text-slate-400 block">Location</span>
                <strong className="text-white font-bold block mt-0.5 truncate">
                  {building.location?.name || building.locationLabel || 'Current Location'}
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-[#131d2e] border border-[#24354c]">
                <span className="text-slate-400 block">Total Roof Area</span>
                <strong className="text-white font-bold block mt-0.5">
                  {formatArea(totalRoofArea)} ({roofs.length} {roofs.length === 1 ? 'roof' : 'roofs'})
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-[#131d2e] border border-[#24354c]">
                <span className="text-slate-400 block">Storage Tanks</span>
                <strong className="text-sky-300 font-bold block mt-0.5">
                  {noTankYet ? 'No tank yet' : `${formatVolume(totalTankL)} (${tanks.length})`}
                </strong>
              </div>
            </div>
          </div>


          {/* 2. Period Tabs & Water Breakdown */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
              <h3 className="text-base font-black text-white font-['Outfit',sans-serif] flex items-center gap-2">
                <span>💧 Water Collection Analysis</span>
              </h3>

              {/* Period Switcher Tabs */}
              <div className="inline-flex p-1 rounded-2xl bg-[#131d2e] border border-[#24354c] text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('week')}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer min-h-[40px] ${
                    activeTab === 'week' ? 'bg-teal-400 text-slate-950 font-black shadow' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('month')}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer min-h-[40px] ${
                    activeTab === 'month' ? 'bg-teal-400 text-slate-950 font-black shadow' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Month
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('year')}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer min-h-[40px] ${
                    activeTab === 'year' ? 'bg-teal-400 text-slate-950 font-black shadow' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Year
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#131d2e] border border-[#24354c]">
                <span className="text-xs text-slate-400 block font-medium">🌧️ Rain on roof</span>
                <strong className="text-xl font-black text-white font-['Outfit',sans-serif] block mt-1">
                  {activePeriodSummary.rainOnRoofBuckets.toLocaleString()} buckets
                </strong>
                <span className="text-xs text-slate-400 font-mono">
                  ({formatVolume(activePeriodSummary.rainOnRoof)})
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#131d2e] border border-teal-500/40">
                <span className="text-xs text-teal-400 block font-bold">🟢 Saved</span>
                <strong className="text-xl font-black text-teal-300 font-['Outfit',sans-serif] block mt-1">
                  {activePeriodSummary.keptBuckets.toLocaleString()} buckets
                </strong>
                <span className="text-xs text-teal-400/80 font-mono">
                  ({formatVolume(activePeriodSummary.kept)})
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#131d2e] border border-orange-500/40">
                <span className="text-xs text-orange-400 block font-bold">🟠 Wasted</span>
                <strong className="text-xl font-black text-orange-400 font-['Outfit',sans-serif] block mt-1">
                  {activePeriodSummary.wastedBuckets.toLocaleString()} buckets
                </strong>
                <span className="text-xs text-orange-400/80 font-mono">
                  ({formatVolume(activePeriodSummary.wasted)})
                </span>
              </div>
            </div>

            {/* Progress Bar & Sentence */}
            <div className="space-y-2 pt-2">
              <div className="w-full h-3 rounded-full bg-[#1e293b] overflow-hidden flex">
                <div style={{ width: `${activePeriodSummary.keptPercent}%` }} className="bg-teal-400 h-full" />
                <div style={{ width: `${activePeriodSummary.wastedPercent}%` }} className="bg-orange-500 h-full" />
              </div>

              <p className="text-sm font-bold text-slate-200 text-center font-['Outfit',sans-serif]">
                {getFriendlySentence(activeTab, activePeriodSummary)}
              </p>
            </div>
          </div>


          {/* 3. Table: All Periods at a Glance */}
          <div className="p-5 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-3">
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider">
              📊 All Periods at a Glance
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1e293b] text-slate-400">
                    <th className="pb-2 font-semibold">Period</th>
                    <th className="pb-2 font-semibold">Rain on Roof</th>
                    <th className="pb-2 font-semibold text-teal-400">Saved</th>
                    <th className="pb-2 font-semibold text-orange-400">Wasted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] text-slate-300 font-mono">
                  <tr>
                    <td className="py-2.5 font-bold font-sans text-white">This week</td>
                    <td className="py-2.5">{summary.week.rainOnRoofBuckets} bkt ({formatVolume(summary.week.rainOnRoof)})</td>
                    <td className="py-2.5 text-teal-300 font-bold">{summary.week.keptBuckets} bkt</td>
                    <td className="py-2.5 text-orange-400 font-bold">{summary.week.wastedBuckets} bkt</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold font-sans text-white">This month</td>
                    <td className="py-2.5">{summary.month.rainOnRoofBuckets} bkt ({formatVolume(summary.month.rainOnRoof)})</td>
                    <td className="py-2.5 text-teal-300 font-bold">{summary.month.keptBuckets} bkt</td>
                    <td className="py-2.5 text-orange-400 font-bold">{summary.month.wastedBuckets} bkt</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 font-bold font-sans text-white">Typical year</td>
                    <td className="py-2.5">{summary.year.rainOnRoofBuckets} bkt ({formatVolume(summary.year.rainOnRoof)})</td>
                    <td className="py-2.5 text-teal-300 font-bold">{summary.year.keptBuckets} bkt</td>
                    <td className="py-2.5 text-orange-400 font-bold">{summary.year.wastedBuckets} bkt</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>


          {/* 4. Mini 12-Month Chart */}
          <div className="p-5 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-4">
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider">
              📅 Monthly Rain &amp; Collection
            </h3>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 items-end h-28 pt-4 pb-1">
              {monthlyBreakdown.map((m, idx) => {
                const isSelected = selectedChartMonthIdx === idx;
                const maxB = Math.max(1, ...monthlyBreakdown.map(x => x.rainOnRoofBuckets));
                const hPct = Math.min(100, Math.max(12, Math.round((m.rainOnRoofBuckets / maxB) * 100)));

                return (
                  <button
                    key={m.monthName}
                    type="button"
                    onClick={() => setSelectedChartMonthIdx(idx)}
                    className={`flex flex-col items-center gap-1 cursor-pointer transition ${
                      isSelected ? 'scale-105 opacity-100' : 'opacity-75 hover:opacity-100'
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold text-slate-300">{m.rainOnRoofBuckets}</span>
                    <div className={`w-full rounded-lg bg-[#131d2e] h-20 flex items-end p-0.5 ${isSelected ? 'ring-2 ring-teal-400' : ''}`}>
                      <div style={{ height: `${hPct}%` }} className="w-full bg-teal-400 rounded-md" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-300">{m.monthName}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-300 text-center font-medium">
              Selected Month ({MONTH_NAMES[selectedChartMonthIdx]}): Rain on roof = <strong className="text-white">{monthlyBreakdown[selectedChartMonthIdx]?.rainOnRoofBuckets} buckets</strong> ({formatVolume(monthlyBreakdown[selectedChartMonthIdx]?.rainOnRoof)}), Saved = <strong className="text-teal-300">{monthlyBreakdown[selectedChartMonthIdx]?.keptBuckets} buckets</strong>.
            </p>
          </div>


          {/* 5. Per-Roof Breakdown */}
          <div className="p-5 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-3">
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider">
              🏠 Per-Roof Breakdown ({activePeriodSummary.periodLabel})
            </h3>

            <div className="space-y-2">
              {roofs.map((roof, rIdx) => {
                const roofArea = parseFloat(roof.area) || 0;
                const roofAreaM2 = roof.areaUnit === 'imperial' ? roofArea * 0.092903 : roofArea;
                const share = totalRoofArea > 0 ? roofAreaM2 / totalRoofArea : 0;
                const roofRain = Math.round(activePeriodSummary.rainOnRoof * share);
                const roofCaught = Math.round(activePeriodSummary.caught * share);

                return (
                  <div key={roof.id || rIdx} className="p-3 rounded-xl bg-[#131d2e] border border-[#24354c] flex items-center justify-between gap-3 text-xs">
                    <div>
                      <strong className="text-white font-bold block">{roof.name || `Roof ${rIdx + 1}`}</strong>
                      <span className="text-slate-400 text-[11px]">Area: {formatArea(roofArea)} ({roof.typeKey})</span>
                    </div>
                    <div className="text-right">
                      <strong className="text-teal-300 font-mono font-bold block">{toBuckets(roofCaught, summary.bucketSizeL)} buckets</strong>
                      <span className="text-slate-400 text-[10px] font-mono">({formatVolume(roofCaught)})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>


          {/* 6. Grown-up details & Formulas */}
          <div className="p-5 rounded-2xl bg-[#0b1120] border border-[#24354c] space-y-3">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              👨‍👩‍👧 Grown-Up Details &amp; Math ({activePeriodSummary.periodLabel})
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-[#131d2e]">
                <span className="text-slate-400 block text-[11px]">Total Rain on Roof:</span>
                <strong className="text-white font-mono text-sm">{activePeriodSummary.rainOnRoof.toLocaleString()} L</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#131d2e]">
                <span className="text-slate-400 block text-[11px]">Caught by Roof:</span>
                <strong className="text-sky-300 font-mono text-sm">{activePeriodSummary.caught.toLocaleString()} L</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#131d2e]">
                <span className="text-slate-400 block text-[11px]">Lost on the roof (soaks in):</span>
                <strong className="text-amber-300 font-mono text-sm">{activePeriodSummary.lostOnRoof.toLocaleString()} L</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#131d2e]">
                <span className="text-slate-400 block text-[11px]">Kept in Tank:</span>
                <strong className="text-teal-300 font-mono text-sm">{activePeriodSummary.kept.toLocaleString()} L</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#131d2e]">
                <span className="text-slate-400 block text-[11px]">Spilled (tank was full):</span>
                <strong className="text-orange-400 font-mono text-sm">{activePeriodSummary.spilled.toLocaleString()} L</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-[#131d2e]">
                <span className="text-slate-400 block text-[11px]">Wasted Total:</span>
                <strong className="text-rose-300 font-mono text-sm">{activePeriodSummary.wasted.toLocaleString()} L</strong>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic pt-2 border-t border-[#1e293b]">
              Formula: 1 mm rain on 1 m² roof area = 1 Litre. Bucket size = {summary.bucketSizeL} L. Data source: Open-Meteo API.
            </p>
          </div>


          {/* 7. Personalised Tips */}
          <div className="p-5 rounded-2xl bg-[#0b1120] border border-teal-500/40 space-y-3">
            <h3 className="text-sm font-bold text-teal-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Personalised Tips for this Building</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-teal-400 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 sm:px-7 py-4 border-t border-[#1e293b] bg-[#0b1120] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onOpenAndRecalculate(building);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-teal-400 hover:bg-teal-300 text-slate-950 font-black text-xs cursor-pointer min-h-[44px]"
            >
              <Eye className="w-4 h-4" />
              <span>Open &amp; Recalculate</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onEdit(building);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#131d2e] hover:bg-[#1f2d42] border border-[#24354c] text-slate-200 font-bold text-xs cursor-pointer min-h-[44px]"
            >
              <Edit2 className="w-4 h-4 text-teal-400" />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#131d2e] hover:bg-[#1f2d42] border border-[#24354c] text-slate-200 font-bold text-xs cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>Print / PDF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-[#131d2e] hover:bg-[#1f2d42] border border-[#24354c] text-slate-300 font-bold text-xs cursor-pointer min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
