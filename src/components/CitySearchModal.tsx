import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, X, Loader2, AlertCircle } from 'lucide-react';
import { searchCities, CitySearchResult } from '../utils/weather';

interface CitySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCity: (city: CitySearchResult) => void;
  onEnterManually: () => void;
}

export const CitySearchModal: React.FC<CitySearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCity,
  onEnterManually,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const cities = await searchCities(query.trim());
      setResults(cities);
    } catch {
      setSearchError('Could not connect to the city directory. Please check your spelling or enter manually.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickPick = (cityName: string) => {
    setQuery(cityName);
    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    searchCities(cityName)
      .then((cities) => {
        if (cities.length > 0) {
          onSelectCity(cities[0]);
        } else {
          setResults([]);
        }
      })
      .catch(() => {
        setSearchError('Search failed, please enter rainfall manually.');
      })
      .finally(() => setIsSearching(false));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="city-search-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 space-y-5 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-xl shrink-0">
                📍
              </div>
              <div>
                <h3 id="city-search-title" className="text-xl font-bold font-['Outfit',sans-serif] text-slate-900">
                  Find Your City or Town
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Type your location to fetch today&apos;s real rainfall from Open-Meteo
                </p>
              </div>
            </div>

            <button
              type="button"
              id="city-modal-close-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="relative flex items-center">
              <input
                id="city-search-input"
                type="text"
                autoFocus
                placeholder="e.g. Salem, Pune, Bengaluru, Nairobi, London..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-11 pr-24 py-3.5 rounded-2xl border border-slate-300 focus:border-teal-700 focus:ring-3 focus:ring-teal-700/20 text-slate-900 font-medium placeholder:text-slate-400 text-base outline-none transition-all"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />

              <button
                type="submit"
                id="city-search-submit-btn"
                disabled={isSearching || !query.trim()}
                className="absolute right-2 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white text-sm font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
              </button>
            </div>
          </form>

          {/* Quick suggestions */}
          <div className="space-y-1.5">
            <span className="text-xs text-slate-500 font-semibold">Popular towns & cities:</span>
            <div className="flex flex-wrap gap-1.5">
              {['Salem', 'Coimbatore', 'Pune', 'Bengaluru', 'Delhi', 'Austin', 'Nairobi'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleQuickPick(city)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300 border border-slate-200 text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          {results.length > 0 && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <span className="text-xs text-slate-500 font-semibold">Select your location:</span>
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden">
                {results.map((c, idx) => (
                  <button
                    key={`${c.latitude}-${c.longitude}-${idx}`}
                    type="button"
                    onClick={() => onSelectCity(c)}
                    className="w-full text-left p-3 hover:bg-teal-50 transition-colors flex items-center justify-between gap-2 text-slate-800 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
                      <span className="font-bold text-sm sm:text-base text-slate-900">{c.name}</span>
                      {(c.admin1 || c.country) && (
                        <span className="text-xs text-slate-500">
                          ({[c.admin1, c.country].filter(Boolean).join(', ')})
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-teal-800 shrink-0 bg-white border border-teal-200 px-2 py-0.5 rounded-md">
                      Pick
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error or Empty Message */}
          {hasSearched && !isSearching && results.length === 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                {searchError || `No matching locations found for "${query}". You can check your spelling or enter your rainfall manually.`}
              </span>
            </div>
          )}

          {/* Footer with Manual Option */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-500">
              Rain gauge at home? Manual entry is always accurate.
            </span>

            <button
              type="button"
              id="city-modal-enter-manually-btn"
              onClick={onEnterManually}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors cursor-pointer text-center"
            >
              Enter Rainfall Manually
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
