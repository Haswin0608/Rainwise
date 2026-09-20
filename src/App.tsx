import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { CalculatorInputs, CalculationResult, PageView, PresetScenario, AuthUser, SavedBuilding } from './types';
import { calculateHarvesting } from './utils/calculations';
import { RaindropBackground } from './components/RaindropBackground';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { CalculatorPage } from './components/CalculatorPage';
import { ResultsPage } from './components/ResultsPage';
import { FirstVisitModal } from './components/FirstVisitModal';
import { AuthModal } from './components/AuthModal';
import { SaveBuildingModal } from './components/SaveBuildingModal';
import { EditBuildingModal } from './components/EditBuildingModal';
import { TipsModal } from './components/TipsModal';
import { AppSettingsProvider, useAppSettings } from './context/AppSettingsContext';
import { subscribeToAuth, logoutUser, getUserBuildings, deleteUserBuilding } from './lib/firebase';

function RainWiseApp() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const { unit } = useAppSettings();

  const [inputs, setInputs] = useState<CalculatorInputs>({
    roofs: [
      { id: '1', name: 'Roof 1', length: '15', width: '10' },
    ],
    rainfall: '50',
    efficiency: '80',
    tankCapacity: '5000',
    dailyRequirement: '200',
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Auth & Saved Buildings State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [savedBuildings, setSavedBuildings] = useState<SavedBuilding[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(false);
  const [activeBuilding, setActiveBuilding] = useState<SavedBuilding | null>(null);

  // Modals
  const [showFirstVisitModal, setShowFirstVisitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
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

  // Toast notification for user confirmation (e.g., "Saved!", "Loaded Grandpa's Farm")
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 4000);
  };

  // Re-calculate results whenever unit changes if a result is already on screen
  useEffect(() => {
    if (result) {
      const recomputed = calculateHarvesting(inputs, unit);
      setResult(recomputed);
    }
  }, [unit]);

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
    showToast('Continuing as Guest. Calculations work fully without an account!');
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
    setInputs({
      roofs: building.roofs && building.roofs.length > 0 ? building.roofs : [{ id: '1', name: 'Roof 1', length: '10', width: '10' }],
      rainfall: '',
      efficiency: building.efficiency || '80',
      tankCapacity: building.tankCapacity || '1000',
      dailyRequirement: building.dailyRequirement || '',
    });
    setResult(null);
    setCurrentPage('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Loaded "${building.nickname}"! Just enter today's rainfall to calculate.`);
  };

  // "+ Calculate a New Building"
  const handleNewBlankBuilding = () => {
    setActiveBuilding(null);
    setInputs({
      roofs: [{ id: '1', name: 'Roof 1', length: '', width: '' }],
      rainfall: '',
      efficiency: '80',
      tankCapacity: '',
      dailyRequirement: '',
    });
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
        duration: 0.25, 
        ease: 'easeInOut',
      }
    },
    exit: { 
      opacity: 0, 
      transition: { 
        duration: 0.2, 
        ease: 'easeInOut',
      }
    },
  };

  const handleStartCalculate = () => {
    setCurrentPage('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPreset = (preset: PresetScenario) => {
    setActiveBuilding(null);
    setInputs(preset.inputs);
    const res = calculateHarvesting(preset.inputs, unit);
    setResult(res);
    setCurrentPage('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePerformCalculation = () => {
    setIsCalculating(true);
    setTimeout(() => {
      const computedResult = calculateHarvesting(inputs, unit);
      setResult(computedResult);
      setIsCalculating(false);
      setCurrentPage('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 450);
  };

  const handleReset = () => {
    setActiveBuilding(null);
    setInputs({
      roofs: [
        { id: '1', name: 'Roof 1', length: '', width: '' },
      ],
      rainfall: '',
      efficiency: '80',
      tankCapacity: '',
      dailyRequirement: '',
    });
    setResult(null);
    setCurrentPage('calculator');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md text-white font-medium text-xs sm:text-sm shadow-xl border border-slate-700/50 dark:border-slate-650 flex items-center gap-2"
          >
            <span>🌧️</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          if (page === 'results' && !result) {
            const res = calculateHarvesting(inputs, unit);
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
              />
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
                onChange={setInputs}
                onCalculate={handlePerformCalculation}
                onBack={() => setCurrentPage('home')}
                isCalculating={isCalculating}
                currentUser={currentUser}
                activeBuilding={activeBuilding}
                onOpenSaveModal={() => setShowSaveModal(true)}
                onClearActiveBuilding={() => setActiveBuilding(null)}
              />
            </motion.div>
          )}

          {currentPage === 'results' && result && (
            <motion.div
              key="results"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <ResultsPage
                result={result}
                onAdjustInputs={() => setCurrentPage('calculator')}
                onReset={handleReset}
                onOpenTips={(tipId) => handleOpenTips(tipId)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modals */}
      {/* 1. First Visit Modal */}
      <FirstVisitModal
        isOpen={showFirstVisitModal}
        onSignIn={handleFirstVisitSignIn}
        onContinueAsGuest={handleFirstVisitGuest}
      />

      {/* 2. Authentication Modal (Sign In / Sign Up) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        customTitle={authModalTitle}
        customSubtitle={authModalSubtitle}
        onSuccess={(user) => {
          showToast(`Welcome ${user.displayName || user.email}!`);
          if (currentUser) refreshBuildings(user.uid);
        }}
        onContinueAsGuest={() => {
          showToast('Continuing as guest.');
        }}
      />

      {/* 3. Save Building Modal */}
      <SaveBuildingModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        currentUser={currentUser}
        inputs={inputs}
        existingBuilding={activeBuilding}
        onSavedSuccess={(saved) => {
          setActiveBuilding(saved);
          if (currentUser) refreshBuildings(currentUser.uid);
          showToast(`"${saved.nickname}" saved successfully!`);
        }}
        onRequestSignIn={() => {
          setAuthModalTitle('Sign Up to Save Buildings');
          setAuthModalSubtitle('Create a free account or sign in so you never have to re-enter your roof sizes.');
          setShowAuthModal(true);
        }}
      />

      {/* 4. Edit Building Modal */}
      <EditBuildingModal
        isOpen={Boolean(editingBuilding)}
        onClose={() => setEditingBuilding(null)}
        building={editingBuilding}
        onUpdated={(updated) => {
          if (activeBuilding?.id === updated.id) {
            setActiveBuilding(updated);
          }
          if (currentUser) refreshBuildings(currentUser.uid);
          showToast(`"${updated.nickname}" updated!`);
        }}
      />

      {/* 5. Rainwater Practical Tips Modal */}
      <TipsModal
        isOpen={isTipsOpen}
        onClose={() => setIsTipsOpen(false)}
        highlightTipId={selectedTipId}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs py-5 mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-white font-['Outfit',sans-serif]">RainWise</span>
            <span>•</span>
            <span>Helping farmers and households save rainwater</span>
          </div>
          <div className="flex items-center gap-3">
            <span>{unit === 'imperial' ? '1 in rain on 1,000 sq ft ≈ 623 gallons' : '1mm rain on 1m² = 1 litre'}</span>
            <span>•</span>
            <span className="text-teal-800 dark:text-teal-400 font-medium">
              {currentUser ? `Signed in as ${currentUser.displayName || currentUser.email}` : 'Guest mode (no login required)'}
            </span>
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
