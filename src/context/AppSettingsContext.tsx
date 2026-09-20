import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UnitSystem,
  UnitLabels,
  METRIC_LABELS,
  IMPERIAL_LABELS,
  formatVolume as fmtVolume,
  formatVolumeFull as fmtVolumeFull,
  formatRainfall as fmtRainfall,
  formatArea as fmtArea,
  formatLength as fmtLength,
  formatTemp as fmtTemp,
} from '../utils/units';
import { AuthUser } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type AppTheme = 'light' | 'dark';

interface AppSettingsContextType {
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
  unit: UnitSystem;
  setUnit: (unit: UnitSystem) => void;
  labels: UnitLabels;
  formatVolume: (liters: number) => string;
  formatVolumeFull: (liters: number) => string;
  formatRainfall: (mm: number) => string;
  formatArea: (sqMeters: number) => string;
  formatLength: (meters: number) => string;
  formatTemp: (celsius: number) => string;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'rainwise_theme';
const UNIT_STORAGE_KEY = 'rainwise_unit';

export const AppSettingsProvider: React.FC<{
  children: React.ReactNode;
  currentUser?: AuthUser | null;
}> = ({ children, currentUser }) => {
  // 1. Theme State (Respect prefers-color-scheme on first visit)
  const [theme, setThemeState] = useState<AppTheme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return 'light';
  });

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  // 2. Unit State (Default: metric)
  const [unit, setUnitState] = useState<UnitSystem>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(UNIT_STORAGE_KEY) as UnitSystem | null;
      if (saved === 'metric' || saved === 'imperial') {
        return saved;
      }
    }
    return 'metric';
  });

  // Apply unit to localStorage & optional user profile
  const setUnit = useCallback(
    (newUnit: UnitSystem) => {
      setUnitState(newUnit);
      localStorage.setItem(UNIT_STORAGE_KEY, newUnit);

      // Best effort profile sync if logged in
      if (currentUser?.uid) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          updateDoc(userRef, { unit: newUnit, updatedAt: new Date().toISOString() }).catch(() => {});
        } catch {
          // ignore
        }
      }
    },
    [currentUser]
  );

  const setTheme = useCallback(
    (newTheme: AppTheme) => {
      setThemeState(newTheme);
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);

      if (currentUser?.uid) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          updateDoc(userRef, { theme: newTheme, updatedAt: new Date().toISOString() }).catch(() => {});
        } catch {
          // ignore
        }
      }
    },
    [currentUser]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  const labels = unit === 'imperial' ? IMPERIAL_LABELS : METRIC_LABELS;

  const value: AppSettingsContextType = {
    theme,
    toggleTheme,
    setTheme,
    unit,
    setUnit,
    labels,
    formatVolume: (liters: number) => fmtVolume(liters, unit),
    formatVolumeFull: (liters: number) => fmtVolumeFull(liters, unit),
    formatRainfall: (mm: number) => fmtRainfall(mm, unit),
    formatArea: (sqMeters: number) => fmtArea(sqMeters, unit),
    formatLength: (meters: number) => fmtLength(meters, unit),
    formatTemp: (celsius: number) => fmtTemp(celsius, unit),
  };

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
};

export function useAppSettings(): AppSettingsContextType {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
}
