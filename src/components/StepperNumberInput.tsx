import React from 'react';
import { Plus, Minus, AlertCircle } from 'lucide-react';

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
}) => {
  const numVal = parseFloat(value) || 0;

  const handleStep = (delta: number) => {
    let next = numVal + delta;
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    // Format nicely without unnecessary trailing decimals
    const str = Number.isInteger(next) ? next.toString() : next.toFixed(1);
    onChange(str);
  };

  return (
    <div className="space-y-1.5 w-full">
      {/* Label and Unit */}
      <div className="flex items-center justify-between">
        <label 
          htmlFor={id} 
          className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 cursor-pointer"
        >
          {icon && <span className="text-xl leading-none">{icon}</span>}
          <span>{label}</span>
        </label>
        <span className="text-xs sm:text-sm font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
          {unit}
        </span>
      </div>

      {/* Stepper & Input Container */}
      <div className="flex items-stretch rounded-2xl bg-white border border-slate-300 shadow-2xs focus-within:ring-3 focus-within:ring-teal-600/20 focus-within:border-teal-700 transition-all overflow-hidden">
        {/* Large Minus Stepper Button */}
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => handleStep(-step)}
          disabled={min !== undefined && numVal <= min}
          className="w-14 sm:w-16 min-h-[54px] flex items-center justify-center bg-slate-100 hover:bg-teal-50 active:bg-teal-100 text-slate-700 hover:text-teal-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors select-none text-2xl font-bold border-r border-slate-200 shrink-0"
        >
          <Minus className="w-6 h-6 stroke-[2.5]" />
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
          className="w-full text-center font-['Outfit',sans-serif] text-xl sm:text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none bg-transparent px-2 py-3.5"
        />

        {/* Large Plus Stepper Button */}
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => handleStep(step)}
          disabled={max !== undefined && numVal >= max}
          className="w-14 sm:w-16 min-h-[54px] flex items-center justify-center bg-slate-100 hover:bg-teal-50 active:bg-teal-100 text-slate-700 hover:text-teal-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors select-none text-2xl font-bold border-l border-slate-200 shrink-0"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Quick preset chips if available */}
      {quickChips && quickChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-500 mr-1">Common:</span>
          {quickChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onChange(chip.value)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                value === chip.value
                  ? 'bg-teal-800 text-white border-teal-800 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Helper text or Friendly Error Message */}
      {error ? (
        <p className="text-sm text-rose-600 flex items-center gap-1.5 mt-1 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : (
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
};
