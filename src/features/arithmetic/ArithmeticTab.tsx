import { useState, useEffect, useRef } from 'react';
import { 
  HalfAdderCircuit, FullAdderCircuit, 
  HalfSubtractorCircuit, FullSubtractorCircuit,
  buildRippleCarryAdder, buildTwosComplementSubtractor, buildMultiplier
} from './predefinedCircuits';
import { CircuitCanvas } from '../../components/circuit/CircuitCanvas';
import { ArithmeticExplanation } from './ArithmeticExplanation';
import { evaluateCircuitAllNodes } from '../../engine/simulator/simulator';
import { assignLayers } from '../../engine/layout/layering';
import type { Circuit } from '../../engine/types';

type LabId = 'half-adder' | 'full-adder' | 'ripple-adder' | 'half-sub' | 'full-sub' | 'twos-sub' | 'mult-2x2' | 'mult-3x3';

const LABS: { id: LabId; name: string; hasWidth: boolean; defaultWidth?: number }[] = [
  { id: 'half-adder', name: 'Half Adder', hasWidth: false },
  { id: 'full-adder', name: 'Full Adder', hasWidth: false },
  { id: 'ripple-adder', name: 'N-bit Ripple-Carry Adder', hasWidth: true, defaultWidth: 4 },
  { id: 'half-sub', name: 'Half Subtractor', hasWidth: false },
  { id: 'full-sub', name: 'Full Subtractor', hasWidth: false },
  { id: 'twos-sub', name: 'N-bit 2\'s Complement Subtractor', hasWidth: true, defaultWidth: 4 },
  { id: 'mult-2x2', name: '2x2 Binary Multiplier', hasWidth: false },
  { id: 'mult-3x3', name: '3x3 Binary Multiplier', hasWidth: false },
];

