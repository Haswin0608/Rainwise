import React, { useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { CalculatorInputs, CalculationResult, PageView, PresetScenario } from './types';
import { calculateHarvesting } from './utils/calculations';
import { RaindropBackground } from './components/RaindropBackground';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { CalculatorPage } from './components/CalculatorPage';
import { ResultsPage } from './components/ResultsPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageView>('home');
  const [inputs, setInputs] = useState<CalculatorInputs>({
    roofs: [
      { id: '1', name: 'Roof 1', length: '15', width: '10' },
    ],
    rainfall: '60',
    efficiency: '80',
    tankCapacity: '5000',
    dailyRequirement: '250',
  });
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Transition variants (~250ms simple fade)
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
    setInputs(preset.inputs);
    // Directly calculate and show results or open calculator
    const res = calculateHarvesting(preset.inputs);
    setResult(res);
    setCurrentPage('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePerformCalculation = () => {
    setIsCalculating(true);
    // Micro-interaction: brief simulated fluid dynamic computation animation
    setTimeout(() => {
      const computedResult = calculateHarvesting(inputs);
      setResult(computedResult);
      setIsCalculating(false);
      setCurrentPage('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 450);
  };

  const handleReset = () => {
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
    <div className="min-h-screen flex flex-col relative selection:bg-teal-500/20 selection:text-teal-900 bg-[#f8fafc]">
      {/* Background Animated Rain Motif */}
      <RaindropBackground intensity="light" />

      {/* Navigation Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={(page) => {
          if (page === 'results' && !result) {
            // calculate with current inputs if results not yet computed
            const res = calculateHarvesting(inputs);
            setResult(res);
          }
          setCurrentPage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        hasResults={result !== null}
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
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 bg-white/80 py-5 mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 font-['Outfit',sans-serif]">RainWise</span>
            <span>•</span>
            <span>Helping farmers and households save rainwater</span>
          </div>
          <div className="flex items-center gap-3">
            <span>1mm rain on 1m² = 1 litre</span>
            <span>•</span>
            <span className="text-teal-800 font-medium">No login required</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
