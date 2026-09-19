import React from 'react';
import { Droplets, Calculator, BarChart3, Home } from 'lucide-react';
import { PageView } from '../types';

interface NavbarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  hasResults: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  hasResults,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/80 border-b border-slate-200/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          id="nav-brand-btn"
          onClick={() => onNavigate('home')}
          className="group flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg p-1 transition"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center shadow-sm shadow-teal-700/20 group-hover:scale-105 transition-transform duration-200">
            <Droplets className="w-5 h-5 text-teal-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Outfit',sans-serif] font-bold text-lg tracking-tight text-slate-900">
                Rain<span className="text-teal-700">Wise</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/60">
                Calculator
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Harvesting Potential & Overflow Loss
            </p>
          </div>
        </button>

        {/* View Navigation Pills */}
        <nav className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 text-xs sm:text-sm font-medium">
          <button
            id="nav-home-tab"
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentPage === 'home'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            id="nav-calculator-tab"
            onClick={() => onNavigate('calculator')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentPage === 'calculator'
                ? 'bg-white text-teal-800 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculator</span>
          </button>

          {hasResults && (
            <button
              id="nav-results-tab"
              onClick={() => onNavigate('results')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                currentPage === 'results'
                  ? 'bg-white text-teal-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Results</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