export const ArithmeticTab: React.FC = () => {
  const [activeLab, setActiveLab] = useState(LABS[0]);
  const [bitWidth, setBitWidth] = useState(4);
  const [inputA, setInputA] = useState(0);
  const [inputB, setInputB] = useState(0);
  const [carryIn, setCarryIn] = useState(0);

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
    
    // Auto-layout generated circuits that don't have predefined positions
    if (activeLab.id.includes('mult') || activeLab.id === 'twos-sub' || activeLab.id === 'ripple-adder') {
       assignLayers(c);
    }

    setCircuit(c);
    
    // Reset inputs on change
    setInputA(0);
    setInputB(0);
    setCarryIn(0);
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
         depthMap[nid] = node.type === 'INPUT' ? 0 : -1;
      });
      
      // Calculate depth
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

  let resultUI: React.ReactNode = null;
  if (activeLab.id.includes('adder')) {
    if (activeLab.hasWidth) {
      let sum = 0;
      for (let i = 0; i < bitWidth; i++) if (finalNodeValues[`SUM${i}`]) sum += (1 << i);
      resultUI = <p className="text-xl font-mono text-primary-600 font-bold leading-tight">Sum = {sum} (Cout = {finalNodeValues['COUT'] ?? 0})</p>;
    } else {
      resultUI = <p className="text-xl font-mono text-primary-600 font-bold leading-tight">Sum = {finalNodeValues['SUM'] ?? 0}, Carry = {finalNodeValues['CARRY'] ?? finalNodeValues['COUT'] ?? 0}</p>;
    }
  } else if (activeLab.id.includes('sub')) {
    if (activeLab.hasWidth) {
       let diff = 0;
       for (let i = 0; i < bitWidth; i++) if (finalNodeValues[`SUM${i}`]) diff += (1 << i);
       resultUI = <p className="text-xl font-mono text-primary-600 font-bold leading-tight">Diff = {diff} (COUT / NoBorrow = {finalNodeValues['COUT'] ?? 0})</p>;
    } else {
       resultUI = <p className="text-xl font-mono text-primary-600 font-bold leading-tight">Diff = {finalNodeValues['DIFF'] ?? 0}, Bout = {finalNodeValues['BOUT'] ?? 0}</p>;
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
        <div className="flex flex-col gap-1">
          <p className="text-xl font-mono text-primary-600 font-bold leading-tight">Product = {prod}</p>
          <p className="text-xs font-mono text-primary-800">
            Bits: {Array.from({length: bts}, (_, i) => `P${bts - 1 - i}`).join(' ')}<br/>
            Value: {binStr.split('').join('  ')}₂ = {prod}
          </p>
        </div>
      );
  }

  const handlePlayPause = () => {
    if (!isPlaying && currentStep >= timeline.length - 1) {
       setCurrentStep(0); // Restart if at end
    }
    setIsPlaying(!isPlaying);
  };

  const currentNodeValues = timeline[currentStep] || {};

  return (
    <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-surface-100">
        <h2 className="text-2xl font-bold mb-6">Arithmetic Circuits Lab</h2>
        
        <div className="flex flex-wrap gap-3 mb-8 border-b pb-4">
          {LABS.map(lab => (
            <button
              key={lab.id}
              onClick={() => setActiveLab(lab as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeLab.id === lab.id ? 'bg-primary-600 text-white shadow' : 'bg-surface-100 hover:bg-surface-200'}`}
            >
              {lab.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls column */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {activeLab.hasWidth && (
              <div className="bg-surface-50 p-4 rounded-lg border">
                <label className="block text-sm font-bold mb-2">Bit Width (N)</label>
                <input 
                  type="range" min="2" max="8" step="1"
                  value={bitWidth} onChange={e => setBitWidth(parseInt(e.target.value))}
                  className="w-full cursor-pointer accent-primary-600"
                />
                <div className="text-center font-bold text-primary-600 mt-1">{bitWidth}-bit</div>
              </div>
            )}
          
            <div className="bg-surface-50 p-5 rounded-lg border">
              <h3 className="text-base font-bold mb-4 text-surface-900">Input Controls</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-surface-700">Operand A (0 - {maxValA})</label>
                    <span className="font-mono text-xs text-surface-500 font-semibold">
                      {inputA.toString(2).padStart(getBitsA(), '0')}₂
                    </span>
                  </div>
                  <input 
                    type="number" min="0" max={maxValA}
                    value={inputA} onChange={e => setInputA(Math.min(maxValA, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="border border-surface-300 p-2 rounded w-full bg-white font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-sm font-medium text-surface-700">Operand B (0 - {maxValB})</label>
                    <span className="font-mono text-xs text-surface-500 font-semibold">
                      {inputB.toString(2).padStart(getBitsB(), '0')}₂
                    </span>
                  </div>
                  <input 
                    type="number" min="0" max={maxValB}
                    value={inputB} onChange={e => setInputB(Math.min(maxValB, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="border border-surface-300 p-2 rounded w-full bg-white font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                {hasCarryIn && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-surface-700">
                      {activeLab.id === 'full-sub' ? 'Borrow In (Bin)' : 'Carry In (Cin)'} (0 or 1)
                    </label>
                    <select 
                      value={carryIn} onChange={e => setCarryIn(parseInt(e.target.value) || 0)}
                      className="border border-surface-300 p-2 rounded w-full bg-white font-mono focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    >
                      <option value={0}>0 (Low)</option>
                      <option value={1}>1 (High)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 bg-primary-50/70 rounded-lg border border-primary-200">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary-900 mb-2">Simulated Output</h3>
              {resultUI}
            </div>
          </div>
          
          {/* Circuit Canvas & Simulation Playback */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-surface-100 p-3 rounded-lg border flex flex-col gap-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                 <div className="flex gap-2">
                   <button onClick={() => { setIsPlaying(false); setCurrentStep(0); }} className="px-3 py-1 bg-surface-200 hover:bg-surface-300 rounded text-xs font-bold transition-colors">⏮ Reset</button>
                   <button onClick={() => { setIsPlaying(false); setCurrentStep(Math.max(0, currentStep - 1)); }} className="px-3 py-1 bg-surface-200 hover:bg-surface-300 rounded text-xs font-bold transition-colors">⏪ Step Back</button>
                   <button onClick={handlePlayPause} className="px-5 py-1 bg-primary-600 hover:bg-primary-500 text-white rounded text-xs font-bold shadow transition-colors">{isPlaying ? '⏸ Pause' : '▶ Play Step'}</button>
                   <button onClick={() => { setIsPlaying(false); setCurrentStep(Math.min(timeline.length - 1, currentStep + 1)); }} className="px-3 py-1 bg-surface-200 hover:bg-surface-300 rounded text-xs font-bold transition-colors">Step Fwd ⏩</button>
                 </div>
                 <div className="flex items-center gap-2 text-xs bg-white px-2.5 py-1 rounded border shadow-sm">
                   <span className="font-semibold text-surface-600">Speed:</span>
                   {(['Slow', 'Normal', 'Fast'] as const).map(s => {
                     const val = s === 'Slow' ? 1000 : s === 'Normal' ? 500 : 200;
                     return (
                       <button 
                         key={s} 
                         onClick={() => setPlaybackSpeed(val)}
                         className={`px-2 py-0.5 rounded transition-colors ${playbackSpeed === val ? 'bg-primary-100 text-primary-700 font-bold' : 'hover:bg-surface-100 text-surface-600'}`}
                       >
                         {s}
                       </button>
                     );
                   })}
                 </div>
              </div>
              <div className="w-full bg-surface-200 h-2 rounded-full overflow-hidden">
                 <div 
                   className="bg-primary-500 h-full transition-all duration-300"
                   style={{ width: `${(currentStep / Math.max(1, timeline.length - 1)) * 100}%` }}
                 />
              </div>
              <div className="text-center text-xs font-mono text-surface-500">
                Logic Propagation Depth: Step {currentStep + 1} of {timeline.length}
              </div>
            </div>
            
            <div className="border border-surface-200 rounded-lg overflow-hidden bg-white shadow-sm h-[480px]">
              <CircuitCanvas circuit={circuit} height={480} nodeValues={currentNodeValues} />
            </div>
          </div>
        </div>

        {/* Detailed Educational & Bitwise Walkthrough Section */}
        <div className="mt-10 pt-8 border-t border-surface-200">
          <div className="bg-surface-50 p-6 md:p-8 rounded-xl border border-surface-200 shadow-sm">
            <h3 className="font-bold text-xl text-surface-900 mb-6 flex items-center gap-2">
              <span>📖</span>
              <span>How It Works & Bitwise Walkthrough: {activeLab.name}</span>
            </h3>
            <ArithmeticExplanation
              labId={activeLab.id}
              bitWidth={bitWidth}
              inputA={inputA}
              inputB={inputB}
              carryIn={carryIn}
              finalNodeValues={finalNodeValues}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

