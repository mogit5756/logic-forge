import { useState, useEffect, useRef } from 'react';
import { 
  HalfAdderCircuit, FullAdderCircuit, 
  HalfSubtractorCircuit, FullSubtractorCircuit,
  buildRippleCarryAdder, buildTwosComplementSubtractor, buildMultiplier
} from './predefinedCircuits';
import { CircuitCanvas } from '../../components/circuit/CircuitCanvas';
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
      
      // Compute timeline by layering evaluation
      // Actually evaluateCircuitAllNodes just returns the final state.
      // To simulate timeline: Group nodes by logic depth and incrementally activate them
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
      resultUI = <p className="text-xl font-mono text-primary-600 font-bold leading-tight">Sum = {sum} (Cout = {finalNodeValues['COUT']})</p>;
    } else {
      resultUI = <p className="text-xl font-mono text-primary-600 font-bold leading-tight">Sum = {finalNodeValues['SUM']}, Carry = {finalNodeValues['CARRY'] ?? finalNodeValues['COUT']}</p>;
    }
  } else if (activeLab.id.includes('sub')) {
    if (activeLab.hasWidth) {
       let diff = 0;
       for (let i = 0; i < bitWidth; i++) if (finalNodeValues[`SUM${i}`]) diff += (1 << i);
       resultUI = <p className="text-xl font-mono text-primary-600 font-bold leading-tight">Diff (2's Comp) = {diff} (Sign/Cout = {finalNodeValues['COUT']})</p>;
    } else {
       resultUI = <p className="text-xl font-mono text-primary-600 font-bold leading-tight">Diff = {finalNodeValues['DIFF']}, Bout = {finalNodeValues['BOUT']}</p>;
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
          <p className="text-sm font-mono text-primary-800">
            Binary: {Array.from({length: bts}, (_, i) => `P${bts - 1 - i}`).join(' ')}<br/>
            Result: {binStr.split('').join('  ').padStart(bts * 3, ' ')} = {prod}
          </p>
        </div>
      );
  }

  const renderHowItWorks = () => {
    switch (activeLab.id) {
      case 'half-adder': return (
        <>
          <div className="mb-3"><strong className="block text-surface-900">Overview</strong> Adds two bits A and B.</div>
          <div className="mb-3"><strong className="block text-surface-900">Logic Equations</strong> Sum = A ⊕ B <br/> Carry = A · B</div>
          <div className="mb-3"><strong className="block text-surface-900">Worked Example</strong> {inputA} + {inputB}: Sum = {inputA ^ inputB}, Carry = {inputA & inputB}</div>
        </>
      );
      case 'full-adder': return (
        <>
          <div className="mb-3"><strong className="block text-surface-900">Overview</strong> Adds three bits (A, B, Cin) to account for carry-in from a previous stage.</div>
          <div className="mb-3"><strong className="block text-surface-900">Logic Equations</strong> Sum = A ⊕ B ⊕ Cin <br/> Cout = (A · B) + Cin · (A ⊕ B)</div>
          <div className="mb-3"><strong className="block text-surface-900">How it's Built</strong> Two Half Adders and an OR gate.</div>
          <div className="mb-3"><strong className="block text-surface-900">Worked Example</strong> {inputA} + {inputB} + {carryIn}: Sum = {(inputA ^ inputB ^ carryIn)}, Cout = {((inputA & inputB) | (carryIn & (inputA ^ inputB)))}</div>
        </>
      );
      case 'ripple-adder': return (
        <>
          <div className="mb-3"><strong className="block text-surface-900">Overview</strong> Chains N Full Adders to add N-bit numbers.</div>
          <div className="mb-3"><strong className="block text-surface-900">How it's Built</strong> The Cout of bit <em>i</em> connects to the Cin of bit <em>i+1</em>. This carry must "ripple" through the circuit from LSB to MSB.</div>
        </>
      );
      case 'half-sub': return (
        <>
          <div className="mb-3"><strong className="block text-surface-900">Overview</strong> Subtracts bit B from A.</div>
          <div className="mb-3"><strong className="block text-surface-900">Logic Equations</strong> Diff = A ⊕ B <br/> Borrow = A' · B</div>
        </>
      );
      case 'full-sub': return (
        <>
          <div className="mb-3"><strong className="block text-surface-900">Overview</strong> Subtracts bit B and borrow-in (Bin) from A.</div>
          <div className="mb-3"><strong className="block text-surface-900">Logic Equations</strong> Diff = A ⊕ B ⊕ Bin <br/> Bout = A'B + Bin(A ⊕ B)'</div>
        </>
      );
      case 'twos-sub': return (
        <>
          <div className="mb-3"><strong className="block text-surface-900">Overview</strong> Performs subtraction by adding the two's complement of B to A.</div>
          <div className="mb-3"><strong className="block text-surface-900">How it's Built</strong> B is inverted (1's complement). Setting Cin = 1 to the first adder adds 1, completing the 2's complement conversion. A - B = A + (-B) = A + (~B + 1).</div>
        </>
      );
      case 'mult-2x2':
      case 'mult-3x3': return (
        <>
          <div className="mb-3"><strong className="block text-surface-900">Overview</strong> Binary multiplication using partial products and adders.</div>
          <div className="mb-3"><strong className="block text-surface-900">How it's Built</strong> AND gates compute partial products (A<sub>i</sub> · B<sub>j</sub>). These products are shifted and added together using Half and Full Adders, exactly like elementary school long multiplication.</div>
        </>
      );
      default: return null;
    }
  };

  const handlePlayPause = () => {
    if (!isPlaying && currentStep >= timeline.length - 1) {
       setCurrentStep(0); // Restart if at end
    }
    setIsPlaying(!isPlaying);
  };

  const currentNodeValues = timeline[currentStep] || {};

  return (
    <div className="flex flex-col gap-8 p-6 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-surface-100">
        <h2 className="text-2xl font-bold mb-6">Arithmetic Circuits Lab</h2>
        
        <div className="flex flex-wrap gap-4 mb-8 border-b pb-4">
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

        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-1 max-w-[300px]">
            {activeLab.hasWidth && (
              <div className="mb-6 bg-surface-50 p-4 rounded-lg border">
                <label className="block text-sm font-bold mb-2">Bit Width (N)</label>
                <input 
                  type="range" min="2" max="8" step="1"
                  value={bitWidth} onChange={e => setBitWidth(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center font-bold text-primary-600">{bitWidth}-bit</div>
              </div>
            )}
          
            <h3 className="text-lg font-semibold mb-4">Inputs</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Operand A (0 - {maxValA})</label>
                <input 
                  type="number" min="0" max={maxValA}
                  value={inputA} onChange={e => setInputA(Math.min(maxValA, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="border p-2 rounded w-full focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
                <span className="block mt-1 text-surface-500 font-mono text-xs text-right">
                  Bin: {inputA.toString(2).padStart(getBitsA(), '0')}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Operand B (0 - {maxValB})</label>
                <input 
                  type="number" min="0" max={maxValB}
                  value={inputB} onChange={e => setInputB(Math.min(maxValB, Math.max(0, parseInt(e.target.value) || 0)))}
                  className="border p-2 rounded w-full focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
                <span className="block mt-1 text-surface-500 font-mono text-xs text-right">
                  Bin: {inputB.toString(2).padStart(getBitsB(), '0')}
                </span>
              </div>
              {hasCarryIn && (
                <div>
                  <label className="block text-sm font-medium mb-1">{activeLab.id === 'full-sub' ? 'Borrow In' : 'Carry In'} (0 - 1)</label>
                  <input 
                    type="number" min="0" max="1"
                    value={carryIn} onChange={e => setCarryIn(parseInt(e.target.value) || 0)}
                    className="border p-2 rounded w-full focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              )}
            </div>

            <div className="mt-8 p-6 bg-primary-50 rounded-lg border border-primary-100">
              <h3 className="text-lg font-semibold mb-2 text-primary-900">Final Result</h3>
              {resultUI}
            </div>
            
            <div className="mt-8 text-sm text-surface-700 bg-surface-50 p-6 rounded-lg border border-surface-200 shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-surface-900">How it Works</h3>
              {renderHowItWorks()}
            </div>
          </div>
          
          <div className="flex-[2] flex flex-col min-w-0">
            <div className="mb-4 bg-surface-100 p-3 rounded-lg border flex flex-col gap-3">
              <div className="flex justify-between items-center flex-wrap gap-2">
                 <div className="flex gap-2">
                   <button onClick={() => { setIsPlaying(false); setCurrentStep(0); }} className="px-3 py-1 bg-surface-300 hover:bg-surface-400 rounded text-sm font-bold">⏮ Reset</button>
                   <button onClick={() => { setIsPlaying(false); setCurrentStep(Math.max(0, currentStep - 1)); }} className="px-3 py-1 bg-surface-300 hover:bg-surface-400 rounded text-sm font-bold">⏪ Step Back</button>
                   <button onClick={handlePlayPause} className="px-6 py-1 bg-primary-600 hover:bg-primary-500 text-white rounded text-sm font-bold shadow">{isPlaying ? '⏸ Pause' : '▶ Play'}</button>
                   <button onClick={() => { setIsPlaying(false); setCurrentStep(Math.min(timeline.length - 1, currentStep + 1)); }} className="px-3 py-1 bg-surface-300 hover:bg-surface-400 rounded text-sm font-bold">Step Fwd ⏩</button>
                 </div>
                 <div className="flex items-center gap-2 text-sm bg-white px-2 py-1 rounded shadow-sm">
                   <span className="font-semibold text-surface-600">Speed:</span>
                   {(['Slow', 'Normal', 'Fast'] as const).map(s => {
                     const val = s === 'Slow' ? 1000 : s === 'Normal' ? 500 : 200;
                     return (
                       <button 
                         key={s} 
                         onClick={() => setPlaybackSpeed(val)}
                         className={`px-2 py-0.5 rounded ${playbackSpeed === val ? 'bg-primary-100 text-primary-700 font-bold' : 'hover:bg-surface-100'}`}
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
                Step {currentStep + 1} of {timeline.length} (Logic Depth)
              </div>
            </div>
            
            <div className="border border-surface-200 rounded-lg overflow-hidden bg-white shadow-sm flex-1 min-h-[500px]">
              <CircuitCanvas circuit={circuit} height={700} nodeValues={currentNodeValues} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
