import React from 'react';
import { useAppSettings } from '../context/AppSettingsContext';
import { CalculationPeriod } from '../types';
import { MONTH_NAMES } from '../utils/calculations';

interface PeriodSelectorProps {
  className?: string;
  showDescriptions?: boolean;
  variant?: 'pills' | 'tabs';
}

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  className = '',
  showDescriptions = false,
  variant = 'pills',
}) => {
  const { period, setPeriod } = useAppSettings();

  const currentMonthName = MONTH_NAMES[new Date().getMonth()];

  const options: Array<{
    id: CalculationPeriod;
    label: string;
    sublabel: string;
    icon: string;
  }> = [
    {
      id: 'week',
      label: 'This week',
      sublabel: '7-day forecast rain',
      icon: '📅',
    },
    {
      id: 'month',
      label: 'This month',
      sublabel: `Typical for ${currentMonthName}`,
      icon: '🗓️',
    },
    {
      id: 'year',
      label: 'Typical year',
      sublabel: '3-year average',
      icon: '📆',
    },
  ];

  return (
    <div className={`space-y-1 ${className}`}>
      <div 
        role="group" 
        aria-label="Water calculation period selector"
        className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-2xs w-full sm:w-auto"
      >
        {options.map((opt) => {
          const isSelected = period === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              id={`period-btn-${opt.id}`}
              onClick={() => setPeriod(opt.id)}
              aria-pressed={isSelected}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer min-h-[44px] ${
                isSelected
                  ? 'bg-teal-850 dark:bg-teal-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span className="text-base leading-none" role="img" aria-hidden="true">
                {opt.icon}
              </span>
              <span>{opt.label}</span>
              {opt.id === 'month' && (
                <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded hidden sm:inline ${
                  isSelected ? 'bg-teal-900/60 text-teal-200' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {currentMonthName}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {showDescriptions && (
        <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-1">
          {period === 'week' && 'Showing immediate harvest from upcoming 7-day live weather.'}
          {period === 'month' && `Showing typical seasonal harvest for ${currentMonthName} based on 3-year historical patterns.`}
          {period === 'year' && 'Showing total annual harvest and long-term storage viability across all 12 months.'}
        </div>
      )}
    </div>
  );
};
