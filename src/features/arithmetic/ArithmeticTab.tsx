import React, { useState, useEffect, useRef } from 'react';
import { 
  HalfAdderCircuit, FullAdderCircuit, 
  HalfSubtractorCircuit, FullSubtractorCircuit,
  buildRippleCarryAdder, buildTwosComplementSubtractor, buildMultiplier
} from './predefinedCircuits';
import { CircuitCanvas } from '../../components/circuit/CircuitCanvas';
import { ArithmeticExplanation } from './ArithmeticExplanation';
import { evaluateCircuitAllNodes } from '../../engine/simulator/simulator';
import { assignLayers } from '../../engine/layout/layering';
import { updateUrlParams, parseUrlState } from '../../utils/urlState';
import type { Circuit } from '../../engine/types';

type LabId = 'half-adder' | 'full-adder' | 'ripple-adder' | 'half-sub' | 'full-sub' | 'twos-sub' | 'mult-2x2' | 'mult-3x3';

const LABS: { id: LabId; name: string; category: string; hasWidth: boolean; defaultWidth?: number }[] = [
  { id: 'half-adder', name: 'Half Adder', category: 'Adders', hasWidth: false },
  { id: 'full-adder', name: 'Full Adder', category: 'Adders', hasWidth: false },
  { id: 'ripple-adder', name: 'N-bit Ripple-Carry Adder', category: 'Adders', hasWidth: true, defaultWidth: 4 },
  { id: 'half-sub', name: 'Half Subtractor', category: 'Subtractors', hasWidth: false },
  { id: 'full-sub', name: 'Full Subtractor', category: 'Subtractors', hasWidth: false },
  { id: 'twos-sub', name: "N-bit 2's Complement Subtractor", category: 'Subtractors', hasWidth: true, defaultWidth: 4 },
  { id: 'mult-2x2', name: '2x2 Binary Multiplier', category: 'Multipliers', hasWidth: false },
  { id: 'mult-3x3', name: '3x3 Binary Multiplier', category: 'Multipliers', hasWidth: false },
];

interface ArithmeticPreset {
  name: string;
  category: string;
  labId: LabId;
  w?: number;
  a: number;
  b: number;
  cin?: number;
}

