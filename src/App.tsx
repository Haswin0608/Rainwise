import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { 
  CalculatorInputs, 
  CalculationResult, 
  PageView, 
  AuthUser, 
  SavedBuilding, 
  BuildingDraft,
  BuildingTypeKey,
  PlanningAssumptions
} from './types';
import { 
  calculateHarvesting, 
  calcWaterSummary,
  DEFAULT_ASSUMPTIONS, 
  DEFAULT_INPUTS, 
  normalizeRoofs, 
  normalizeTanks 
} from './utils/calculations';
import { 
  loadSavedBuildings, 
  saveBuildingToStorage, 
  deleteBuildingFromStorage, 
  duplicateBuildingInStorage,
  saveUnfinishedDraft,
  loadUnfinishedDraft,
  clearUnfinishedDraft,
  persistBuildings,
  UnfinishedDraftState
} from './utils/buildingStorage';
import { RaindropBackground } from './components/RaindropBackground';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { Stage1Setup } from './components/Stage1Setup';
import { Stage2Calculate } from './components/Stage2Calculate';
import { Stage3SaveModal } from './components/Stage3SaveModal';
import { Stage4Result } from './components/Stage4Result';
import { MyBuildingsPage } from './components/MyBuildingsPage';
import { ResultsPage } from './components/ResultsPage';
import { FirstVisitModal } from './components/FirstVisitModal';
import { TutorialModal } from './components/TutorialModal';
import { AuthModal } from './components/AuthModal';
import { TipsModal } from './components/TipsModal';
import { AppSettingsProvider, useAppSettings } from './context/AppSettingsContext';
import { subscribeToAuth, logoutUser, saveUserBuilding, getUserBuildings, deleteUserBuilding } from './lib/firebase';

const INITIAL_DRAFT: BuildingDraft = {
  name: '',
  buildingTypeKey: 'house',
  customTypeName: '',
  isEditingExisting: false,
};

