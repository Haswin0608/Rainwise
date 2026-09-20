import React, { useState } from 'react';
import { Droplets, Calculator, BarChart3, Home, User, LogOut, LogIn, ChevronDown } from 'lucide-react';
import { PageView, AuthUser } from '../types';

interface NavbarProps {
  currentPage: PageView;
  onNavigate: (page: PageView) => void;
  hasResults: boolean;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  savedBuildingsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  hasResults,
  currentUser,
  onOpenAuth,
  onSignOut,
  savedBuildingsCount = 0,
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/85 border-b border-slate-200/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <button
          id="nav-brand-btn"
          onClick={() => onNavigate('home')}
          className="group flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg p-1 transition shrink-0 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center shadow-sm shadow-teal-700/20 group-hover:scale-105 transition-transform duration-200">
            <Droplets className="w-5 h-5 text-teal-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Outfit',sans-serif] font-bold text-lg tracking-tight text-slate-900">
                Rain<span className="text-teal-700">Wise</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200/60 hidden xs:inline">
                Calculator
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden md:block">
              Save rain, stop wasting water
            </p>
          </div>
        </button>

        {/* Center & Right Navigation controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Navigation Pills */}
          <nav className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 text-xs sm:text-sm font-medium">
            <button
              id="nav-home-tab"
              onClick={() => onNavigate('home')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentPage === 'home'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              id="nav-calculator-tab"
              onClick={() => onNavigate('calculator')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentPage === 'calculator'
                  ? 'bg-white text-teal-800 shadow-2xs font-semibold'
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
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  currentPage === 'results'
                    ? 'bg-white text-teal-800 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Results</span>
              </button>
            )}
          </nav>

          {/* User Account / Guest Status Button */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                id="nav-user-profile-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-800 shadow-2xs transition-colors cursor-pointer min-h-[38px]"
              >
                <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[100px] truncate hidden sm:inline">
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
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 text-xs sm:text-sm">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">
                        {currentUser.displayName || 'Signed In'}
                      </p>
                      <p className="text-slate-500 text-xs truncate">
                        {currentUser.email}
                      </p>
                      {savedBuildingsCount > 0 && (
                        <p className="text-[11px] text-teal-700 font-semibold mt-1">
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
                      className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Home className="w-4 h-4 text-slate-400" />
                      <span>My Saved Buildings</span>
                    </button>

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      type="button"
                      id="nav-signout-btn"
                      onClick={() => {
                        setShowUserMenu(false);
                        onSignOut();
                      }}
                      className="w-full text-left px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-semibold"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-teal-900 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer min-h-[38px]"
            >
              <LogIn className="w-3.5 h-3.5 text-teal-700" />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