export const ArithmeticTab: React.FC = () => {
  const [activeLab, setActiveLab] = useState(LABS[0]);
  const [bitWidth, setBitWidth] = useState(4);
  const [inputA, setInputA] = useState(0);
  const [inputB, setInputB] = useState(0);
  const [carryIn, setCarryIn] = useState(0);
  const [showNoBorrowMode, setShowNoBorrowMode] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const [circuit, setCircuit] = useState<Circuit>(HalfAdderCircuit);
  const [finalNodeValues, setFinalNodeValues] = useState<Record<string, 0 | 1>>({});
  
  // Animation State
  const [timeline, setTimeline] = useState<Record<string, 0 | 1>[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(500); // 1000/500/200
  const timerRef = useRef<any>(null);

  const getBitsA = () => {
    if (activeLab.id.includes('mult-2x2')) return 2;
    if (activeLab.id.includes('mult-3x3')) return 3;
    if (activeLab.hasWidth) return bitWidth;
    return 1;
  };
  
  const getBitsB = () => getBitsA();
  const maxValA = (1 << getBitsA()) - 1;
  const maxValB = (1 << getBitsB()) - 1;

  const hasCarryIn = activeLab.id === 'full-adder' || activeLab.id === 'full-sub' || activeLab.id === 'ripple-adder';

  // Load from URL on mount
  useEffect(() => {
    const state = parseUrlState();
    if (state && (state.tab === 'arithmetic' || state.lab)) {
      if (state.lab) {
        const found = LABS.find(l => l.id === state.lab);
        if (found) setActiveLab(found);
      }
      if (state.w) setBitWidth(state.w);
      if (state.a !== undefined) setInputA(state.a);
      if (state.b !== undefined) setInputB(state.b);
      if (state.cin !== undefined) setCarryIn(state.cin);
    }
  }, []);

  // Sync to URL
  useEffect(() => {
    updateUrlParams({
      tab: 'arithmetic',
      lab: activeLab.id,
      w: activeLab.hasWidth ? bitWidth : undefined,
      a: inputA,
      b: inputB,
      cin: hasCarryIn ? carryIn : undefined
    });
  }, [activeLab.id, bitWidth, inputA, inputB, carryIn]);

  useEffect(() => {
    let c: Circuit;
    if (activeLab.id === 'half-adder') c = HalfAdderCircuit;
    else if (activeLab.id === 'full-adder') c = FullAdderCircuit;
    else if (activeLab.id === 'ripple-adder') c = buildRippleCarryAdder(bitWidth);
    else if (activeLab.id === 'half-sub') c = HalfSubtractorCircuit;
    else if (activeLab.id === 'full-sub') c = FullSubtractorCircuit;
    else if (activeLab.id === 'twos-sub') c = buildTwosComplementSubtractor(bitWidth);
    else if (activeLab.id === 'mult-2x2') c = buildMultiplier(2, 2);
    else if (activeLab.id === 'mult-3x3') c = buildMultiplier(3, 3);
    else c = HalfAdderCircuit;
    
    if (activeLab.id.includes('mult') || activeLab.id === 'twos-sub' || activeLab.id === 'ripple-adder') {
       assignLayers(c);
    }

    setCircuit(c);
    setIsPlaying(false);
    setCurrentStep(0);
  }, [activeLab, bitWidth]);

  useEffect(() => {
    const inputs: Record<string, 0 | 1> = {};
    const bA = getBitsA();
    const bB = getBitsB();
    
    if (bA === 1) {
      inputs['A'] = (inputA & 1) as 0 | 1;
      inputs['B'] = (inputB & 1) as 0 | 1;
    } else {
      for (let i = 0; i < bA; i++) inputs[`A${i}`] = ((inputA >> i) & 1) as 0 | 1;
      for (let i = 0; i < bB; i++) inputs[`B${i}`] = ((inputB >> i) & 1) as 0 | 1;
    }

    if (activeLab.id === 'full-adder' || activeLab.id === 'ripple-adder') {
      inputs['CIN'] = (carryIn & 1) as 0 | 1;
    } else if (activeLab.id === 'full-sub') {
      inputs['BIN'] = (carryIn & 1) as 0 | 1;
    }

    try {
      const vals = evaluateCircuitAllNodes(circuit, inputs);
      setFinalNodeValues(vals);
      
      const depthMap: Record<string, number> = {};
      const depths: Record<string, 0 | 1>[] = [];
      
      let maxDepth = 0;
      Object.keys(circuit.nodes).forEach(nid => {
         const node = circuit.nodes[nid];
         depthMap[nid] = (node.type === 'INPUT' || node.type === 'CONSTANT') ? 0 : -1;
      });
      
      let changed = true;
      while(changed) {
         changed = false;
         Object.keys(circuit.nodes).forEach(nid => {
             if (depthMap[nid] !== -1) return;
             const node = circuit.nodes[nid];
             if (node.inputs.every(i => depthMap[i] !== -1)) {
                 depthMap[nid] = Math.max(...node.inputs.map(i => depthMap[i])) + 1;
                 maxDepth = Math.max(maxDepth, depthMap[nid]);
                 changed = true;
             }
         });
      }
      
      for (let d = 0; d <= maxDepth; d++) {
         const snap: Record<string, 0 | 1> = {};
         Object.keys(circuit.nodes).forEach(nid => {
            if (depthMap[nid] <= d) {
               snap[nid] = vals[nid];
            }
         });
         depths.push(snap);
      }
      
      setTimeline(depths);
      setCurrentStep(depths.length - 1);
      
    } catch (e) {
      console.error(e);
    }
  }, [circuit, inputA, inputB, carryIn]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep(s => {
           if (s >= timeline.length - 1) {
             setIsPlaying(false);
             return s;
           }
           return s + 1;
        });
      }, playbackSpeed);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, timeline.length]);

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    }
  };

  const presets: ArithmeticPreset[] = [
    {
      name: '3x3 Multiplier (5 × 7 = 35)',
      category: 'Multiplication',
      labId: 'mult-3x3',
      a: 5,
      b: 7
    },
    {
      name: '2s-Comp Subtractor (7 − 3 = 4, No Borrow)',
      category: 'Subtraction',
      labId: 'twos-sub',
      w: 4,
      a: 7,
      b: 3
    },
    {
      name: '2s-Comp Subtractor (2 − 5 = −3, Borrow)',
      category: 'Subtraction',
      labId: 'twos-sub',
      w: 4,
      a: 2,
      b: 5
    },
    {
      name: '4-Bit Ripple Adder (9 + 7 + Cin = 17)',
      category: 'Addition',
      labId: 'ripple-adder',
      w: 4,
      a: 9,
      b: 7,
      cin: 1
    }
  ];

  const applyPreset = (p: ArithmeticPreset) => {
    const targetLab = LABS.find(l => l.id === p.labId);
    if (targetLab) setActiveLab(targetLab);
    if (p.w) setBitWidth(p.w);
    setInputA(p.a);
    setInputB(p.b);
    if (p.cin !== undefined) setCarryIn(p.cin);
  };

  let resultUI: React.ReactNode = null;
  if (activeLab.id.includes('adder')) {
    if (activeLab.hasWidth) {
      let sum = 0;
      for (let i = 0; i < bitWidth; i++) if (finalNodeValues[`SUM${i}`]) sum += (1 << i);
      const cout = finalNodeValues['COUT'] ?? 0;
      resultUI = (
        <div className="space-y-1">
          <p className="text-xl font-mono text-indigo-600 font-bold leading-tight">
            Sum = {sum} <span className="text-xs font-normal text-slate-500 font-sans">(Cout = {cout})</span>
          </p>
          <p className="text-xs font-mono text-slate-600">
            Binary: {cout}{Array.from({ length: bitWidth }, (_, i) => finalNodeValues[`SUM${bitWidth - 1 - i}`] || 0).join('')}₂
          </p>
        </div>
      );
    } else {
      const sum = finalNodeValues['SUM'] ?? 0;
      const cout = finalNodeValues['CARRY'] ?? finalNodeValues['COUT'] ?? 0;
      resultUI = (
        <p className="text-xl font-mono text-indigo-600 font-bold leading-tight">
          Sum = {sum}, Carry = {cout}
        </p>
      );
    }
  } else if (activeLab.id.includes('sub')) {
    if (activeLab.id === 'twos-sub') {
       let diff = 0;
       for (let i = 0; i < bitWidth; i++) if (finalNodeValues[`SUM${i}`]) diff += (1 << i);
       const cout = finalNodeValues['COUT'] ?? 0;
       const isPositive = cout === 1;
       const actualDiff = inputA - inputB;
       
       resultUI = (
         <div className="space-y-2">
           <div className="flex items-baseline gap-2">
             <span className="text-xl font-mono text-indigo-600 font-bold">
               A - B = {actualDiff}
             </span>
             <span className="text-xs font-mono text-slate-500">
               ({diff} in unsigned {bitWidth}-bit)
             </span>
           </div>
           
           <div className="text-xs font-mono p-2 rounded-lg bg-white/80 border border-indigo-100 space-y-1">
             <div>
               Diff Bits [S{bitWidth-1}..S0] = <strong>{Array.from({ length: bitWidth }, (_, i) => finalNodeValues[`SUM${bitWidth - 1 - i}`] || 0).join('')}₂</strong>
             </div>
             {showNoBorrowMode ? (
               <div className="flex items-center gap-1.5 pt-0.5">
                 <span>No-Borrow Flag:</span>
                 <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                   {cout} ({isPositive ? 'No Borrow (A ≥ B)' : 'Borrow Required (A < B)'})
                 </span>
               </div>
             ) : (
               <div className="flex items-center gap-1.5 pt-0.5">
                 <span>End Carry (Cout):</span>
                 <span className="font-bold text-indigo-700">{cout}</span>
                 <span className="text-slate-500 text-[10px]">({isPositive ? 'Result is ≥ 0' : 'Result is < 0 in 2s-comp'})</span>
               </div>
             )}
           </div>
         </div>
       );
    } else {
       const diff = finalNodeValues['DIFF'] ?? 0;
       const bout = finalNodeValues['BOUT'] ?? 0;
       resultUI = (
         <p className="text-xl font-mono text-indigo-600 font-bold leading-tight">
           Diff = {diff}, Bout = {bout}
         </p>
       );
    }
  } else if (activeLab.id.includes('mult')) {
      let prod = 0;
      const bts = activeLab.id === 'mult-3x3' ? 6 : 4;
      let binStr = "";
      for (let i = bts - 1; i >= 0; i--) {
        const bit = finalNodeValues[`P${i}`] || 0;
        prod += bit * (1 << i);
        binStr += bit;
      }
      resultUI = (
        <div className="space-y-1">
          <p className="text-xl font-mono text-indigo-600 font-bold leading-tight">Product = {prod}</p>
          <p className="text-xs font-mono text-slate-600">
            Binary: {binStr}₂ ({bts}-bit output)
          </p>
        </div>
      );
  }

  const handlePlayPause = () => {
    if (!isPlaying && currentStep >= timeline.length - 1) {
       setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  const currentNodeValues = timeline[currentStep] || {};

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Quick-Start Examples Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🚀</span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Quick-Start Arithmetic Presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-700 transition-all text-left flex items-center gap-1.5"
            >
              <span className="text-[10px] text-slate-400 font-mono">[{p.category}]</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Circuit Selector Pills */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            Select Arithmetic Circuit
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyShareLink}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-all flex items-center gap-1.5 shadow-xs"
              title="Copy shareable direct link with current arithmetic settings"
            >
              <span>🔗</span>
              <span>{copyToast ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2" role="tablist">
          {LABS.map(lab => (
            <button
              key={lab.id}
              role="tab"
              aria-selected={activeLab.id === lab.id}
              onClick={() => {
                setActiveLab(lab as any);
                setInputA(0);
                setInputB(0);
                setCarryIn(0);
              }}
              className={`p-2.5 rounded-xl text-xs font-semibold tracking-tight transition-all text-center flex flex-col items-center justify-center gap-1 border ${
                activeLab.id === lab.id 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/70 hover:border-slate-300'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">{lab.category}</span>
              <span className="leading-tight">{lab.name.replace('N-bit ', '').replace(' Binary', '')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace: Controls + Live Circuit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Controls & Results (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {activeLab.hasWidth && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Bit Width (N)</label>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono text-xs font-bold border border-indigo-200/60">
                  {bitWidth} Bits
                </span>
              </div>
              <input 
                type="range" min="2" max="8" step="1"
                value={bitWidth} onChange={e => setBitWidth(parseInt(e.target.value))}
                className="w-full cursor-pointer accent-indigo-600 h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>2 bits</span>
                <span>8 bits</span>
              </div>
            </div>
          )}
        
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Operands</span>
              <span className="text-[10px] font-normal text-slate-400 lowercase">decimal & binary</span>
            </h3>
            
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label className="font-semibold text-slate-700">Operand A (0 - {maxValA})</label>
                  <span className="font-mono text-xs text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                    {inputA.toString(2).padStart(getBitsA(), '0')}₂
                  </span>
                </div>
                <input 
                  type="number" min="0" max={maxValA}
                  value={inputA} onChange={e => setInputA(Math.min(maxValA, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="border border-slate-300 p-2.5 rounded-xl w-full bg-slate-50/50 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <label className="font-semibold text-slate-700">Operand B (0 - {maxValB})</label>
                  <span className="font-mono text-xs text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
                    {inputB.toString(2).padStart(getBitsB(), '0')}₂
                  </span>
                </div>
                <input 
                  type="number" min="0" max={maxValB}
                  value={inputB} onChange={e => setInputB(Math.min(maxValB, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="border border-slate-300 p-2.5 rounded-xl w-full bg-slate-50/50 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                />
              </div>

              {hasCarryIn && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700">
                    {activeLab.id === 'full-sub' ? 'Borrow In (Bin)' : 'Carry In (Cin)'} (0 or 1)
                  </label>
                  <select 
                    value={carryIn} onChange={e => setCarryIn(parseInt(e.target.value) || 0)}
                    className="border border-slate-300 p-2.5 rounded-xl w-full bg-slate-50/50 font-mono text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  >
                    <option value={0}>0 (Logic Low)</option>
                    <option value={1}>1 (Logic High)</option>
                  </select>
                </div>
              )}

              {/* Cout / No-Borrow toggle for 2's complement subtractor */}
              {activeLab.id === 'twos-sub' && (
                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-700">End Carry Display:</span>
                    <button
                      onClick={() => setShowNoBorrowMode(!showNoBorrowMode)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <span>🔄</span>
                      <span>{showNoBorrowMode ? 'No-Borrow Mode' : 'Raw Cout Mode'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Simulated Output Card */}
          <div className="p-5 bg-gradient-to-br from-indigo-50/90 to-slate-50 rounded-2xl border border-indigo-200/80 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2 flex items-center gap-1.5">
              <span>⚡</span>
              <span>Simulated Output</span>
            </h3>
            {resultUI}
          </div>
        </div>
        
        {/* Right Column: Circuit Canvas & Simulation Playback (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex justify-between items-center flex-wrap gap-2">
               <div className="flex gap-1.5">
                 <button 
                   onClick={() => { setIsPlaying(false); setCurrentStep(0); }} 
                   className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                 >
                   ⏮ Reset
                 </button>
                 <button 
                   onClick={() => { setIsPlaying(false); setCurrentStep(Math.max(0, currentStep - 1)); }} 
                   className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                 >
                   ⏪ Step
                 </button>
                 <button 
                   onClick={handlePlayPause} 
                   className={`px-5 py-1.5 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 ${
                     isPlaying ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
                   }`}
                 >
                   <span>{isPlaying ? '⏸' : '▶'}</span>
                   <span>{isPlaying ? 'Pause' : 'Play Propagation'}</span>
                 </button>
                 <button 
                   onClick={() => { setIsPlaying(false); setCurrentStep(Math.min(timeline.length - 1, currentStep + 1)); }} 
                   className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                 >
                   Step ⏩
                 </button>
               </div>

               <div className="flex items-center gap-1.5 text-xs bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">
                 <span className="font-semibold text-slate-500">Speed:</span>
                 {(['Slow', 'Normal', 'Fast'] as const).map(s => {
                   const val = s === 'Slow' ? 1000 : s === 'Normal' ? 500 : 200;
                   return (
                     <button 
                       key={s} 
                       onClick={() => setPlaybackSpeed(val)}
                       className={`px-2 py-0.5 rounded transition-all ${
                         playbackSpeed === val 
                           ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                           : 'hover:bg-slate-200 text-slate-600'
                       }`}
                     >
                       {s}
                     </button>
                   );
                 })}
               </div>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
               <div 
                 className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                 style={{ width: `${(currentStep / Math.max(1, timeline.length - 1)) * 100}%` }}
               />
            </div>

            <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 px-1">
              <span>Signal Propagation Layer {currentStep + 1} of {timeline.length}</span>
              <span>{Math.round(((currentStep + 1) / timeline.length) * 100)}% Settled</span>
            </div>
          </div>
          
          {/* Framed Circuit Canvas with contained aesthetic */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm h-[480px] relative p-2">
            <CircuitCanvas 
              circuit={circuit} 
              height={460} 
              nodeValues={currentNodeValues} 
              title={`${activeLab.name} Circuit Schematic`}
            />
          </div>
        </div>
      </div>

      {/* Detailed Educational & Bitwise Walkthrough Section */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        <h3 className="font-bold text-xl text-slate-900 mb-6 flex items-center gap-2.5 pb-4 border-b border-slate-200">
          <span className="text-2xl">📖</span>
          <span>How It Works & Bitwise Walkthrough: {activeLab.name}</span>
        </h3>
        <ArithmeticExplanation
          labId={activeLab.id}
          bitWidth={bitWidth}
          inputA={inputA}
          inputB={inputB}
          carryIn={carryIn}
          finalNodeValues={finalNodeValues}
          showNoBorrowMode={showNoBorrowMode}
        />
      </div>
    </div>
  );
};
