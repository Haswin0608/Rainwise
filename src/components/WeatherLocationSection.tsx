import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Search,
  Navigation,
  RefreshCw,
  X,
  Loader2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { FullWeatherData, DailyForecastDay } from '../types';
import {
  fetchFullWeatherFromOpenMeteo,
  reverseGeocodeCoords,
  searchCities,
  CitySearchResult,
  saveSessionWeather,
  getSessionWeather,
  clearSessionWeather,
} from '../utils/weather';
import { useAppSettings } from '../context/AppSettingsContext';
import { celsiusToFahrenheit, mmToInches } from '../utils/units';

interface WeatherLocationSectionProps {
  currentRainfallValue: string;
  onRainfallAutoFill: (rainfallMm: number, locationName: string, fullWeather: FullWeatherData) => void;
  onManualRainfallKeep?: () => void;
}

export const WeatherLocationSection: React.FC<WeatherLocationSectionProps> = ({
  currentRainfallValue,
  onRainfallAutoFill,
}) => {
  const { unit, formatRainfall } = useAppSettings();
  const isImperial = unit === 'imperial';

  // Weather state
  const [weatherData, setWeatherData] = useState<FullWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mode selection: 'choose' (initial two buttons) | 'track' | 'type' | 'display'
  const [mode, setMode] = useState<'choose' | 'type' | 'display'>('choose');
  const [friendlyFallbackNotice, setFriendlyFallbackNotice] = useState<string | null>(null);

  // Type my location state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load session weather on mount
  useEffect(() => {
    const saved = getSessionWeather();
    if (saved) {
      setWeatherData(saved);
      setMode('display');
      if (!currentRainfallValue || currentRainfallValue.trim() === '') {
        onRainfallAutoFill(saved.rainfallTodayMm, saved.locationName, saved);
      }
    }
  }, []);

  // Fetch full weather for given coordinates and location label
  const loadWeatherForCoords = async (lat: number, lon: number, locationName: string) => {
    setIsLoading(true);
    setLoadingMsg(`Fetching weather for ${locationName}...`);
    setErrorMessage(null);

    try {
      const full = await fetchFullWeatherFromOpenMeteo(lat, lon, locationName);
      setWeatherData(full);
      saveSessionWeather(full);
      setMode('display');
      setFriendlyFallbackNotice(null);
      onRainfallAutoFill(full.rainfallTodayMm, full.locationName, full);
    } catch {
      setErrorMessage("Couldn't load weather right now — you can still enter rainfall manually");
    } finally {
      setIsLoading(false);
      setLoadingMsg('');
    }
  };

  // Option 1: Track My Location (Geolocation)
  const handleTrackLocation = () => {
    setErrorMessage(null);
    setFriendlyFallbackNotice(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setFriendlyFallbackNotice("Couldn't detect your location — please type it in instead");
      setMode('type');
      return;
    }

    setIsLoading(true);
    setLoadingMsg('Locating your position (asking browser permission)...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLoadingMsg('Finding city name & local rainfall...');
        try {
          const locationName = await reverseGeocodeCoords(latitude, longitude);
          await loadWeatherForCoords(latitude, longitude, locationName);
        } catch {
          await loadWeatherForCoords(latitude, longitude, 'Your Local Area');
        }
      },
      (error) => {
        setIsLoading(false);
        setLoadingMsg('');
        if (error.code === error.PERMISSION_DENIED) {
          setFriendlyFallbackNotice("Location access was denied — you can easily type your city instead.");
        } else {
          setFriendlyFallbackNotice("Couldn't detect your location automatically — please type your town below.");
        }
        setMode('type');
      },
      {
        timeout: 10000,
        maximumAge: 300000,
        enableHighAccuracy: false,
      }
    );
  };

  // Option 2: Type My Location
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setErrorMessage(null);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (val.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearchingCities(false);
      return;
    }

    setIsSearchingCities(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchCities(val);
        setSearchResults(results);
        setHasSearched(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearchingCities(false);
      }
    }, 350);
  };

  const handleSelectCity = async (city: CitySearchResult) => {
    const locationLabel = [city.name, city.admin1, city.country].filter(Boolean).join(', ');
    setSearchResults([]);
    setSearchQuery('');
    await loadWeatherForCoords(city.latitude, city.longitude, locationLabel);
  };

  const handleRefresh = async () => {
    if (!weatherData) return;
    await loadWeatherForCoords(weatherData.latitude, weatherData.longitude, weatherData.locationName);
  };

  const handleChangeLocation = () => {
    clearSessionWeather();
    setWeatherData(null);
    setSearchQuery('');
    setSearchResults([]);
    setErrorMessage(null);
    setFriendlyFallbackNotice(null);
    setMode('choose');
  };

  // Formatting helpers for temperature
  const formatTemp = (celsius: number) => {
    if (isImperial) {
      return `${celsiusToFahrenheit(celsius)}°F`;
    }
    return `${celsius}°C`;
  };

  const formatShortTemp = (celsius: number) => {
    if (isImperial) {
      return `${celsiusToFahrenheit(celsius)}°`;
    }
    return `${celsius}°`;
  };

  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden transition-all">
      
      {/* ═══════════════════════════════════════
          STATE 1: CHOOSE OR TYPE LOCATION
          ═══════════════════════════════════════ */}
      {mode !== 'display' && (
        <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-slate-900/70">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">🌦️</span>
                <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white font-['Outfit',sans-serif]">
                  Local Weather & Rainfall
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Set your location to auto-fill rainfall and view the 7-day forecast.
              </p>
            </div>
          </div>

          {/* Friendly Fallback Notice */}
          {friendlyFallbackNotice && (
            <div className="mb-4 p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-teal-950 dark:text-teal-200 text-xs sm:text-sm flex items-start gap-2">
              <span className="text-sm shrink-0">ℹ️</span>
              <p>{friendlyFallbackNotice}</p>
            </div>
          )}

          {/* TWO CLEAR OPTIONS */}
          {mode === 'choose' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Track My Location Button */}
                <button
                  type="button"
                  id="weather-track-location-btn"
                  onClick={handleTrackLocation}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 active:bg-teal-100 border border-slate-200 dark:border-slate-700 hover:border-teal-400 shadow-2xs text-slate-800 dark:text-slate-200 text-sm font-semibold transition cursor-pointer group disabled:opacity-50 min-h-[48px]"
                >
                  <Navigation className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                  <span>📍 Track My Location</span>
                </button>

                {/* 2. Type My Location Button */}
                <button
                  type="button"
                  id="weather-type-location-btn"
                  onClick={() => {
                    setMode('type');
                    setErrorMessage(null);
                  }}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 active:bg-teal-100 border border-slate-200 dark:border-slate-700 hover:border-teal-400 shadow-2xs text-slate-800 dark:text-slate-200 text-sm font-semibold transition cursor-pointer group disabled:opacity-50 min-h-[48px]"
                >
                  <Search className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
                  <span>🔍 Type My Location</span>
                </button>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-teal-900 dark:text-teal-200 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  <span>{loadingMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* TYPE MY LOCATION: Autocomplete Input & Suggestions */}
          {mode === 'type' && (
            <div className="space-y-3">
              <form onSubmit={(e) => e.preventDefault()} className="relative">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    id="weather-city-input"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder="Type city, town, or village name..."
                    autoFocus
                    className="w-full pl-10 pr-20 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    {isSearchingCities ? (
                      <Loader2 className="w-4 h-4 animate-spin text-teal-600 mr-2" />
                    ) : searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setMode('choose')}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white font-semibold px-2 py-1"
                    >
                      Back
                    </button>
                  </div>
                </div>
              </form>

              {/* Suggestions / Disambiguation List */}
              <AnimatePresence>
                {searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden"
                  >
                    <div className="px-3.5 py-2 bg-slate-50 dark:bg-slate-750 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Select Your Location:
                    </div>
                    {searchResults.map((city, idx) => (
                      <button
                        key={`${city.name}-${city.latitude}-${city.longitude}-${idx}`}
                        type="button"
                        id={`city-suggestion-${idx}`}
                        onClick={() => handleSelectCity(city)}
                        className="w-full text-left px-4 py-3 hover:bg-teal-50/80 dark:hover:bg-slate-700 active:bg-teal-100 dark:active:bg-slate-600 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{city.name}</span>
                            {(city.admin1 || city.country) && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                                {[city.admin1, city.country].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-800 shrink-0">
                          Select
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* No results message */}
              {hasSearched && !isSearchingCities && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>No matching locations found. Try another town name or enter rainfall manually.</span>
                </div>
              )}
            </div>
          )}

          {/* Friendly Error Banner */}
          {errorMessage && (
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{errorMessage}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════
          STATE 2: FULL WEATHER DISPLAY
          ═══════════════════════════════════════ */}
      {mode === 'display' && weatherData && (
        <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
          
          {/* TOP CARD: TODAY'S WEATHER */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-teal-50/70 via-white to-sky-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850">
            {/* Top row: Location & Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <span className="text-xl">📍</span>
                <span className="font-bold text-base sm:text-lg font-['Outfit',sans-serif]">
                  {weatherData.locationName}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                  ({weatherData.dateStr})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="weather-refresh-btn"
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 dark:text-teal-300 hover:text-teal-950 dark:hover:text-teal-100 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-xl border border-teal-200 dark:border-teal-700 shadow-2xs transition cursor-pointer"
                  title="Refresh weather"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>

                <button
                  type="button"
                  id="weather-change-location-btn"
                  onClick={handleChangeLocation}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer"
                >
                  <span>Change Location</span>
                </button>
              </div>
            </div>

            {/* Weather Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-stretch">
              
              {/* Condition */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs flex items-center gap-3.5">
                <div className="text-3xl sm:text-4xl shrink-0">
                  {weatherData.currentConditionIcon}
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">
                    Condition
                  </span>
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {weatherData.currentConditionLabel}
                  </span>
                </div>
              </div>

              {/* Current Temperature */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/70 flex items-center justify-center text-xl shrink-0 font-bold">
                  🌡️
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block uppercase tracking-wider">
                    Temperature
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit',sans-serif]">
                    {formatTemp(weatherData.currentTemp)}
                  </span>
                </div>
              </div>

              {/* Today's Rainfall */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-300/80 dark:border-teal-700 shadow-2xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-700 flex items-center justify-center text-xl shrink-0">
                    🌧️
                  </div>
                  <div>
                    <span className="text-xs text-teal-800 dark:text-teal-300 font-extrabold block uppercase tracking-wider">
                      Today&apos;s Rainfall
                    </span>
                    <span className="text-xl sm:text-2xl font-extrabold text-teal-950 dark:text-teal-100 font-['Outfit',sans-serif]">
                      {formatRainfall(weatherData.rainfallTodayMm)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-white/90 dark:bg-slate-800 border border-teal-200/80 dark:border-teal-700 px-2 py-1 rounded-lg shrink-0">
                  Auto-filled ↓
                </span>
              </div>
            </div>

            {/* Heavy Rain Alert Note (if expected soon) */}
            {weatherData.heavyRainAlert && (
              <div className="mt-3.5 p-3 sm:p-3.5 rounded-2xl bg-teal-100/70 dark:bg-teal-900/50 border border-teal-300 dark:border-teal-700 text-teal-950 dark:text-teal-100 text-xs sm:text-sm font-semibold flex items-center gap-2.5">
                <span className="text-base shrink-0">📢</span>
                <p className="flex-1 leading-snug">
                  {weatherData.heavyRainAlert}
                </p>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════
              THIS WEEK'S OUTLOOK (7-DAY FORECAST STRIP)
              ═══════════════════════════════════════ */}
          <div className="p-4 sm:p-5 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  This Week&apos;s Outlook (7-Day Forecast)
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                Open-Meteo Weather
              </span>
            </div>

            {/* Horizontal Scrollable Strip for Mobile & Desktop */}
            <div className="flex items-stretch gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
              {weatherData.dailyForecast.map((day: DailyForecastDay, idx: number) => {
                const isToday = idx === 0;
                const hasRain = day.precipitationMm > 0;
                const isHeavy = day.precipitationMm >= 15;

                return (
                  <div
                    key={day.date}
                    id={`forecast-day-${idx}`}
                    className={`shrink-0 w-28 sm:w-32 p-3 rounded-2xl border text-center flex flex-col justify-between transition-all ${
                      isToday
                        ? 'bg-teal-50/80 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 shadow-2xs ring-1 ring-teal-200 dark:ring-teal-800'
                        : isHeavy
                        ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200/90 dark:border-amber-800/70'
                        : 'bg-slate-50/70 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100/70 dark:hover:bg-slate-750'
                    }`}
                  >
                    {/* Day Name */}
                    <div>
                      <span className={`text-xs font-bold block ${isToday ? 'text-teal-900 dark:text-teal-200' : 'text-slate-700 dark:text-slate-300'}`}>
                        {day.dayLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                        {new Date(`${day.date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>

                    {/* Icon & Condition */}
                    <div className="my-2">
                      <div className="text-2xl sm:text-3xl my-1">
                        {day.conditionIcon}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block truncate" title={day.conditionLabel}>
                        {day.conditionLabel}
                      </span>
                    </div>

                    {/* Expected Rainfall & High/Low Temp */}
                    <div className="space-y-1 pt-1.5 border-t border-slate-200/60 dark:border-slate-700">
                      <div className={`text-xs font-bold ${hasRain ? 'text-teal-900 dark:text-teal-200' : 'text-slate-500 dark:text-slate-400'}`}>
                        {day.precipitationMm > 0 ? (
                          <span className="inline-flex items-center gap-0.5">
                            <span>💧</span>
                            <span>{formatRainfall(day.precipitationMm)}</span>
                          </span>
                        ) : (
                          <span>0 {isImperial ? 'in' : 'mm'}</span>
                        )}
                      </div>

                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <span className="text-slate-800 dark:text-slate-200 font-semibold">{formatShortTemp(day.tempMax)}</span>
                        <span className="mx-0.5 text-slate-300 dark:text-slate-600">/</span>
                        <span>{formatShortTemp(day.tempMin)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
