import React, { useRef, useCallback, useEffect } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface StepperNumberInputProps {
  id: string;
  label?: string;
  unit?: string;
  helperText?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  step?: number | ((currentVal: number, direction: 1 | -1) => number);
  min?: number;
  max?: number;
  maxWarning?: string;
  placeholder?: string;
  error?: string;
  icon?: React.ReactNode;
  quickChips?: Array<{ label: string; value: string }>;
  headerAction?: React.ReactNode;
  footerNote?: React.ReactNode;
  inputMode?: 'decimal' | 'numeric';
  compact?: boolean;
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
  maxWarning,
  placeholder = '0',
  error,
  icon,
  quickChips,
  headerAction,
  footerNote,
  inputMode = 'decimal',
  compact = false,
}) => {
  const numVal = parseFloat(value) || 0;

  // Refs for repeat-on-hold
  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const valueRef = useRef<string>(value);
  valueRef.current = value;

  const computeStep = useCallback(
    (current: number, direction: 1 | -1): number => {
      if (typeof step === 'function') {
        return step(current, direction);
      }
      return step;
    },
    [step]
  );

  const handleStep = useCallback(
    (direction: 1 | -1) => {
      const current = parseFloat(valueRef.current) || 0;
      const stepSize = computeStep(current, direction);
      let next = current + direction * stepSize;

      if (min !== undefined && next < min) next = min;
      if (max !== undefined && next > max) next = max;

      // Format nicely without floating point precision issues
      const formatted = Number.isInteger(next) ? next.toString() : Number(next.toFixed(2)).toString();
      onChange(formatted);
    },
    [computeStep, min, max, onChange]
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startHold = useCallback(
    (direction: 1 | -1) => {
      stopTimer();
      handleStep(direction);
      // Wait 350ms before repeating rapidly
      timerRef.current = window.setTimeout(() => {
        intervalRef.current = window.setInterval(() => {
          const current = parseFloat(valueRef.current) || 0;
          if (direction === -1 && min !== undefined && current <= min) {
            stopTimer();
            return;
          }
          if (direction === 1 && max !== undefined && current >= max) {
            stopTimer();
            return;
          }
          handleStep(direction);
        }, 75);
      }, 350);
    },
    [handleStep, min, max, stopTimer]
  );

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const isAtMin = min !== undefined && numVal <= min;
  const isAtMax = max !== undefined && numVal >= max;

  return (
    <div className="space-y-1.5 w-full">
      {/* Label and Unit / Header Action */}
      {(label || unit || headerAction) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          {label && (
            <label 
              htmlFor={id} 
              className={`font-bold text-slate-100 flex items-center gap-2 cursor-pointer ${
                compact ? 'text-sm' : 'text-base'
              }`}
            >
              {icon && <span className="text-lg leading-none">{icon}</span>}
              <span>{label}</span>
            </label>
          )}
          <div className="flex items-center gap-2 ml-auto">
            {headerAction}
            {unit && (
              <span className="text-xs font-semibold text-slate-200 bg-[#1e293b] border border-[#2a3b55] px-2.5 py-0.5 rounded-full">
                {unit}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Stepper & Input Container: [ − ] [ input ] [ + ] */}
      <div className={`flex items-stretch rounded-2xl bg-[#0e1626] border border-[#24354c] shadow-inner focus-within:ring-2 focus-within:ring-teal-400 focus-within:border-teal-400 transition-all overflow-hidden ${
        compact ? 'min-h-[46px]' : 'min-h-[52px]'
      }`}>
        {/* Large Minus Button (min 44px tap target, hold to repeat) */}
        <button
          type="button"
          id={`btn-minus-${id}`}
          aria-label={`Decrease ${label || id}`}
          disabled={isAtMin}
          onMouseDown={() => startHold(-1)}
          onMouseUp={stopTimer}
          onMouseLeave={stopTimer}
          onTouchStart={() => startHold(-1)}
          onTouchEnd={stopTimer}
          onTouchCancel={stopTimer}
          className="w-12 sm:w-14 min-h-[44px] flex items-center justify-center bg-[#1e293b] hover:bg-[#28374d] active:bg-[#334460] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none border-r border-[#24354c] shrink-0 cursor-pointer text-2xl font-bold leading-none"
        >
          <span className="select-none leading-none font-bold block" aria-hidden="true">
            −
          </span>
        </button>

        {/* Big Number Input (allows direct typing) */}
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            // Keep direct input flexible (allow empty or partly typed values)
            const raw = e.target.value;
            // Clean non-numeric except decimal point
            if (raw === '' || /^[0-9]*\.?[0-9]*$/.test(raw)) {
              onChange(raw);
            }
          }}
          onBlur={() => {
            if (value.trim() === '') {
              onChange(min !== undefined ? String(min) : '0');
            } else {
              const parsed = parseFloat(value);
              if (isNaN(parsed)) {
                onChange(min !== undefined ? String(min) : '0');
              } else if (min !== undefined && parsed < min) {
                onChange(String(min));
              } else if (max !== undefined && parsed > max) {
                onChange(String(max));
              }
            }
            if (onBlur) onBlur();
          }}
          className={`w-full text-center font-['Outfit',sans-serif] font-bold text-white placeholder:text-slate-400 focus:outline-none bg-transparent px-2 py-2.5 ${
            compact ? 'text-lg sm:text-xl' : 'text-xl sm:text-2xl'
          }`}
        />

        {/* Large Plus Button (min 44px tap target, hold to repeat) */}
        <button
          type="button"
          id={`btn-plus-${id}`}
          aria-label={`Increase ${label || id}`}
          disabled={isAtMax}
          onMouseDown={() => startHold(1)}
          onMouseUp={stopTimer}
          onMouseLeave={stopTimer}
          onTouchStart={() => startHold(1)}
          onTouchEnd={stopTimer}
          onTouchCancel={stopTimer}
          className="w-12 sm:w-14 min-h-[44px] flex items-center justify-center bg-[#1e293b] hover:bg-[#28374d] active:bg-[#334460] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors select-none border-l border-[#24354c] shrink-0 cursor-pointer text-2xl font-bold leading-none"
        >
          <span className="select-none leading-none font-bold block" aria-hidden="true">
            +
          </span>
        </button>
      </div>

      {/* Warning when hitting max */}
      {isAtMax && maxWarning && (
        <p className="text-xs text-amber-300 flex items-center gap-1.5 mt-1 font-medium">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
          <span>{maxWarning}</span>
        </p>
      )}

      {/* Quick preset chips if available */}
      {quickChips && quickChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 mr-1">Common:</span>
          {quickChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => onChange(chip.value)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer ${
                value === chip.value
                  ? 'bg-teal-600 text-white border-teal-500 shadow-sm font-semibold'
                  : 'bg-[#1e293b] text-slate-200 border-[#24354c] hover:bg-[#28374d]'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Helper text or Friendly Error Message */}
      {error ? (
        <p className="text-sm text-rose-300 flex items-center gap-1.5 mt-1 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-300 mt-1 font-medium">
          {helperText}
        </p>
      ) : null}

      {/* Optional footer note */}
      {footerNote}
    </div>
  );
};
