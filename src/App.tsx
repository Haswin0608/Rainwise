import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { CalculatorInputs, CalculationResult, PageView, PresetScenario, AuthUser, SavedBuilding } from './types';
import { calculateHarvesting, DEFAULT_ASSUMPTIONS, DEFAULT_INPUTS, normalizeRoofs, normalizeTanks } from './utils/calculations';
import { RaindropBackground } from './components/RaindropBackground';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { CalculatorPage } from './components/CalculatorPage';
import { ResultsPage } from './components/ResultsPage';
import { FirstVisitModal } from './components/FirstVisitModal';
import { TutorialModal } from './components/TutorialModal';
import { AuthModal } from './components/AuthModal';
import { SaveBuildingModal } from './components/SaveBuildingModal';
import { EditBuildingModal } from './components/EditBuildingModal';
import { TipsModal } from './components/TipsModal';
import { AssumptionsModal } from './components/AssumptionsModal';
import { SmartBuildingPlanner } from './components/SmartBuildingPlanner';
import { BuildingPlanReport } from './components/BuildingPlanReport';
import { 
  BuildingPlannerAnswers, 
  GeneratedBuildingPlan, 
  BuildingTypeKey, 
  FullWeatherData, 
  HistoricalRainfallData,
  PlanningAssumptions
} from './types';
import { buildBuildingPlan, loadBuildingPlannerAnswers } from './utils/buildingPlanner';
import { AppSettingsProvider, useAppSettings } from './context/AppSettingsContext';
import { subscribeToAuth, logoutUser, getUserBuildings, deleteUserBuilding } from './lib/firebase';

