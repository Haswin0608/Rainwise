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
  // Exactly the 3 bars requested: "Rain that fell" vs "Water saved" vs "Water wasted"
  const chartData = [
    {
      name: 'Rain that fell',
      volume: result.potentialWater,
      fill: '#0284c7', // Sky blue
      description: 'Total rain that landed on your roof',
    },
    {
      name: 'Water saved',
      volume: result.actuallyHarvested,
      fill: '#16a34a', // Emerald green
      description: 'Saved inside your water tank',
    },
    {
      name: 'Water wasted',
      volume: result.wastedWater,
      fill: '#dc2626', // Warm red / amber-red for emotional contrast
      description: 'Lost because your tank was full',
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg border border-slate-700 text-sm">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.fill }}
            />
            <span className="font-bold">{data.name}</span>
          </div>
          <div className="text-xl font-bold font-['Outfit',sans-serif]">
            {data.volume.toLocaleString()} litres
          </div>
          <div className="text-slate-300 text-xs mt-0.5">{data.description}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-['Outfit',sans-serif] font-bold text-slate-900 text-lg sm:text-xl">
            Rain Comparison
          </h3>
          <p className="text-sm text-slate-600">
            See how much rain fell compared to what you kept and what was lost
          </p>
        </div>

        {/* Simple Legend with plain language */}
        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#0284c7]" />
            <span className="text-slate-700">Rain that fell</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#16a34a]" />
            <span className="text-emerald-800 font-bold">Water saved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-[#dc2626]" />
            <span className="text-rose-800 font-bold">Water wasted</span>
          </div>
        </div>
      </div>

      <div className="w-full h-64 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 10, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#334155', fontSize: 13, fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: '#cbd5e1' }}
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k L` : `${v} L`)}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} />
            <Bar
              dataKey="volume"
              radius={[10, 10, 0, 0]}
              animationDuration={800}
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
