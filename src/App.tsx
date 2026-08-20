import { useState } from 'react';
import { SimplifierTab } from './features/simplifier/SimplifierTab';
import { ArithmeticTab } from './features/arithmetic/ArithmeticTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simplifier' | 'arithmetic'>('simplifier');

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="bg-surface-900 text-white p-6 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span className="text-primary-500">⚡</span> LogicForge
            </h1>
            <p className="text-surface-400 mt-1 text-sm">Interactive Boolean Algebra & Digital Arithmetic Circuit Toolkit</p>
          </div>
          
          <div className="flex gap-2 bg-surface-800 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('simplifier')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'simplifier' ? 'bg-primary-600 text-white shadow' : 'text-surface-300 hover:text-white hover:bg-surface-700'}`}
            >
              Boolean Simplifier
            </button>
            <button 
              onClick={() => setActiveTab('arithmetic')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'arithmetic' ? 'bg-primary-600 text-white shadow' : 'text-surface-300 hover:text-white hover:bg-surface-700'}`}
            >
              Arithmetic Lab
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 bg-surface-50 p-2 md:p-6">
        {activeTab === 'simplifier' ? <SimplifierTab /> : <ArithmeticTab />}
      </main>
    </div>
  );
}
