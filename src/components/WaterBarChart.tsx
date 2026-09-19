import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { CalculationResult } from '../types';

interface WaterBarChartProps {
  result: CalculationResult;
}

export const WaterBarChart: React.FC<WaterBarChartProps> = ({ result }) => {
  const chartData = [
    {
      name: 'Potential Rain',
      shortName: 'Potential',
      volume: result.potentialWater,
      fill: '#0284c7', // Sky-600
      description: 'Theoretical water falling on roof',
      category: 'Meteorological',
    },
    {
      name: 'Harvestable Rain',
      shortName: 'Harvestable',
      volume: result.harvestableWater,
      fill: '#0d9488', // Teal-600
      description: 'Water captured after efficiency losses',
      category: 'Capture',
    },
    {
      name: 'Actually Harvested',
      shortName: 'Harvested',
      volume: result.actuallyHarvested,
      fill: '#16a34a', // Green-600 (green accent)
      description: 'Saved inside your storage tank',
      category: 'Saved',
    },
    {
      name: 'Wasted Overflow',
      shortName: 'Wasted',
      volume: result.wastedWater,
      fill: '#f59e0b', // Amber-500 / warm red-amber (visually prominent)
      description: 'Water lost to tank overflow',
      category: 'Lost',
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-xs sm:text-sm">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.fill }}
            />
            <span className="font-semibold">{data.name}</span>
          </div>
          <div className="text-lg font-bold font-['Outfit',sans-serif]">
            {data.volume.toLocaleString()} Litres
          </div>
          <div className="text-slate-400 text-xs mt-1">{data.description}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 text-base sm:text-lg">
            Rainwater Volume Comparison
          </h3>
          <p className="text-xs text-slate-500">
            Comparing Potential vs Harvestable vs Actually Harvested vs Wasted (Litres)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#0284c7]" />
            <span className="text-slate-600">Potential</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#0d9488]" />
            <span className="text-slate-600">Harvestable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#16a34a]" />
            <span className="text-slate-700 font-medium">Harvested</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-[#f59e0b]" />
            <span className="text-amber-800 font-medium">Wasted</span>
          </div>
        </div>
      </div>

      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 10, left: 10, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="shortName"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}kL` : `${v}L`)}
              width={55}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
            <Bar
              dataKey="volume"
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
