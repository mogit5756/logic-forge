import { useState, useEffect } from 'react';
import { SimplifierTab } from './features/simplifier/SimplifierTab';
import { ArithmeticTab } from './features/arithmetic/ArithmeticTab';
import { parseUrlState } from './utils/urlState';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simplifier' | 'arithmetic'>('simplifier');

  useEffect(() => {
    const state = parseUrlState();
    if (state) {
      if (state.tab === 'arithmetic' || state.lab) {
        setActiveTab('arithmetic');
      } else if (state.tab === 'simplifier' || state.expr || state.min || state.mode) {
        setActiveTab('simplifier');
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-100/60">
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50 backdrop-blur-md bg-slate-900/95 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white text-lg font-bold">⚡</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">LogicForge</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v2.0
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">
                Boolean Algebra Simplification & Digital Arithmetic Circuits
              </p>
            </div>
          </div>
          
          <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 shadow-inner">
            <button 
              onClick={() => setActiveTab('simplifier')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'simplifier' 
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900 font-bold' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              Boolean Simplifier & K-Map
            </button>
            <button 
              onClick={() => setActiveTab('arithmetic')}
              className={`px-5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'arithmetic' 
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900 font-bold' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              Arithmetic Circuits Lab
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 py-6 px-3 sm:px-6">
        {activeTab === 'simplifier' ? <SimplifierTab /> : <ArithmeticTab />}
      </main>
    </div>
  );
}

