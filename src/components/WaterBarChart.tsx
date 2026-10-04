import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';
import { CalculationResult } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';
import { litersToGallons, mmToInches } from '../utils/units';
import { BarChart3, CalendarDays, CloudRain, AlertTriangle, Sparkles } from 'lucide-react';

interface WaterBarChartProps {
  result: CalculationResult;
  onGoToCalculator?: () => void;
}

type ChartView = 'today' | 'week';

export const WaterBarChart: React.FC<WaterBarChartProps> = ({ result, onGoToCalculator }) => {
  const [activeView, setActiveView] = useState<ChartView>('today');
  const [weekChartType, setWeekChartType] = useState<'bar' | 'line'>('bar');
  const { unit, theme, formatVolume, formatRainfall, formatTemp } = useAppSettings();

  const gridStroke = '#1e293b';
  const axisStroke = '#475569';
  const tickFill = '#94a3b8';

  // ═══════════════════════════════════════
  // 1. "Today's Breakdown" Data
  // ═══════════════════════════════════════
  const rawData = [
    {
      id: 'fell',
      name: 'Rain that fell',
      liters: result.potentialWater,
      fill: '#38bdf8', // Sky blue
      description: 'Total rain that landed on your roof',
      icon: '🌧️',
    },
    {
      id: 'saved',
      name: 'Water saved',
      liters: result.actuallyHarvested,
      fill: '#34d399', // Emerald green
      description: 'Stored safely inside your tank',
      icon: '✅',
    },
    {
      id: 'wasted',
      name: 'Water wasted',
      liters: result.wastedWater,
      fill: '#fb7185', // Soft warm red/amber
      description: 'Lost to overflow because tank was full',
      icon: '🚫',
    },
  ];

  const todayChartData = rawData.map((d) => ({
    ...d,
    displayValue: unit === 'imperial' ? Math.round(litersToGallons(d.liters)) : Math.round(d.liters),
    formattedValue: formatVolume(d.liters),
  }));

  // ═══════════════════════════════════════
  // 2. "This Week" (7-Day Forecast Data)
  // ═══════════════════════════════════════
  const forecastDays = result.weatherInfo?.fullWeather?.dailyForecast || [];
  const hasForecast = forecastDays.length > 0;

  const weeklyChartData = forecastDays.map((d) => {
    const rainDisplay =
      unit === 'imperial'
        ? Number(mmToInches(d.precipitationMm).toFixed(2))
        : Number(d.precipitationMm.toFixed(1));

    const isHeavy = d.precipitationMm >= 15;

    return {
      day: d.dayLabel,
      fullDay: d.fullDayName,
      date: d.date,
      rainfallMm: d.precipitationMm,
      rainfallDisplay: rainDisplay,
      condition: d.conditionLabel,
      icon: d.conditionIcon,
      tempMax: d.tempMax,
      tempMin: d.tempMin,
      isHeavy,
      formattedRain: formatRainfall(d.precipitationMm),
      fill: isHeavy ? '#38bdf8' : '#2dd4bf',
    };
  });

  // Custom Tooltip for Today's Breakdown
  const TodayTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0b1120] text-white p-3.5 rounded-2xl shadow-xl border border-[#24354c] text-xs sm:text-sm backdrop-blur-md min-w-[200px] z-50">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-base">{data.icon}</span>
            <span className="font-bold text-slate-100">{data.name}</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-['Outfit',sans-serif] tracking-tight text-white">
            {data.formattedValue}
          </div>
          <p className="text-slate-300 text-xs mt-1 leading-snug">{data.description}</p>
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for This Week's Forecast
  const WeekTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0b1120] text-white p-3.5 rounded-2xl shadow-xl border border-[#24354c] text-xs sm:text-sm backdrop-blur-md min-w-[220px] z-50">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-slate-100 flex items-center gap-1.5">
              <span>{data.icon}</span>
              <span>{data.fullDay}</span>
            </span>
            <span className="text-[11px] text-slate-400">{data.condition}</span>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold font-['Outfit',sans-serif] text-teal-300">
            {data.formattedRain}
          </div>
          <div className="text-xs text-slate-300 mt-1 flex items-center justify-between gap-2 border-t border-[#1e293b] pt-1.5">
            <span>Expected temp:</span>
            <span className="font-medium text-slate-200">
              {formatTemp(data.tempMin)} – {formatTemp(data.tempMax)}
            </span>
          </div>
          {data.isHeavy && (
            <div className="mt-2 text-[11px] text-amber-300 bg-amber-950/60 border border-amber-800/80 px-2 py-1 rounded-lg flex items-center gap-1">
              <span>🌧️</span>
              <span>Heavy rain day — prep tank space!</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-[#131d2e] rounded-3xl border border-[#24354c] p-5 sm:p-7 shadow-xs transition-colors">
      
      {/* Top Header & Interactive View Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-['Outfit',sans-serif] font-bold text-white text-lg sm:text-xl">
              Rain & Water Visualizer
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
              Interactive
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {activeView === 'today'
              ? 'Tap or hover any bar to see exact amounts in your chosen unit'
              : 'Expected rainfall for the next 7 days from local weather data'}
          </p>
        </div>

        {/* Small Tabs/Buttons above chart to toggle views */}
        <div className="flex items-center gap-1 p-1 bg-[#0e1626] rounded-2xl border border-[#24354c] self-start sm:self-auto shrink-0">
          <button
            type="button"
            id="chart-tab-today"
            onClick={() => setActiveView('today')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeView === 'today'
                ? 'bg-[#1e293b] text-teal-300 shadow-2xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Today&apos;s Breakdown</span>
          </button>

          <button
            type="button"
            id="chart-tab-week"
            onClick={() => setActiveView('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeView === 'week'
                ? 'bg-[#1e293b] text-teal-300 shadow-2xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>This Week</span>
            {hasForecast && (
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse hidden xs:inline" />
            )}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          VIEW 1: TODAY'S BREAKDOWN
          ═══════════════════════════════════════ */}
      {activeView === 'today' && (
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm border-b border-[#1e293b] pb-3">
            <span className="text-slate-400 font-medium">
              Hover or tap any bar for details:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#38bdf8]" />
                <span className="text-slate-300">Rain that fell</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#34d399]" />
                <span className="text-emerald-300 font-bold">
                  Water saved
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#fb7185]" />
                <span className="text-rose-300 font-bold">Water wasted</span>
              </div>
            </div>
          </div>

          {/* Chart Canvas with horizontal scrolling container for mobile safety */}
          <div className="w-full overflow-x-auto pb-1 scrollbar-none">
            <div className="w-full min-w-[360px] sm:min-w-0 h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={todayChartData}
                  margin={{ top: 20, right: 15, left: 10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={{ stroke: axisStroke }}
                    tick={{ fill: tickFill, fontSize: 13, fontWeight: 600 }}
                    dy={12}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: axisStroke }}
                    tick={{ fill: tickFill, fontSize: 12 }}
                    tickFormatter={(v) => {
                      if (unit === 'imperial') {
                        return v >= 1000 ? `${(v / 1000).toFixed(1)}k gal` : `${v} gal`;
                      }
                      return v >= 1000 ? `${(v / 1000).toFixed(0)}k L` : `${v} L`;
                    }}
                    width={unit === 'imperial' ? 70 : 60}
                  />
                  <Tooltip
                    content={<TodayTooltip />}
                    cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }}
                  />
                  <Bar
                    dataKey="displayValue"
                    radius={[12, 12, 0, 0]}
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    {todayChartData.map((entry, index) => (
                      <Cell key={`cell-today-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════
          VIEW 2: THIS WEEK (7-DAY OUTLOOK)
          ═══════════════════════════════════════ */}
      {activeView === 'week' && (
        <div className="space-y-4">
          {hasForecast ? (
            <>
              {/* Header inside Week View */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e293b] pb-3 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-200 font-semibold">
                    📍 7-Day Rainfall Forecast for {result.weatherInfo?.locationName}
                  </span>
                </div>

                {/* Sub-toggle: Bar vs Line */}
                <div className="flex items-center gap-1 bg-[#0e1626] border border-[#24354c] p-1 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setWeekChartType('bar')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      weekChartType === 'bar'
                        ? 'bg-[#1e293b] text-teal-300 shadow-2xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Bars
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekChartType('line')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      weekChartType === 'line'
                        ? 'bg-[#1e293b] text-teal-300 shadow-2xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Trend Line
                  </button>
                </div>
              </div>

              {/* Chart Canvas with horizontal scroll guarantee on mobile */}
              <div className="w-full overflow-x-auto pb-1 scrollbar-none">
                <div className="w-full min-w-[480px] sm:min-w-0 h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    {weekChartType === 'bar' ? (
                      <BarChart
                        data={weeklyChartData}
                        margin={{ top: 20, right: 15, left: 10, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                        <XAxis
                          dataKey="day"
                          tickLine={false}
                          axisLine={{ stroke: axisStroke }}
                          tick={{ fill: tickFill, fontSize: 12, fontWeight: 600 }}
                          dy={12}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={{ stroke: axisStroke }}
                          tick={{ fill: tickFill, fontSize: 12 }}
                          tickFormatter={(v) => `${v} ${unit === 'imperial' ? 'in' : 'mm'}`}
                          width={60}
                        />
                        <Tooltip
                          content={<WeekTooltip />}
                          cursor={{
                            fill: 'rgba(51, 65, 85, 0.4)',
                          }}
                        />
                        <Bar
                          dataKey="rainfallDisplay"
                          radius={[10, 10, 0, 0]}
                          animationDuration={900}
                          animationEasing="ease-out"
                        >
                          {weeklyChartData.map((entry, index) => (
                            <Cell key={`cell-week-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <LineChart
                        data={weeklyChartData}
                        margin={{ top: 20, right: 15, left: 10, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                        <XAxis
                          dataKey="day"
                          tickLine={false}
                          axisLine={{ stroke: axisStroke }}
                          tick={{ fill: tickFill, fontSize: 12, fontWeight: 600 }}
                          dy={12}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={{ stroke: axisStroke }}
                          tick={{ fill: tickFill, fontSize: 12 }}
                          tickFormatter={(v) => `${v} ${unit === 'imperial' ? 'in' : 'mm'}`}
                          width={60}
                        />
                        <Tooltip content={<WeekTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="rainfallDisplay"
                          stroke="#2dd4bf"
                          strokeWidth={3}
                          dot={{ r: 5, fill: '#2dd4bf' }}
                          activeDot={{ r: 7 }}
                          animationDuration={900}
                          animationEasing="ease-out"
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Informative Forecast Footer Strip */}
              <div className="p-3.5 rounded-2xl bg-[#0e1626] border border-teal-500/20 text-slate-200 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>
                    Total rain expected over the next 7 days:{' '}
                    <strong className="text-white">
                      {formatRainfall(
                        forecastDays.reduce((acc, curr) => acc + curr.precipitationMm, 0)
                      )}
                    </strong>
                  </span>
                </div>
                {weeklyChartData.some((d) => d.isHeavy) && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-800">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Heavy rain days highlighted
                  </span>
                )}
              </div>
            </>
          ) : (
            /* Fallback when weather was not fetched */
            <div className="py-10 px-4 text-center rounded-2xl bg-[#0e1626] border border-[#24354c] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto text-2xl">
                📍
              </div>
              <h4 className="font-['Outfit',sans-serif] font-bold text-white text-base sm:text-lg">
                Connect Your Location for the 7-Day Outlook
              </h4>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                Track your local area or search your town on the Calculator page to automatically see
                this week&apos;s expected daily rainfall and plan your tank space.
              </p>
              {onGoToCalculator && (
                <button
                  type="button"
                  id="chart-go-to-calculator-btn"
                  onClick={onGoToCalculator}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-400 hover:bg-teal-300 text-slate-950 text-xs sm:text-sm font-bold shadow-2xs cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Set Location on Calculator</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
