import React, { useState } from 'react';
import { 
  Droplets, 
  Calculator, 
  BarChart3, 
  Home, 
  LogOut, 
  LogIn, 
  ChevronDown, 
  Sun, 
  Moon, 
  Lightbulb 
} from 'lucide-react';
import { PageView, AuthUser } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';

interface NavbarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  hasResults: boolean;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenTips: () => void;
  savedBuildingsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  hasResults,
  currentUser,
  onOpenAuth,
  onSignOut,
  onOpenTips,
  savedBuildingsCount = 0,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, toggleTheme, unit, setUnit } = useAppSettings();

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/90 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <button
          id="nav-brand-btn"
          onClick={() => onNavigate('home')}
          className="group flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg p-1 transition shrink-0 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center shadow-sm shadow-teal-700/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
            <Droplets className="w-5 h-5 text-teal-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Outfit',sans-serif] font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                Rain<span className="text-teal-600 dark:text-teal-400">Wise</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800 hidden xs:inline">
                Calculator
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
              Save rain, stop wasting water
            </p>
          </div>
        </button>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs sm:text-sm font-medium">
          <button
            id="nav-home-tab"
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              currentPage === 'home'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <button
            id="nav-calculator-tab"
            onClick={() => onNavigate('calculator')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              currentPage === 'calculator'
                ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculator</span>
          </button>

          {hasResults && (
            <button
              id="nav-results-tab"
              onClick={() => onNavigate('results')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentPage === 'results'
                  ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Results</span>
            </button>
          )}

          {/* Quick Tips modal button */}
          <button
            type="button"
            id="nav-tips-btn"
            onClick={onOpenTips}
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-white/50 dark:hover:bg-slate-700/50 transition-all cursor-pointer"
            title="Practical Rainwater Tips"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="hidden md:inline">Tips</span>
          </button>
        </nav>

        {/* Right Settings & Controls (Unit Toggle, Dark Mode, User Profile) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Unit Toggle: Metric | Imperial */}
          <div className="flex items-center p-0.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              id="nav-unit-metric"
              onClick={() => setUnit('metric')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                unit === 'metric'
                  ? 'bg-white dark:bg-slate-700 text-teal-900 dark:text-teal-200 shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Metric units (m, mm, litres)"
            >
              Metric
            </button>
            <button
              type="button"
              id="nav-unit-imperial"
              onClick={() => setUnit('imperial')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                unit === 'imperial'
                  ? 'bg-white dark:bg-slate-700 text-teal-900 dark:text-teal-200 shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Imperial units (ft, in, gallons)"
            >
              Imperial
            </button>
          </div>

          {/* Dark Mode Sun/Moon Toggle */}
          <button
            type="button"
            id="nav-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-amber-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* User Account / Sign In */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                id="nav-user-profile-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer min-h-[38px]"
              >
                <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 flex items-center justify-center font-bold text-xs">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[80px] truncate hidden md:inline">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 text-xs sm:text-sm">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {currentUser.displayName || 'Signed In'}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs truncate">
                        {currentUser.email}
                      </p>
                      {savedBuildingsCount > 0 && (
                        <p className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold mt-1">
                          🏠 {savedBuildingsCount} saved building{savedBuildingsCount > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('home');
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Home className="w-4 h-4 text-slate-400" />
                      <span>My Saved Buildings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserMenu(false);
                        onOpenTips();
                      }}
                      className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                    >
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>Rainwater Tips</span>
                    </button>

                    <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>

                    <button
                      type="button"
                      id="nav-signout-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-4 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              id="nav-signin-btn"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-teal-600 text-teal-900 dark:text-teal-200 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer min-h-[38px] shrink-0"
            >
              <LogIn className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