function RainWiseApp() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const { unit, setPeriod } = useAppSettings();

  // Active Draft State
  const [draft, setDraft] = useState<BuildingDraft>(INITIAL_DRAFT);
  const [activeBuildingId, setActiveBuildingId] = useState<string | null>(null);

  // Unfinished Draft detected on load
  const [unfinishedDraft, setUnfinishedDraft] = useState<UnfinishedDraftState | null>(() => {
    return loadUnfinishedDraft();
  });

  // Inputs State for active calculation
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS);

  // Saved Buildings List
  const [savedBuildings, setSavedBuildings] = useState<SavedBuilding[]>(() => {
    return loadSavedBuildings();
  });
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);

  // Save result state for Stage 4
  const [saveSuccess, setSaveSuccess] = useState(true);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);

  // Auth State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Modals
  const [showFirstVisitModal, setShowFirstVisitModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isTipsOpen, setIsTipsOpen] = useState(false);
  const [selectedTipId, setSelectedTipId] = useState<string | undefined>(undefined);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Autosave draft into memory/storage during Stage 1 and Stage 2
  useEffect(() => {
    if ((currentPage === 'stage1_setup' || currentPage === 'stage2_calculate') && draft.name.trim().length > 0) {
      saveUnfinishedDraft({
        stage: currentPage,
        draftInfo: draft,
        inputs,
        timestamp: Date.now(),
      });
      setUnfinishedDraft(null);
    }
  }, [currentPage, draft, inputs]);

  // Sync with Firebase when logged in
  const refreshBuildings = useCallback(async (uid: string) => {
    setIsLoadingBuildings(true);
    try {
      const fbBuildings = await getUserBuildings(uid);
      if (fbBuildings.length > 0) {
        setSavedBuildings(fbBuildings);
        persistBuildings(fbBuildings);
      } else {
        // Fallback to local
        const local = loadSavedBuildings();
        setSavedBuildings(local);
      }
    } catch (err) {
      console.error('Error fetching buildings from Firebase, using local storage:', err);
      setSavedBuildings(loadSavedBuildings());
    } finally {
      setIsLoadingBuildings(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user) {
        localStorage.setItem('rainwise_visited', 'true');
        setShowFirstVisitModal(false);
        refreshBuildings(user.uid);
      }
    });
    return () => unsubscribe();
  }, [refreshBuildings]);

  // Check first-visit state
  useEffect(() => {
    const hasVisited = localStorage.getItem('rainwise_visited');
    if (!hasVisited && !currentUser) {
      setShowFirstVisitModal(true);
    }
  }, [currentUser]);

  // ══════════════════════════════════════════════════════════════════════
  // CORE FUNCTIONS
  // ══════════════════════════════════════════════════════════════════════

  /**
   * Starts a brand new building draft and navigates to Stage 1 Setup
   */
  const startNewBuilding = (initialType: BuildingTypeKey = 'house', initialName: string = '') => {
    clearUnfinishedDraft();
    setUnfinishedDraft(null);
    setActiveBuildingId(null);
    setDraft({
      name: initialName,
      buildingTypeKey: initialType,
      customTypeName: '',
      isEditingExisting: false,
    });
    setInputs(DEFAULT_INPUTS);
    setCurrentPage('stage1_setup');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Saves the current building draft to storage and advances to Stage 4 Result
   */
  const saveBuilding = async () => {
    try {
      const now = new Date().toISOString();
      const monthlyRainfallMm = inputs.typicalMonthlyRainfallMm || inputs.historicalRainfall?.typicalMonthlyRainfallMm || inputs.weatherInfo?.historical?.typicalMonthlyRainfallMm;
      const weeklyRainfallMm = inputs.weeklyRainfallMm ?? inputs.weatherInfo?.weeklyRainfallMm ?? inputs.weatherInfo?.fullWeather?.weeklyPrecipitationSumMm ?? 0;
      const computedSummary = calcWaterSummary(inputs, unit, inputs.assumptions || DEFAULT_ASSUMPTIONS);

      const newBuilding: SavedBuilding = {
        id: draft.id || `bldg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: draft.name.trim(),
        buildingTypeKey: draft.buildingTypeKey,
        customTypeName: draft.customTypeName?.trim(),
        location: inputs.locationName ? {
          name: inputs.locationName,
          latitude: inputs.latitude,
          longitude: inputs.longitude,
        } : undefined,
        roofs: normalizeRoofs(inputs.roofs, inputs.directRoofArea, inputs.roofType),
        tanks: normalizeTanks(inputs.tanks, inputs.tankCapacity, inputs.noTankYet).tanks,
        noTankYet: inputs.noTankYet,
        people: parseInt(inputs.householdSize || '4', 10) || 4,
        householdDailyLPerPerson: (inputs.assumptions?.demands.toilet ?? 30) + (inputs.assumptions?.demands.cleaning ?? 10),
        createdAt: now,
        updatedAt: now,
        version: 2,
        monthlyRainfallMm,
        weeklyRainfallMm,
        rainfallFetchedAt: now,
        summarySnapshot: {
          calculatedAt: now,
          summary: computedSummary,
        },
        nickname: draft.name.trim(),
        locationLabel: inputs.locationName,
      };

      // 1. Write to local storage with read-back verification
      const res = saveBuildingToStorage(newBuilding);
      if (!res.success) {
        throw new Error(res.error || 'Failed to verify write to local storage');
      }

      // 2. Sync to Firebase if logged in
      if (currentUser) {
        try {
          await saveUserBuilding(currentUser.uid, newBuilding);
        } catch (fbErr) {
          console.error('Firebase sync warning:', fbErr);
        }
      }

      // 3. Update state & clear draft
      setSavedBuildings(loadSavedBuildings());
      clearUnfinishedDraft();
      setUnfinishedDraft(null);
      setSaveSuccess(true);
      setSaveError(undefined);
      setCurrentPage('stage4_result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`✅ Saved "${newBuilding.name}" to My Buildings!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Storage write failed';
      console.error('Save building failed:', msg);
      setSaveSuccess(false);
      setSaveError(msg);
      setCurrentPage('stage4_result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Updates an existing building in storage
   */
  const updateBuilding = async () => {
    if (!activeBuildingId) {
      return saveBuilding();
    }

    try {
      const existing = savedBuildings.find((b) => b.id === activeBuildingId);
      const now = new Date().toISOString();
      const monthlyRainfallMm = inputs.typicalMonthlyRainfallMm || inputs.historicalRainfall?.typicalMonthlyRainfallMm || inputs.weatherInfo?.historical?.typicalMonthlyRainfallMm || existing?.monthlyRainfallMm;
      const weeklyRainfallMm = inputs.weeklyRainfallMm ?? inputs.weatherInfo?.weeklyRainfallMm ?? inputs.weatherInfo?.fullWeather?.weeklyPrecipitationSumMm ?? existing?.weeklyRainfallMm ?? 0;
      const computedSummary = calcWaterSummary(inputs, unit, inputs.assumptions || DEFAULT_ASSUMPTIONS);

      const updated: SavedBuilding = {
        id: activeBuildingId,
        name: draft.name.trim(),
        buildingTypeKey: draft.buildingTypeKey,
        customTypeName: draft.customTypeName?.trim(),
        location: inputs.locationName ? {
          name: inputs.locationName,
          latitude: inputs.latitude,
          longitude: inputs.longitude,
        } : undefined,
        roofs: normalizeRoofs(inputs.roofs, inputs.directRoofArea, inputs.roofType),
        tanks: normalizeTanks(inputs.tanks, inputs.tankCapacity, inputs.noTankYet).tanks,
        noTankYet: inputs.noTankYet,
        people: parseInt(inputs.householdSize || '4', 10) || 4,
        householdDailyLPerPerson: (inputs.assumptions?.demands.toilet ?? 30) + (inputs.assumptions?.demands.cleaning ?? 10),
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        version: 2,
        monthlyRainfallMm,
        weeklyRainfallMm,
        rainfallFetchedAt: now,
        summarySnapshot: {
          calculatedAt: now,
          summary: computedSummary,
        },
        nickname: draft.name.trim(),
        locationLabel: inputs.locationName,
      };

      const res = saveBuildingToStorage(updated);
      if (!res.success) {
        throw new Error(res.error || 'Failed to update local storage');
      }

      if (currentUser) {
        try {
          await saveUserBuilding(currentUser.uid, updated);
        } catch (fbErr) {
          console.error('Firebase update warning:', fbErr);
        }
      }

      setSavedBuildings(loadSavedBuildings());
      clearUnfinishedDraft();
      setUnfinishedDraft(null);
      setSaveSuccess(true);
      setSaveError(undefined);
      setCurrentPage('stage4_result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast(`✅ Updated "${updated.name}" successfully!`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Update failed';
      setSaveSuccess(false);
      setSaveError(msg);
      setCurrentPage('stage4_result');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /**
   * Saves as a new copy (cloned)
   */
  const saveAsNewCopy = async () => {
    const clonedDraft = {
      ...draft,
      id: undefined,
      name: `${draft.name.trim()} (Copy)`,
      isEditingExisting: false,
    };
    setDraft(clonedDraft);
    setActiveBuildingId(null);
    await saveBuilding();
  };

  /**
   * Discards the active draft and returns to Home
   */
  const discardDraft = () => {
    clearUnfinishedDraft();
    setUnfinishedDraft(null);
    setDraft(INITIAL_DRAFT);
    setActiveBuildingId(null);
    setInputs(DEFAULT_INPUTS);
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Calculation discarded.');
  };

  /**
   * Builds calculation results dynamically
   */
  const buildResults = (): CalculationResult => {
    return calculateHarvesting(inputs, unit, inputs.assumptions || DEFAULT_ASSUMPTIONS);
  };

  /**
   * Loads a building for open / calculation review (defaults period to 'week')
   */
  const openBuilding = (building: SavedBuilding) => {
    setActiveBuildingId(building.id);
    setDraft({
      id: building.id,
      name: building.name,
      buildingTypeKey: building.buildingTypeKey,
      customTypeName: building.customTypeName,
      isEditingExisting: true,
    });

    const normalizedRoofs = normalizeRoofs(building.roofs, building.directRoofArea, building.roofType);
    const { tanks: normalizedTanks, noTankYet } = normalizeTanks(building.tanks, building.tankCapacity, building.noTankYet);

    setInputs((prev) => ({
      ...prev,
      roofs: normalizedRoofs,
      tanks: normalizedTanks,
      noTankYet,
      householdSize: String(building.people || 4),
      locationName: building.location?.name || building.locationLabel || prev.locationName,
      latitude: building.location?.latitude || prev.latitude,
      longitude: building.location?.longitude || prev.longitude,
    }));

    setPeriod('week');
    setCurrentPage('stage2_calculate');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded "${building.name}" with live weather data!`);
  };

  /**
   * Opens building for edit mode
   */
  const editBuilding = (building: SavedBuilding) => {
    openBuilding(building);
  };

  /**
   * Duplicates a building in storage
   */
  const duplicateBuilding = (buildingId: string) => {
    const res = duplicateBuildingInStorage(buildingId);
    if (res.success && res.newBuilding) {
      setSavedBuildings(loadSavedBuildings());
      showToast(`Duplicated as "${res.newBuilding.name}"`);
    }
  };

  /**
   * Deletes a building
   */
  const deleteBuilding = async (buildingId: string) => {
    deleteBuildingFromStorage(buildingId);
    if (currentUser) {
      try {
        await deleteUserBuilding(currentUser.uid, buildingId);
      } catch (e) {
        // ignore
      }
    }
    setSavedBuildings(loadSavedBuildings());
  };

  /**
   * Restores a deleted building on undo
   */
  const restoreBuilding = (building: SavedBuilding) => {
    saveBuildingToStorage(building);
    setSavedBuildings(loadSavedBuildings());
    showToast(`Restored "${building.name}"`);
  };

  /**
   * Imports buildings from backup JSON
   */
  const importBuildings = (importedList: SavedBuilding[]) => {
    const current = loadSavedBuildings();
    const merged = [...importedList, ...current];
    persistBuildings(merged);
    setSavedBuildings(loadSavedBuildings());
    showToast(`Imported ${importedList.length} buildings from backup!`);
  };

  /**
   * Resumes an unfinished draft from localStorage
   */
  const continueUnfinishedDraft = () => {
    if (!unfinishedDraft) return;
    setDraft(unfinishedDraft.draftInfo);
    if (unfinishedDraft.inputs) {
      setInputs(unfinishedDraft.inputs);
    }
    setCurrentPage(unfinishedDraft.stage || 'stage2_calculate');
    setUnfinishedDraft(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Resumed "${unfinishedDraft.draftInfo.name}"!`);
  };

  const handleOpenTips = (tipId?: string) => {
    setSelectedTipId(tipId);
    setIsTipsOpen(true);
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      showToast('Signed out successfully. Guest mode active.');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Page Transitions
  const pageVariants: Variants = {
    initial: { opacity: 0, y: 8 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0, 
      transition: { duration: 0.15, ease: 'easeIn' }
    },
  };

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-teal-500/20 selection:text-teal-300 bg-[#0b1120] text-slate-100 transition-colors duration-200">
      {/* Background Rain Animation */}
      <RaindropBackground intensity="light" />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white font-semibold text-xs sm:text-sm shadow-xl border border-teal-500/40 flex items-center gap-2 print:hidden"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onStartNewBuilding={() => startNewBuilding()}
        onOpenMyBuildings={() => {
          setCurrentPage('my_buildings');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onSignOut={handleSignOut}
        savedBuildingsCount={savedBuildings.length}
        onOpenTips={() => handleOpenTips()}
        onOpenTutorial={() => setShowTutorialModal(true)}
      />

      {/* Main App Stage Container */}
      <main className="flex-1 relative z-10 pb-16">
        <AnimatePresence mode="wait">
          
          {/* ───────── HOME SCREEN ───────── */}
          {currentPage === 'home' && (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <HomePage
                onCreateNewBuilding={() => startNewBuilding()}
                onOpenMyBuildings={() => {
                  setCurrentPage('my_buildings');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                savedBuildingsCount={savedBuildings.length}
                unfinishedDraft={unfinishedDraft}
                onContinueDraft={continueUnfinishedDraft}
                onDiscardDraft={() => {
                  clearUnfinishedDraft();
                  setUnfinishedDraft(null);
                  showToast('Draft cleared.');
                }}
                onOpenTips={() => handleOpenTips()}
                onOpenTutorial={() => setShowTutorialModal(true)}
              />
            </motion.div>
          )}

          {/* ───────── STAGE 1: SETUP ───────── */}
          {currentPage === 'stage1_setup' && (
            <motion.div
              key="stage1_setup"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Stage1Setup
                draft={draft}
                onUpdateDraft={(updated) => setDraft((prev) => ({ ...prev, ...updated }))}
                onContinue={() => {
                  setCurrentPage('stage2_calculate');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onCancel={() => {
                  discardDraft();
                }}
                isEditingExisting={draft.isEditingExisting}
              />
            </motion.div>
          )}

          {/* ───────── STAGE 2: CALCULATION ───────── */}
          {currentPage === 'stage2_calculate' && (
            <motion.div
              key="stage2_calculate"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Stage2Calculate
                draft={draft}
                inputs={inputs}
                onChange={setInputs}
                onBackToStage1={() => {
                  setCurrentPage('stage1_setup');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onFinish={() => {
                  setCurrentPage('stage3_save');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenTips={handleOpenTips}
                isEditingExisting={draft.isEditingExisting}
              />
            </motion.div>
          )}

          {/* ───────── STAGE 3: REVIEW & SAVE ───────── */}
          {currentPage === 'stage3_save' && (
            <motion.div
              key="stage3_save"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Stage3SaveModal
                draft={draft}
                inputs={inputs}
                onSave={saveBuilding}
                onUpdate={updateBuilding}
                onSaveAsCopy={saveAsNewCopy}
                onDiscard={discardDraft}
                onKeepEditing={() => {
                  setCurrentPage('stage2_calculate');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                isEditingExisting={draft.isEditingExisting}
              />
            </motion.div>
          )}

          {/* ───────── STAGE 4: RESULT ───────── */}
          {currentPage === 'stage4_result' && (
            <motion.div
              key="stage4_result"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <Stage4Result
                draft={draft}
                saveSuccess={saveSuccess}
                saveError={saveError}
                onViewMyBuildings={() => {
                  setCurrentPage('my_buildings');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onCreateAnother={() => startNewBuilding()}
                onViewCalculation={() => {
                  setCurrentPage('stage2_calculate');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onRetrySave={saveBuilding}
                isUpdate={draft.isEditingExisting}
              />
            </motion.div>
          )}

          {/* ───────── MY BUILDINGS ───────── */}
          {currentPage === 'my_buildings' && (
            <motion.div
              key="my_buildings"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <MyBuildingsPage
                buildings={savedBuildings}
                onOpenBuilding={openBuilding}
                onEditBuilding={editBuilding}
                onDuplicateBuilding={duplicateBuilding}
                onDeleteBuilding={deleteBuilding}
                onRestoreBuilding={restoreBuilding}
                onCreateNewBuilding={() => startNewBuilding()}
                onImportBuildings={importBuildings}
                onUpdateBuilding={() => setSavedBuildings(loadSavedBuildings())}
                onBackToHome={() => {
                  setCurrentPage('home');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* First Visit Modal for New Visitors */}
      <FirstVisitModal
        isOpen={showFirstVisitModal}
        onSignIn={() => {
          localStorage.setItem('rainwise_visited', 'true');
          setShowFirstVisitModal(false);
          setShowAuthModal(true);
        }}
        onContinueAsGuest={() => {
          localStorage.setItem('rainwise_visited', 'true');
          setShowFirstVisitModal(false);
          showToast('Continuing in browser. You can save buildings anytime!');
        }}
      />

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        onStartPlanner={() => {
          setShowTutorialModal(false);
          startNewBuilding();
        }}
      />

      {/* Practical Tips Modal */}
      <TipsModal
        isOpen={isTipsOpen}
        onClose={() => setIsTipsOpen(false)}
        highlightTipId={selectedTipId}
      />

      {/* Firebase Sign In / Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          setShowAuthModal(false);
          showToast(`Welcome, ${user.displayName || user.email || 'Friend'}!`);
          refreshBuildings(user.uid);
        }}
      />
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
