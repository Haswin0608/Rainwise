import React, { useState } from 'react';
import { 
  Droplets, 
  Plus, 
  Building2, 
  Home, 
  LogOut, 
  LogIn, 
  ChevronDown, 
  Sun, 
  Moon, 
  Lightbulb,
  HelpCircle
} from 'lucide-react';
import { PageView, AuthUser } from '../types';
import { useAppSettings } from '../context/AppSettingsContext';

interface NavbarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  onStartNewBuilding: () => void;
  onOpenMyBuildings: () => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenTips: () => void;
  onOpenTutorial?: () => void;
  savedBuildingsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onStartNewBuilding,
  onOpenMyBuildings,
  currentUser,
  onOpenAuth,
  onSignOut,
  onOpenTips,
  onOpenTutorial,
  savedBuildingsCount = 0,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, toggleTheme, unit, setUnit } = useAppSettings();

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-[#0b1120]/90 border-b border-[#1e293b] transition-colors">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <button
          id="nav-brand-btn"
          onClick={() => onNavigate('home')}
          className="group flex items-center gap-2 sm:gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-xl p-1 transition shrink-0 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-slate-950 flex items-center justify-center shadow-sm shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200 shrink-0">
            <Droplets className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Outfit',sans-serif] font-black text-lg sm:text-xl tracking-tight text-white">
                Rain<span className="text-teal-400">Wise</span>
              </span>
              <span className="text-[10px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 hidden xs:inline">
                Water Planner
              </span>
            </div>
          </div>
        </button>

        {/* Center Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 p-1 bg-[#131d2e] rounded-2xl border border-[#24354c] text-xs sm:text-sm font-medium">
          {/* Home */}
          <button
            id="nav-home-tab"
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentPage === 'home'
                ? 'bg-[#1e293b] text-white shadow-2xs font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#1e293b]/60'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          {/* ➕ Create New Building */}
          <button
            id="nav-create-building-tab"
            onClick={onStartNewBuilding}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentPage === 'stage1_setup' || currentPage === 'stage2_calculate' || currentPage === 'stage3_save' || currentPage === 'stage4_result'
                ? 'bg-teal-400 text-slate-950 font-black shadow-xs'
                : 'text-teal-300 hover:text-white hover:bg-[#1e293b]/60 font-semibold'
            }`}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span className="hidden sm:inline">New Building</span>
            <span className="sm:hidden">New</span>
          </button>

          {/* 🏗️ My Buildings */}
          <button
            id="nav-my-buildings-tab"
            onClick={onOpenMyBuildings}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
              currentPage === 'my_buildings'
                ? 'bg-[#1e293b] text-teal-300 shadow-2xs font-bold'
                : 'text-slate-300 hover:text-white hover:bg-[#1e293b]/60'
            }`}
          >
            <span>🏗️</span>
            <span className="hidden sm:inline">My Buildings</span>
            <span className="sm:hidden">Buildings</span>
            <span className="px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30">
              {savedBuildingsCount}
            </span>
          </button>

          {/* Tips Button */}
          <button
            type="button"
            id="nav-tips-btn"
            onClick={onOpenTips}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-amber-300 hover:bg-[#1e293b]/60 transition-all cursor-pointer"
            title="Practical Rainwater Tips"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Tips</span>
          </button>

          {/* Tutorial / Walkthrough */}
          {onOpenTutorial && (
            <button
              type="button"
              id="nav-tutorial-btn"
              onClick={onOpenTutorial}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-teal-300 hover:bg-[#1e293b]/60 transition-all cursor-pointer"
              title="How It Works Guide"
            >
              <HelpCircle className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>Guide</span>
            </button>
          )}
        </nav>

        {/* Right Settings & Controls (Unit Toggle, Dark Mode, User Profile) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Unit Toggle: Metric | Imperial */}
          <div className="flex items-center p-0.5 rounded-xl border border-[#24354c] bg-[#131d2e] text-xs font-semibold">
            <button
              type="button"
              id="nav-unit-metric"
              onClick={() => setUnit('metric')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                unit === 'metric'
                  ? 'bg-[#1e293b] text-teal-300 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Metric units (m², mm, litres)"
            >
              m²
            </button>
            <button
              type="button"
              id="nav-unit-imperial"
              onClick={() => setUnit('imperial')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                unit === 'imperial'
                  ? 'bg-[#1e293b] text-teal-300 shadow-2xs font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Imperial units (sq ft, in, gallons)"
            >
              sq ft
            </button>
          </div>

          {/* Dark Mode Sun/Moon Toggle */}
          <button
            type="button"
            id="nav-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#24354c] bg-[#131d2e] text-amber-300 hover:bg-[#1e293b] shadow-2xs transition-colors cursor-pointer shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* User Account / Sign In */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                id="nav-user-profile-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2 py-1.5 rounded-xl border border-[#24354c] bg-[#131d2e] hover:bg-[#1e293b] text-xs sm:text-sm font-semibold text-slate-200 shadow-2xs transition-colors cursor-pointer min-h-[38px]"
              >
                <div className="w-6 h-6 rounded-full bg-teal-950 text-teal-300 border border-teal-700/60 flex items-center justify-center font-bold text-xs">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[80px] truncate hidden md:inline text-slate-200">
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
                  <div className="absolute right-0 mt-2 w-56 bg-[#131d2e] rounded-2xl shadow-xl border border-[#24354c] py-2 z-50 text-xs sm:text-sm">
                    <div className="px-4 py-2 border-b border-[#1e293b]">
                      <p className="font-bold text-slate-100 truncate">
                        {currentUser.displayName || 'Signed In'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    <div className="px-2 py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenMyBuildings();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-300 hover:bg-[#1e293b] flex items-center justify-between cursor-pointer"
                      >
                        <span>Saved Buildings</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800 font-bold">
                          {savedBuildingsCount}
                        </span>
                      </button>
                    </div>

                    <div className="border-t border-[#1e293b] px-2 pt-1">
                      <button
                        type="button"
                        id="nav-logout-btn"
                        onClick={() => {
                          setShowUserMenu(false);
                          onSignOut();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              id="nav-signin-btn"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-500/50 bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 text-xs sm:text-sm font-bold shadow-2xs transition-colors cursor-pointer min-h-[38px]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
