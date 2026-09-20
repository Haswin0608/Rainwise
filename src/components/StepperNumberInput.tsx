import React from 'react';
import { AlertCircle } from 'lucide-react';

interface StepperNumberInputProps {
  id: string;
  label: string;
  unit: string;
  helperText: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  quickChips?: Array<{ label: string; value: string }>;
  headerAction?: React.ReactNode;
  footerNote?: React.ReactNode;
}

export const StepperNumberInput: React.FC<StepperNumberInputProps> = ({
  id,
  label,
  unit,
  helperText,
  value,
  onChange,
  onBlur,
  step = 1,
  min = 0,
  max,
  placeholder = '0',
  error,
  icon,
  quickChips,
  headerAction,
  footerNote,
}) => {
  const numVal = parseFloat(value) || 0;

  const handleStep = (delta: number) => {
    let next = numVal + delta;
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    // Format nicely without unnecessary trailing decimals
    const str = Number.isInteger(next) ? next.toString() : Number(next.toFixed(2)).toString();
    onChange(str);
  };

  return (
    <div className="space-y-1.5 w-full">
      {/* Label and Unit / Header Action */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label 
          htmlFor={id} 
          className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 cursor-pointer"
        >
          {icon && <span className="text-xl leading-none">{icon}</span>}
          <span>{label}</span>
        </label>
        <div className="flex items-center gap-2">
          {headerAction}
          <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
            {unit}
          </span>
        </div>
      </div>

      {/* Stepper & Input Container */}
      <div className="flex items-stretch rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-2xs focus-within:ring-3 focus-within:ring-teal-600/20 focus-within:border-teal-700 dark:focus-within:border-teal-400 transition-all overflow-hidden">
        {/* Large Minus Stepper Button with plain text symbol */}
        <button
          type="button"
          id={`btn-minus-${id}`}
          aria-label={`Decrease ${label}`}
          onClick={() => handleStep(-step)}
          disabled={min !== undefined && numVal <= min}
          className="w-14 sm:w-16 min-h-[54px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:active:bg-slate-500 text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none border-r border-slate-300 dark:border-slate-600 shrink-0 cursor-pointer text-2xl font-bold leading-none"
          style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}
        >
          <span className="select-none leading-none font-bold block" aria-hidden="true">
            −
          </span>
        </button>

        {/* Big Number Input */}
        <input
          id={id}
          type="number"
          step="any"
          min={min}
          max={max}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="w-full text-center font-['Outfit',sans-serif] text-xl sm:text-2xl font-bold text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none bg-transparent px-2 py-3.5"
        />

        {/* Large Plus Stepper Button with plain text symbol */}
        <button
          type="button"
          id={`btn-plus-${id}`}
          aria-label={`Increase ${label}`}
          onClick={() => handleStep(step)}
          disabled={max !== undefined && numVal >= max}
          className="w-14 sm:w-16 min-h-[54px] flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 dark:active:bg-slate-500 text-slate-900 dark:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none border-l border-slate-300 dark:border-slate-600 shrink-0 cursor-pointer text-2xl font-bold leading-none"
          style={{ fontSize: '24px', fontWeight: 700, lineHeight: 1 }}
        >
          <span className="select-none leading-none font-bold block" aria-hidden="true">
            +
          </span>
        </button>
      </div>

      {/* Quick preset chips if available */}
      {quickChips && quickChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">Common:</span>
          {quickChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onChange(chip.value)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                value === chip.value
                  ? 'bg-teal-850 dark:bg-teal-600 text-white border-teal-850 dark:border-teal-500 shadow-2xs font-semibold'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Helper text or Friendly Error Message */}
      {error ? (
        <p className="text-sm text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mt-1 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : (
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          {helperText}
        </p>
      )}

      {/* Optional footer note (e.g. weather auto-fill info) */}
      {footerNote}
    </div>
  );
};