function RainWiseApp() {
  const [currentPage, setCurrentPage] = useState<PageView>('planner');
  const { unit } = useAppSettings();

  // Initial State configured for location-based automatic rainfall and persisted to localStorage
  const [inputs, setInputs] = useState<CalculatorInputs>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('rainwise_calculator_inputs');
        if (saved) {
          const parsed = JSON.parse(saved);
          const normalizedR = normalizeRoofs(parsed.roofs, parsed.directRoofArea, parsed.roofType);
          const { tanks: normalizedT, noTankYet } = normalizeTanks(parsed.tanks, parsed.tankCapacity, parsed.noTankYet);
          return {
            ...DEFAULT_INPUTS,
            ...parsed,
            roofs: normalizedR,
            tanks: normalizedT,
            noTankYet,
          };
        }
      } catch (e) {
        console.error('Error restoring saved inputs:', e);
      }
    }
    return DEFAULT_INPUTS;
  });

  // Persist inputs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rainwise_calculator_inputs', JSON.stringify(inputs));
    } catch (e) {
      // ignore
    }
  }, [inputs]);

  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Smart Building Planner State
  const [plannerMode, setPlannerMode] = useState<'wizard' | 'report'>('wizard');
  const [plannerAnswers, setPlannerAnswers] = useState<BuildingPlannerAnswers | null>(loadBuildingPlannerAnswers());
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedBuildingPlan | null>(null);
  const [plannerWeatherData, setPlannerWeatherData] = useState<FullWeatherData | null>(null);
  const [plannerHistoricalData, setPlannerHistoricalData] = useState<HistoricalRainfallData | null>(null);

  // Auth & Saved Buildings State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [savedBuildings, setSavedBuildings] = useState<SavedBuilding[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [activeBuilding, setActiveBuilding] = useState<SavedBuilding | null>(null);

  // Modals
  const [showFirstVisitModal, setShowFirstVisitModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAssumptionsModal, setShowAssumptionsModal] = useState(false);
  const [authModalTitle, setAuthModalTitle] = useState<string | undefined>(undefined);
  const [authModalSubtitle, setAuthModalSubtitle] = useState<string | undefined>(undefined);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<SavedBuilding | null>(null);

  // Tips Modal state
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [selectedTipId, setSelectedTipId] = useState<string | undefined>(undefined);

  const handleOpenTips = (tipId?: string) => {
    setSelectedTipId(tipId);
    setIsTipsOpen(true);
  };

  // Toast notification for user confirmation
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Re-calculate results whenever unit changes if a result is already active
  useEffect(() => {
    if (result) {
      const recomputed = calculateHarvesting(inputs, unit, inputs.assumptions || DEFAULT_ASSUMPTIONS);
      setResult(recomputed);
    }
  }, [unit]);

  // Check tutorial first-time state
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('rainwise_tutorial_seen');
    if (!hasSeenTutorial) {
      setShowTutorialModal(true);
    }
  }, []);

  // Check first-visit state
  useEffect(() => {
    const hasVisited = localStorage.getItem('rainwise_visited');
    if (!hasVisited && !currentUser) {
      setShowFirstVisitModal(true);
    }
  }, [currentUser]);

  // Load buildings for logged-in user
  const refreshBuildings = useCallback(async (uid: string) => {
    setIsLoadingBuildings(true);
    try {
      const buildings = await getUserBuildings(uid);
      setSavedBuildings(buildings);
    } catch (err) {
      console.error('Error fetching buildings:', err);
    } finally {
      setIsLoadingBuildings(false);
    }
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user) {
        localStorage.setItem('rainwise_visited', 'true');
        setShowFirstVisitModal(false);
        refreshBuildings(user.uid);
      } else {
        setSavedBuildings([]);
        setActiveBuilding(null);
      }
    });
    return () => unsubscribe();
  }, [refreshBuildings]);

  // Handlers for First Visit Modal
  const handleFirstVisitSignIn = () => {
    localStorage.setItem('rainwise_visited', 'true');
    setShowFirstVisitModal(false);
    setAuthModalTitle('Sign In / Sign Up');
    setAuthModalSubtitle('Save your farm or house measurements so you never have to re-enter them.');
    setShowAuthModal(true);
  };

  const handleFirstVisitGuest = () => {
    localStorage.setItem('rainwise_visited', 'true');
    setShowFirstVisitModal(false);
    showToast('Continuing as Guest. All water planning works fully in your browser!');
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await logoutUser();
      showToast('Signed out successfully. Guest mode active.');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Selecting a saved building from Home Page
  const handleSelectBuilding = (building: SavedBuilding) => {
    setActiveBuilding(building);
    const normalizedRoofs = normalizeRoofs(building.roofs, building.directRoofArea, building.roofType);
    const { tanks: normalizedTanks, noTankYet } = normalizeTanks(building.tanks, building.tankCapacity, building.noTankYet);

    setInputs(prev => ({
      ...prev,
      roofs: normalizedRoofs,
      tanks: normalizedTanks,
      noTankYet,
      householdSize: building.householdSize || '4',
      tankCapacity: normalizedTanks[0]?.capacity || building.tankCapacity || '2000',
      dailyRequirement: building.dailyRequirement || '240',
      locationName: building.locationLabel || prev.locationName,
    }));
    setResult(null);
    setCurrentPage('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded "${building.nickname}" into water planner!`);
  };

  // "+ Calculate a New Building"
  const handleNewBlankBuilding = () => {
    setActiveBuilding(null);
    setInputs(DEFAULT_INPUTS);
    setResult(null);
    setCurrentPage('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete saved building
  const handleDeleteBuilding = async (buildingId: string) => {
    if (!currentUser) return;
    await deleteUserBuilding(currentUser.uid, buildingId);
    if (activeBuilding?.id === buildingId) {
      setActiveBuilding(null);
    }
    await refreshBuildings(currentUser.uid);
    showToast('Building removed from your saved list.');
  };

  // Transition variants
  const pageVariants: Variants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1, 
      transition: { 
        duration: 0.22, 
        ease: 'easeInOut',
      }
    },
    exit: { 
      opacity: 0, 
      transition: { 
        duration: 0.18, 
        ease: 'easeInOut',
      }
    },
  };

  const handleStartSmartPlanner = () => {
    setPlannerMode('wizard');
    setCurrentPage('planner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartCalculate = () => {
    setCurrentPage('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAssumptions = (newAssumptions: PlanningAssumptions) => {
    setInputs((prev) => ({
      ...prev,
      assumptions: newAssumptions,
    }));
    if (result) {
      const recomputed = calculateHarvesting(inputs, unit, newAssumptions);
      setResult(recomputed);
    }
    if (plannerAnswers && generatedPlan) {
      const updatedPlan = buildBuildingPlan(
        plannerAnswers,
        plannerWeatherData,
        plannerHistoricalData,
        newAssumptions
      );
      setGeneratedPlan(updatedPlan);
    }
    showToast('Water planning assumptions updated!');
  };

  const handleSelectPreset = (preset: PresetScenario) => {
    setActiveBuilding(null);
    const newInputs: CalculatorInputs = {
      ...DEFAULT_INPUTS,
      ...preset.inputs,
    };
    setInputs(newInputs);
    const res = calculateHarvesting(newInputs, unit, newInputs.assumptions || DEFAULT_ASSUMPTIONS);
    setResult(res);
    setShowTutorialModal(false);
    setCurrentPage('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded "${preset.name}" into water planner!`);
  };

  const handlePerformCalculation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const computedResult = calculateHarvesting(inputs, unit, inputs.assumptions || DEFAULT_ASSUMPTIONS);
      setResult(computedResult);
      setIsCalculating(false);
      setCurrentPage('calculator');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  const handleReset = () => {
    handleNewBlankBuilding();
  };

  // Smart Building Planner Handler
  const handlePlanGenerated = (
    answers: BuildingPlannerAnswers,
    wData: FullWeatherData | null,
    hData: HistoricalRainfallData | null
  ) => {
    setPlannerAnswers(answers);
    setPlannerWeatherData(wData);
    setPlannerHistoricalData(hData);

    const plan = buildBuildingPlan(answers, wData, hData, inputs.assumptions || DEFAULT_ASSUMPTIONS);
    setGeneratedPlan(plan);
    setPlannerMode('report');

    const resolvedTankCapacity = answers.tankCapacityL ? String(answers.tankCapacityL) : String(plan.recommendedStorageLitres);
    const hasSpecifiedTank = Boolean(answers.isTankUserSpecified && answers.tankCapacityL);

    // Also feed answers into the detailed calculator inputs
    setInputs((prev) => ({
      ...prev,
      roofs: [
        {
          id: 'roof-planner-1',
          name: `${answers.buildingType === 'house' ? 'Main House' : 'Main'} Roof`,
          area: String(answers.roofAreaM2),
          areaUnit: 'metric',
          typeKey: answers.roofType,
        }
      ],
      tanks: [
        {
          id: 'tank-planner-1',
          name: 'Storage Tank 1',
          capacity: resolvedTankCapacity,
        }
      ],
      noTankYet: !hasSpecifiedTank,
      roofAreaMode: 'direct',
      directRoofArea: String(answers.roofAreaM2),
      roofType: answers.roofType,
      householdSize: String(answers.primaryOccupancy),
      tankCapacity: resolvedTankCapacity,
      dailyRequirement: String(plan.dailyDemandLitres),
      locationName: answers.locationName,
      latitude: answers.latitude,
      longitude: answers.longitude,
      weeklyRainfallMm: plan.weeklyRainfallMm,
      typicalAnnualRainfallMm: plan.annualRainfallMm,
      historicalRainfall: hData,
    }));

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Created RainWise Plan for your ${plan.buildingProfile.name}!`);
  };

  const handleEditPlannerAnswers = () => {
    setPlannerMode('wizard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchBuildingType = (newType: BuildingTypeKey) => {
    if (!plannerAnswers) return;
    const updatedAnswers: BuildingPlannerAnswers = {
      ...plannerAnswers,
      buildingType: newType,
    };
    setPlannerAnswers(updatedAnswers);
    const newPlan = buildBuildingPlan(
      updatedAnswers, 
      plannerWeatherData, 
      plannerHistoricalData, 
      inputs.assumptions || DEFAULT_ASSUMPTIONS
    );
    setGeneratedPlan(newPlan);
    showToast(`Updated comparison plan for ${newPlan.buildingProfile.name}!`);
  };

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-teal-500/20 selection:text-teal-900 bg-[#f8fafc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Background Animated Rain Motif */}
      <RaindropBackground intensity="light" />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md text-white font-medium text-xs sm:text-sm shadow-xl border border-slate-700/50 dark:border-slate-650 flex items-center gap-2 print:hidden"
          >
            <span role="img" aria-label="rain">🌧️</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          if (page === 'results' && !result) {
            const res = calculateHarvesting(inputs, unit, inputs.assumptions || DEFAULT_ASSUMPTIONS);
            setResult(res);
          }
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        hasResults={result !== null}
        currentUser={currentUser}
        onOpenAuth={() => {
          setAuthModalTitle(undefined);
          setAuthModalSubtitle(undefined);
          setShowAuthModal(true);
        }}
        onSignOut={handleSignOut}
        savedBuildingsCount={savedBuildings.length}
        onOpenTips={() => handleOpenTips()}
        onOpenTutorial={() => setShowTutorialModal(true)}
      />

      {/* Main Page View with Animated Transitions */}
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <HomePage
                onStartSmartPlanner={handleStartSmartPlanner}
                onStartCalculate={handleStartCalculate}
                onSelectPreset={handleSelectPreset}
                currentUser={currentUser}
                savedBuildings={savedBuildings}
                isLoadingBuildings={isLoadingBuildings}
                onSelectBuilding={handleSelectBuilding}
                onEditBuilding={(b) => setEditingBuilding(b)}
                onDeleteBuilding={handleDeleteBuilding}
                onNewBlankBuilding={handleNewBlankBuilding}
                onOpenTips={() => handleOpenTips()}
                onOpenTutorial={() => setShowTutorialModal(true)}
              />
            </motion.div>
          )}

          {currentPage === 'planner' && (
            <motion.div
              key="planner"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {plannerMode === 'wizard' || !generatedPlan ? (
                <SmartBuildingPlanner
                  onPlanGenerated={handlePlanGenerated}
                  initialAnswers={plannerAnswers || undefined}
                  assumptions={inputs.assumptions || DEFAULT_ASSUMPTIONS}
                  onOpenAssumptions={() => setShowAssumptionsModal(true)}
                  onBackToHome={() => {
                    setCurrentPage('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ) : (
                <BuildingPlanReport
                  plan={generatedPlan}
                  answers={plannerAnswers!}
                  weatherData={plannerWeatherData}
                  historicalData={plannerHistoricalData}
                  assumptions={inputs.assumptions || DEFAULT_ASSUMPTIONS}
                  onEditAnswers={handleEditPlannerAnswers}
                  onOpenAssumptions={() => setShowAssumptionsModal(true)}
                  onSwitchBuildingType={handleSwitchBuildingType}
                />
              )}
            </motion.div>
          )}

          {currentPage === 'calculator' && (
            <motion.div
              key="calculator"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <CalculatorPage
                inputs={inputs}
                onChange={(newInputs) => {
                  setInputs(newInputs);
                  const newResult = calculateHarvesting(newInputs, unit, newInputs.assumptions || DEFAULT_ASSUMPTIONS);
                  setResult(newResult);
                }}
                onCalculate={handlePerformCalculation}
                onBack={() => {
                  setCurrentPage('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                isCalculating={isCalculating}
                currentUser={currentUser}
                activeBuilding={activeBuilding}
                onOpenSaveModal={() => setShowSaveModal(true)}
                onClearActiveBuilding={() => setActiveBuilding(null)}
              />
            </motion.div>
          )}

          {currentPage === 'results' && (
            <motion.div
              key="results"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ResultsPage
                result={result || calculateHarvesting(inputs, unit, inputs.assumptions || DEFAULT_ASSUMPTIONS)}
                onAdjustInputs={() => {
                  setCurrentPage('calculator');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onReset={handleReset}
                onOpenTips={handleOpenTips}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* First Visit Modal for New Visitors */}
      <FirstVisitModal
        isOpen={showFirstVisitModal}
        onSignIn={handleFirstVisitSignIn}
        onContinueAsGuest={handleFirstVisitGuest}
      />

      {/* Tutorial Walkthrough Modal */}
      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        onStartPlanner={() => {
          setShowTutorialModal(false);
          setCurrentPage('calculator');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Auth Modal for Sign in / Sign up */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          showToast('Signed in successfully!');
        }}
        customTitle={authModalTitle}
        customSubtitle={authModalSubtitle}
      />

      {/* Save Building Modal */}
      {currentUser && (
        <SaveBuildingModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          currentUser={currentUser}
          inputs={inputs}
          existingBuilding={activeBuilding}
          onSavedSuccess={(saved) => {
            setShowSaveModal(false);
            refreshBuildings(currentUser.uid);
            setActiveBuilding(saved);
            showToast(`"${saved.nickname}" saved to your buildings list!`);
          }}
          onRequestSignIn={() => {
            setShowSaveModal(false);
            setShowAuthModal(true);
          }}
        />
      )}

      {/* Edit Building Modal */}
      {currentUser && editingBuilding && (
        <EditBuildingModal
          isOpen={editingBuilding !== null}
          onClose={() => setEditingBuilding(null)}
          building={editingBuilding}
          onUpdated={(updated) => {
            setEditingBuilding(null);
            refreshBuildings(currentUser.uid);
            showToast(`Building renamed to "${updated.nickname}"!`);
          }}
        />
      )}

      {/* Educational Tips Modal */}
      <TipsModal
        isOpen={isTipsOpen}
        onClose={() => setIsTipsOpen(false)}
        highlightTipId={selectedTipId}
      />

      {/* Assumptions Customization Modal */}
      <AssumptionsModal
        isOpen={showAssumptionsModal}
        onClose={() => setShowAssumptionsModal(false)}
        assumptions={inputs.assumptions || DEFAULT_ASSUMPTIONS}
        onSaveAssumptions={handleSaveAssumptions}
      />

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs print:hidden">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base" role="img" aria-label="water">💧</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">RainWise</span>
            <span>— Household Rainwater Planning Tool for India</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Open-Meteo Weather &amp; 3-Year Archive Data • Offline-ready client calculations
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppSettingsProvider>
      <RainWiseApp />
    </AppSettingsProvider>
  );
}
