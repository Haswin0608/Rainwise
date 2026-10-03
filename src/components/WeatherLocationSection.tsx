import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Search,
  Navigation,
  RefreshCw,
  X,
  Loader2,
  AlertTriangle,
  CloudRain,
  ShieldCheck,
  Check,
  Info
} from 'lucide-react';
import { FullWeatherData, DailyForecastDay, HistoricalRainfallData } from '../types';
import {
  WEATHER_STRINGS,
  fetch7DayWeatherForecast,
  fetch3YearHistoricalRainfall,
  reverseGeocodeWithBigDataCloud,
  searchCities,
  CitySearchResult,
  saveLocationPreference,
  getSavedLocationPreference,
  clearSavedLocationPreference,
  getRainLevelCategory,
} from '../utils/weather';

interface WeatherLocationSectionProps {
  roofAreaM2?: number;
  runoffCoefficient?: number;
  tankCapacityL?: number;
  onLocationChange?: (
    locationName: string, 
    weatherData: FullWeatherData, 
    historicalData: HistoricalRainfallData | null,
    archiveError: string | null
  ) => void;
}

export const WeatherLocationSection: React.FC<WeatherLocationSectionProps> = ({
  roofAreaM2 = 0,
  runoffCoefficient = 0.80,
  tankCapacityL = 0,
  onLocationChange,
}) => {
  // Weather state
  const [weatherData, setWeatherData] = useState<FullWeatherData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalRainfallData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [loadingStepMsg, setLoadingStepMsg] = useState('');
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastAttemptTarget, setLastAttemptTarget] = useState<{ lat: number; lon: number; name: string } | null>(null);

  // Active view mode: 'prompt' (Where are you?) vs 'display' (7-day forecast active)
  const [mode, setMode] = useState<'prompt' | 'display'>('prompt');
  const [friendlyGeolocationError, setFriendlyGeolocationError] = useState<string | null>(null);

  // Type my location state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearchingCities, setIsSearchingCities] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // On mount: check for saved location in browser localStorage (wrapped in try/catch)
  useEffect(() => {
    const savedLoc = getSavedLocationPreference();
    if (savedLoc && savedLoc.latitude && savedLoc.longitude) {
      loadWeatherAndArchive(savedLoc.latitude, savedLoc.longitude, savedLoc.name, false);
    }
  }, []);

  /**
   * Fetch both 7-day forecast and 3-year historical archive from Open-Meteo
   * Strictly uses real API values; never invents or hardcodes.
   */
  const loadWeatherAndArchive = async (
    lat: number,
    lon: number,
    locationName: string,
    showLoadingState: boolean = true
  ) => {
    setLastAttemptTarget({ lat, lon, name: locationName });
    if (showLoadingState) {
      setIsLoading(true);
      setLoadingStepMsg(`Getting live forecast & past rainfall for ${locationName}...`);
    }
    setForecastError(null);
    setArchiveError(null);
    setFriendlyGeolocationError(null);

    let fullForecast: FullWeatherData | null = null;
    let archiveResult: HistoricalRainfallData | null = null;
    let archiveErr: string | null = null;

    try {
      fullForecast = await fetch7DayWeatherForecast(lat, lon, locationName);
      setWeatherData(fullForecast);
      setMode('display');
      saveLocationPreference({
        name: locationName,
        latitude: lat,
        longitude: lon,
        lastUpdated: fullForecast.lastUpdatedStr,
      });
    } catch (err: any) {
      console.error('Weather forecast load error:', err);
      setForecastError(WEATHER_STRINGS.errorLoadingWeather);
      setIsLoading(false);
      return;
    }

    try {
      setIsArchiveLoading(true);
      archiveResult = await fetch3YearHistoricalRainfall(lat, lon, locationName);
      setHistoricalData(archiveResult);
    } catch (err: any) {
      console.error('Archive rainfall load error:', err);
      archiveErr = WEATHER_STRINGS.errorLoadingArchive;
      setArchiveError(WEATHER_STRINGS.errorLoadingArchive);
    } finally {
      setIsArchiveLoading(false);
      setIsLoading(false);
      setLoadingStepMsg('');
    }

    if (onLocationChange && fullForecast) {
      onLocationChange(locationName, fullForecast, archiveResult, archiveErr);
    }
  };

  /**
   * Retry loading archive data specifically
   */
  const handleRetryArchive = async () => {
    if (!lastAttemptTarget) return;
    setArchiveError(null);
    setIsArchiveLoading(true);
    try {
      const archiveResult = await fetch3YearHistoricalRainfall(
        lastAttemptTarget.lat, 
        lastAttemptTarget.lon, 
        lastAttemptTarget.name
      );
      setHistoricalData(archiveResult);
      if (onLocationChange && weatherData) {
        onLocationChange(lastAttemptTarget.name, weatherData, archiveResult, null);
      }
    } catch {
      setArchiveError(WEATHER_STRINGS.errorLoadingArchive);
      if (onLocationChange && weatherData) {
        onLocationChange(lastAttemptTarget.name, weatherData, null, WEATHER_STRINGS.errorLoadingArchive);
      }
    } finally {
      setIsArchiveLoading(false);
    }
  };

  /**
   * Option A: Use My Current Location via browser Geolocation API
   */
  const handleUseCurrentLocation = () => {
    setForecastError(null);
    setArchiveError(null);
    setFriendlyGeolocationError(null);

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setFriendlyGeolocationError(WEATHER_STRINGS.locationUnavailable);
      return;
    }

    setIsLoading(true);
    setLoadingStepMsg(WEATHER_STRINGS.locatingPosition);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLoadingStepMsg(WEATHER_STRINGS.detectingPlaceName);
        try {
          const locationName = await reverseGeocodeWithBigDataCloud(latitude, longitude);
          await loadWeatherAndArchive(latitude, longitude, locationName, true);
        } catch {
          await loadWeatherAndArchive(latitude, longitude, `Your location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`, true);
        }
      },
      (error) => {
        setIsLoading(false);
        setLoadingStepMsg('');
        if (error.code === error.PERMISSION_DENIED) {
          setFriendlyGeolocationError(WEATHER_STRINGS.permissionDenied);
        } else if (error.code === error.TIMEOUT) {
          setFriendlyGeolocationError(WEATHER_STRINGS.locationTimeout);
        } else {
          setFriendlyGeolocationError(WEATHER_STRINGS.locationUnavailable);
        }
      },
      {
        timeout: 10000,
        maximumAge: 300000,
        enableHighAccuracy: false,
      }
    );
  };

  /**
   * Option B: Search box with 400ms debounce using Open-Meteo Geocoding
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setForecastError(null);

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
        setHasSearched(true);
      } finally {
        setIsSearchingCities(false);
      }
    }, 400); // 400 ms debounce
  };

  const handleSelectCitySuggestion = async (city: CitySearchResult) => {
    setSearchResults([]);
    setSearchQuery('');
    setHasSearched(false);
    await loadWeatherAndArchive(city.latitude, city.longitude, city.formattedLabel, true);
  };

  const handleChangeLocation = () => {
    clearSavedLocationPreference();
    setWeatherData(null);
    setHistoricalData(null);
    setSearchQuery('');
    setSearchResults([]);
    setForecastError(null);
    setArchiveError(null);
    setFriendlyGeolocationError(null);
    setMode('prompt');
  };

  const handleRefresh = async () => {
    if (!weatherData) return;
    await loadWeatherAndArchive(weatherData.latitude, weatherData.longitude, weatherData.locationName, true);
  };

  const handleRetryOverall = async () => {
    if (lastAttemptTarget) {
      await loadWeatherAndArchive(lastAttemptTarget.lat, lastAttemptTarget.lon, lastAttemptTarget.name, true);
    } else {
      handleUseCurrentLocation();
    }
  };

  /**
   * Water Harvesting Calculator Connections
   * For each day: roof area (m²) × precipitation_sum (mm) × runoff coefficient
   */
  const calculateDailyCollectionL = (precipMm: number): number | null => {
    if (!roofAreaM2 || roofAreaM2 <= 0) return null;
    const rawLitres = roofAreaM2 * precipMm * runoffCoefficient;
    return Math.round(rawLitres / 10) * 10;
  };

  // Weekly total collectable water
  const totalWeeklyRainMm = weatherData?.weeklyPrecipitationSumMm || 0;
  const weeklyCollectionL = roofAreaM2 > 0 
    ? Math.round((roofAreaM2 * totalWeeklyRainMm * runoffCoefficient) / 10) * 10 
    : 0;

  // Tank overflow check: if tank size entered and weekly collection > tank
  const hasTankCapacity = tankCapacityL && tankCapacityL > 0;
  const isTankOverflowRisk = hasTankCapacity && weeklyCollectionL > tankCapacityL;
  const potentialWastedL = isTankOverflowRisk ? Math.round((weeklyCollectionL - tankCapacityL) / 10) * 10 : 0;

  return (
    <div 
      id="location-section-container"
      className="rounded-3xl border-2 border-teal-600/30 dark:border-teal-700/50 bg-white dark:bg-slate-900 shadow-sm overflow-hidden transition-all"
    >
      
      {/* ═══════════════════════════════════════════════════════
          SECTION 1: LOCATION PROMPT ("📍 Where are you?")
          ═══════════════════════════════════════════════════════ */}
      {mode === 'prompt' && (
        <div className="p-5 sm:p-7 bg-gradient-to-br from-teal-50/60 via-white to-sky-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 space-y-5">
          
          {/* Card Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl" role="img" aria-label="pin">📍</span>
              <h3 className="font-['Outfit',sans-serif] font-black text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight">
                {WEATHER_STRINGS.cardTitle}
              </h3>
            </div>
            
            {/* Friendly Privacy Notice */}
            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
              <span>{WEATHER_STRINGS.privacyNotice}</span>
            </div>
          </div>

          {/* Friendly Geolocation / Permission error message */}
          {friendlyGeolocationError && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-2.5">
              <span className="text-base shrink-0">ℹ️</span>
              <p className="font-medium">{friendlyGeolocationError}</p>
            </div>
          )}

          {/* TWO EASY WAYS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            
            {/* WAY A: Big Button "Use my current location" */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3 flex flex-col justify-between h-full">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300 block mb-1">
                  {WEATHER_STRINGS.optionA}
                </span>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {WEATHER_STRINGS.optionATitle}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {WEATHER_STRINGS.optionADesc}
                </p>
              </div>

              <button
                type="button"
                id="weather-use-current-location-btn"
                onClick={handleUseCurrentLocation}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white font-bold text-sm sm:text-base shadow-md shadow-teal-900/15 transition cursor-pointer disabled:opacity-60 min-h-[48px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{loadingStepMsg || WEATHER_STRINGS.locatingPosition}</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    <span>{WEATHER_STRINGS.useCurrentLocation}</span>
                  </>
                )}
              </button>
            </div>

            {/* WAY B: Search Box "Or type your village / town / city" */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs space-y-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  {WEATHER_STRINGS.optionB}
                </span>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {WEATHER_STRINGS.searchPrompt}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {WEATHER_STRINGS.optionBDesc}
                </p>
              </div>

              <div className="relative">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    id="weather-search-input"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder={WEATHER_STRINGS.searchPlaceholder}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[48px]"
                  />
                  {isSearchingCities ? (
                    <Loader2 className="w-4 h-4 animate-spin text-teal-600 absolute right-3" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 cursor-pointer min-h-[44px] min-w-[36px] flex items-center justify-center"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>

                {/* Suggestions List (shows up to 5 with District & State) */}
                <AnimatePresence>
                  {searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700"
                    >
                      {searchResults.map((city, idx) => (
                        <button
                          key={`${city.name}-${city.latitude}-${city.longitude}-${idx}`}
                          type="button"
                          id={`city-search-item-${idx}`}
                          onClick={() => handleSelectCitySuggestion(city)}
                          className="w-full text-left px-3.5 py-3 hover:bg-teal-50/80 dark:hover:bg-slate-700 active:bg-teal-100 flex items-center justify-between gap-2 transition cursor-pointer min-h-[44px]"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                            <div className="truncate">
                              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                {city.name}
                              </span>
                              {(city.admin2 || city.admin1) && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5 truncate">
                                  ({[city.admin2, city.admin1].filter(Boolean).join(', ')})
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 shrink-0">
                            {WEATHER_STRINGS.selectBtn}
                          </span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty State */}
                {hasSearched && !isSearchingCities && searchResults.length === 0 && searchQuery.trim().length >= 2 && (
                  <div className="mt-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {WEATHER_STRINGS.noPlaceFound}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Loading Skeleton while loading in prompt mode */}
          {isLoading && (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-center gap-2.5 text-sm text-teal-800 dark:text-teal-300 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                <span>{loadingStepMsg || WEATHER_STRINGS.locatingPosition}</span>
              </div>
              <div className="flex items-stretch gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-7 sm:overflow-visible">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="shrink-0 w-36 sm:w-auto p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 animate-pulse space-y-2.5">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mx-auto" />
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto my-1.5" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mx-auto" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message with Retry button */}
          {forecastError && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{forecastError}</span>
              </div>
              <button
                type="button"
                id="weather-retry-btn"
                onClick={handleRetryOverall}
                className="px-4 py-2 rounded-xl bg-rose-200 hover:bg-rose-300 active:bg-rose-400 dark:bg-rose-900 dark:hover:bg-rose-800 font-bold text-xs text-rose-950 dark:text-rose-100 transition cursor-pointer min-h-[44px] flex items-center justify-center shrink-0"
              >
                {WEATHER_STRINGS.retry}
              </button>
            </div>
          )}

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 & 3: 7-DAY WEATHER FORECAST & UI CARDS
          ═══════════════════════════════════════════════════════ */}
      {mode === 'display' && weatherData && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          
          {/* Header Bar: Chosen Location ("📍 Salem, Tamil Nadu") + "Change Location" + "Refresh" */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-50/70 via-white to-sky-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-850 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                <span className="text-xl" role="img" aria-label="pin">📍</span>
                <h3 className="font-['Outfit',sans-serif] font-black text-lg sm:text-xl">
                  {weatherData.locationName}
                </h3>
              </div>
              
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span>
                  {Math.abs(weatherData.latitude).toFixed(2)}° {weatherData.latitude >= 0 ? 'N' : 'S'},{' '}
                  {Math.abs(weatherData.longitude).toFixed(2)}° {weatherData.longitude >= 0 ? 'E' : 'W'}
                </span>
                <span>•</span>
                <span>{WEATHER_STRINGS.lastUpdated}: {weatherData.lastUpdatedStr}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="weather-refresh-btn"
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition cursor-pointer min-h-[44px]"
                title="Refresh latest forecast"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isLoading ? 'animate-spin' : ''}`} />
                <span>{WEATHER_STRINGS.refresh}</span>
              </button>

              <button
                type="button"
                id="weather-change-location-btn"
                onClick={handleChangeLocation}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition cursor-pointer min-h-[44px]"
              >
                <span>{WEATHER_STRINGS.changeLocation}</span>
              </button>
            </div>
          </div>

          {/* Optional Error notification if refresh failed */}
          {forecastError && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-medium">{forecastError}</span>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                className="px-3 py-1.5 rounded-lg bg-rose-200 hover:bg-rose-300 dark:bg-rose-900 font-bold text-xs cursor-pointer min-h-[36px]"
              >
                {WEATHER_STRINGS.retry}
              </button>
            </div>
          )}

          {/* ONE-SENTENCE SUMMARY ABOVE CARDS */}
          <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-850/80 border-y border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
              <span className="text-base shrink-0" role="img" aria-label="weather">🌦️</span>
              <p>{weatherData.weeklySummarySentence}</p>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {WEATHER_STRINGS.total7DayRain} <strong className="text-teal-800 dark:text-teal-300 font-bold">{totalWeeklyRainMm} mm</strong>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              7-DAY CARDS (HORIZONTAL SCROLL ON MOBILE, GRID ON DESKTOP)
              ═══════════════════════════════════════════════════ */}
          <div className="p-4 sm:p-5">
            {isLoading ? (
              /* Loading Skeletons for 7 days */
              <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 sm:grid sm:grid-cols-7 sm:overflow-visible">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className="shrink-0 w-36 sm:w-auto p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 animate-pulse flex flex-col justify-between min-h-[220px]"
                  >
                    <div className="space-y-1.5">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mx-auto" />
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-750 rounded w-1/2 mx-auto" />
                    </div>
                    <div className="my-3 space-y-2">
                      <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5 mx-auto" />
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-750 rounded w-2/3 mx-auto" />
                    </div>
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mx-auto" />
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full w-full" />
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth sm:grid sm:grid-cols-7 sm:overflow-visible">
                {weatherData.dailyForecast.map((day: DailyForecastDay, idx: number) => {
                  const isToday = idx === 0;
                  const isRainiest = idx === weatherData.rainiestDayIndex && day.precipitationMm > 0;
                  const rainCategory = getRainLevelCategory(day.precipitationMm);
                  const dailyCollectL = calculateDailyCollectionL(day.precipitationMm);

                  return (
                    <div
                      key={day.date}
                      id={`forecast-card-${idx}`}
                      className={`shrink-0 w-36 sm:w-auto p-3 sm:p-3.5 rounded-2xl border-2 text-center flex flex-col justify-between transition-all ${
                        isRainiest
                          ? 'border-teal-500 dark:border-teal-400 bg-teal-50/70 dark:bg-teal-950/40 shadow-xs'
                          : isToday
                          ? 'border-sky-300 dark:border-sky-700 bg-sky-50/40 dark:bg-slate-800'
                          : 'border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 hover:border-slate-300'
                      }`}
                    >
                      {/* Top: Day Name + Date */}
                      <div>
                        {isRainiest && (
                          <span className="inline-block text-[10px] font-black uppercase tracking-tight px-2 py-0.5 rounded-full bg-teal-700 text-white mb-1.5 leading-none shadow-xs">
                            {WEATHER_STRINGS.bestDayBadge}
                          </span>
                        )}
                        <span className={`text-xs sm:text-sm font-bold block ${isToday ? 'text-teal-900 dark:text-teal-200' : 'text-slate-900 dark:text-white'}`}>
                          {day.dayLabel}
                        </span>
                        {idx < 2 && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block leading-tight">
                            {new Date(`${day.date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>

                      {/* Middle: Weather Icon + Plain Language Label */}
                      <div className="my-2.5">
                        <div className="text-3xl my-1 select-none" role="img" aria-label={day.conditionLabel}>
                          {day.conditionIcon}
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate" title={day.conditionLabel}>
                          {day.conditionLabel}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mt-0.5">
                          {day.tempMax}° / {day.tempMin}°
                        </span>
                      </div>

                      {/* Rain Level & Chance of Rain with Mini Progress Bar */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/80 space-y-2">
                        <div>
                          <div className="text-xs font-black text-slate-900 dark:text-white">
                            {day.precipitationMm} {WEATHER_STRINGS.mmOfRain}
                          </div>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${rainCategory.badgeBg} ${rainCategory.badgeBorder} ${rainCategory.badgeText} inline-block mt-0.5`}>
                            {rainCategory.label}
                          </span>
                        </div>

                        {/* Chance of Rain % Bar */}
                        <div>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-0.5">
                            <span>{WEATHER_STRINGS.chanceShort}</span>
                            <span className="font-bold text-sky-700 dark:text-sky-300">{day.precipitationProbabilityMax}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                            <div
                              className="h-full bg-sky-500 rounded-full transition-all duration-300"
                              style={{ width: `${day.precipitationProbabilityMax}%` }}
                            />
                          </div>
                        </div>

                        {/* Water You Could Collect for this Day (Calculated with Roof Area) */}
                        <div className="pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-700 text-left">
                          {dailyCollectL !== null ? (
                            dailyCollectL > 0 ? (
                              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block leading-tight">
                                {WEATHER_STRINGS.collectablePrefix} {dailyCollectL.toLocaleString()} {WEATHER_STRINGS.litresText}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 block leading-tight">
                                {WEATHER_STRINGS.dryDayLabel}
                              </span>
                            )
                          ) : (
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 italic block leading-tight">
                              {WEATHER_STRINGS.enterRoofPrompt}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Short Legend for Rain Levels */}
            <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-700 dark:text-slate-300">{WEATHER_STRINGS.rainLegendTitle}</span>
                <span className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {WEATHER_STRINGS.legendNoRain}
                </span>
                <span className="px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-300">
                  {WEATHER_STRINGS.legendLight}
                </span>
                <span className="px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  {WEATHER_STRINGS.legendModerate}
                </span>
                <span className="px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200">
                  {WEATHER_STRINGS.legendHeavy}
                </span>
                <span className="px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-200">
                  {WEATHER_STRINGS.legendVeryHeavy}
                </span>
              </div>

              <div className="italic text-[10px] text-slate-400 dark:text-slate-500">
                {WEATHER_STRINGS.dataSourceNotice}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              SECTION 4: AUTOMATIC LOCATION-BASED RAINFALL SUMMARY
              - Short-term: This week's collection from forecast
              - Yearly estimate: 3-year historical archive from Open-Meteo
              ═══════════════════════════════════════════════════ */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-sky-500/10 border-t border-teal-500/20 space-y-4">
            
            {/* A) SHORT-TERM: This week's collection */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl" role="img" aria-label="drop">💧</span>
                <h4 className="font-['Outfit',sans-serif] font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                  {roofAreaM2 > 0 ? (
                    <>
                      {WEATHER_STRINGS.weeklyTotalPrefix}{' '}
                      <span className="text-teal-800 dark:text-teal-300 font-extrabold">
                        {weeklyCollectionL.toLocaleString()} {WEATHER_STRINGS.litresText}
                      </span>
                    </>
                  ) : (
                    WEATHER_STRINGS.enterRoofPrompt
                  )}
                </h4>
              </div>

              {isTankOverflowRisk && (
                <p className="text-xs sm:text-sm font-semibold text-rose-700 dark:text-rose-400 mt-1">
                  {WEATHER_STRINGS.tankOverflowAlert.replace('{litres}', potentialWastedL.toLocaleString())}
                </p>
              )}

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {WEATHER_STRINGS.basedOnRainfallText
                  .replace('{mm}', String(totalWeeklyRainMm))
                  .replace('{location}', weatherData.locationName)}
              </p>
            </div>

            {/* B) YEARLY ESTIMATE: 3-Year Historical Average */}
            <div className="pt-3 border-t border-teal-500/20">
              {isArchiveLoading ? (
                <div className="flex items-center gap-2 text-xs text-teal-800 dark:text-teal-300 font-semibold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  <span>Loading 3-year typical rainfall data for {weatherData.locationName}...</span>
                </div>
              ) : archiveError ? (
                <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{archiveError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRetryArchive}
                    className="px-3 py-1.5 rounded-lg bg-rose-200 dark:bg-rose-900 font-bold hover:bg-rose-300 transition cursor-pointer min-h-[36px]"
                  >
                    {WEATHER_STRINGS.retry}
                  </button>
                </div>
              ) : historicalData ? (
                <div className="space-y-1">
                  {/* Read-only line with ⓘ icon */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-['Outfit',sans-serif] font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {WEATHER_STRINGS.typicalYearlyRainLabel}{' '}
                      <span className="text-teal-800 dark:text-teal-300 font-extrabold">
                        {historicalData.typicalAnnualRainfallMm} mm
                      </span>
                    </span>

                    {/* ⓘ Icon with Tooltip */}
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setShowTooltip(!showTooltip)}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="p-1 text-slate-400 hover:text-teal-600 cursor-pointer rounded-full transition"
                        aria-label="Explain typical yearly rainfall"
                      >
                        <Info className="w-4 h-4" />
                      </button>

                      <AnimatePresence>
                        {showTooltip && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="absolute left-0 bottom-full mb-1 z-30 w-64 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] leading-relaxed shadow-xl border border-slate-700"
                          >
                            {WEATHER_STRINGS.typicalYearlyRainInfo}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Plain words line */}
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {WEATHER_STRINGS.basedOn3YearAverage.replace('{mm}', String(historicalData.typicalAnnualRainfallMm))}
                  </p>
                </div>
              ) : null}
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
