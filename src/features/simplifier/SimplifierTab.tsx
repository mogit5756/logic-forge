import React, { useState, useEffect, useRef } from 'react';
import { useLogicStore } from '../../stores/useLogicStore';

import { CircuitCanvas } from '../../components/circuit/CircuitCanvas';
import { KMap } from '../../components/simplifier/KMap';
import { WordProblemInput } from '../../components/simplifier/WordProblemInput';
import { updateUrlParams, parseUrlState } from '../../utils/urlState';

interface ExamplePreset {
  name: string;
  category: string;
  description: string;
  apply: () => void;
}

export const SimplifierTab: React.FC = () => {
  const store = useLogicStore();

  const [minMaxInput, setMinMaxInput] = useState((store.isMintermInputMode ? store.minterms : store.maxterms).join(','));
  const [dcInput, setDcInput] = useState(store.dontCares.join(','));
  const [localVars, setLocalVars] = useState<string[]>(store.variableNames);
  const [copyToast, setCopyToast] = useState(false);
  const initialUrlState = useRef(parseUrlState());
  const didInitialUrlSync = useRef(false);

  // Sync local variable names when store variable list changes in length or structure
  useEffect(() => {
    setLocalVars(store.variableNames);
  }, [store.variableNames]);

  // Sync min/max string inputs with store
  useEffect(() => {
    const currentParsed = minMaxInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)).join(',');
    const storeStr = (store.isMintermInputMode ? store.minterms : store.maxterms).join(',');
    if (currentParsed !== storeStr) {
      setMinMaxInput(storeStr);
    }
    
    const currentDc = dcInput.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)).join(',');
    const storeDc = store.dontCares.join(',');
    if (currentDc !== storeDc) {
      setDcInput(storeDc);
    }
  }, [store.isMintermInputMode, store.minterms, store.maxterms, store.dontCares, minMaxInput, dcInput]);

  // On mount: check URL parameters to load shared state
  useEffect(() => {
    const state = initialUrlState.current;
    const actions = useLogicStore.getState();
    if (state && (state.tab === 'simplifier' || state.expr || state.min || state.max || state.mode)) {
      const targetNumVariables = state.n !== undefined && state.n >= 2 && state.n <= 6
        ? state.n
        : actions.numVariables;
      if (state.n !== undefined && state.n >= 2 && state.n <= 6) {
        actions.setNumVariables(targetNumVariables);
      }
      if (state.vars && state.vars.length > 0) {
        state.vars.slice(0, targetNumVariables).forEach((v, i) => {
          actions.renameVariable(i, v);
        });
      }
      if (state.mode) {
        actions.setInputMode(state.mode);
      }
      if (state.expr) {
        actions.setExpression(state.expr);
        actions.process();
      } else if (state.min) {
        actions.setIsMintermInputMode(true);
        actions.setMintermsMaxterms(state.min, state.dc || []);
        actions.process();
      } else if (state.max) {
        actions.setIsMintermInputMode(false);
        actions.setMintermsMaxterms(state.max, state.dc || []);
        actions.process();
      }
    }
  }, []);

  // Update URL state whenever parameters change
  useEffect(() => {
    if (!didInitialUrlSync.current) {
      didInitialUrlSync.current = true;
      if (initialUrlState.current) return;
    }
    updateUrlParams({
      tab: 'simplifier',
      mode: store.inputMode,
      n: store.numVariables,
      vars: store.variableNames.join(','),
      expr: store.inputMode === 'expression' ? store.expressionStr : undefined,
      min: store.inputMode === 'min_max' && store.isMintermInputMode ? store.minterms.join(',') : undefined,
      max: store.inputMode === 'min_max' && !store.isMintermInputMode ? store.maxterms.join(',') : undefined,
      dc: store.dontCares.length > 0 ? store.dontCares.join(',') : undefined,
    });
  }, [store.inputMode, store.numVariables, store.variableNames, store.expressionStr, store.minterms, store.maxterms, store.dontCares, store.isMintermInputMode]);

  // Safe Variable Renaming Handler: maintains local typing state without premature fallback insertion
  const handleVarChange = (index: number, rawVal: string) => {
    const upper = rawVal.toUpperCase();
    const newLocal = [...localVars];
    newLocal[index] = upper;
    setLocalVars(newLocal);

    // Validate if it is a valid non-empty variable identifier
    const valid = /^[A-Z][A-Z0-9]{0,2}$/.test(upper);
    const reserved = ['AND', 'OR', 'NOT', 'XOR', 'XNOR', 'NAND', 'NOR'];
    
    if (valid && !reserved.includes(upper)) {
      // Check if it duplicates any other variable
      const isDuplicate = store.variableNames.some((v, i) => i !== index && v === upper);
      if (!isDuplicate) {
        store.renameVariable(index, upper);
      }
    }
  };

  const handleVarBlur = (index: number) => {
    // If the user left it empty or invalid, restore store's current canonical name
    if (!localVars[index] || !/^[A-Z][A-Z0-9]{0,2}$/.test(localVars[index])) {
      const newLocal = [...localVars];
      newLocal[index] = store.variableNames[index];
      setLocalVars(newLocal);
    }
  };

  const handleCopyShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    }
  };

  const downloadSvg = (id: string, filename: string) => {
    const svgElement = document.getElementById(id);
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename + ".svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Example Presets
  const presets: ExamplePreset[] = [
    {
      name: 'Majority Voter (3-Var)',
      category: 'Expression',
      description: 'Outputs 1 when 2 or more inputs are true (A\'BC + AB\'C + ABC\' + ABC)',
      apply: () => {
        store.setNumVariables(3);
        store.setInputMode('expression');
        store.setExpression("A'B C + A B' C + A B C' + A B C");
        store.process();
      }
    },
    {
      name: 'Prime Number Detector (4-Var)',
      category: 'Minterms',
      description: 'Detects 4-bit primes {2, 3, 5, 7, 11, 13} with don\'t cares {14, 15}',
      apply: () => {
        store.setNumVariables(4);
        store.setInputMode('min_max');
        store.setIsMintermInputMode(true);
        store.setMintermsMaxterms([2, 3, 5, 7, 11, 13], [14, 15]);
        store.process();
      }
    },
    {
      name: '3-Input XOR / Parity',
      category: 'Expression',
      description: 'Odd parity detector (A XOR B XOR C)',
      apply: () => {
        store.setNumVariables(3);
        store.setInputMode('expression');
        store.setExpression("A XOR B XOR C");
        store.process();
      }
    },
    {
      name: 'Security Alarm (Word Problem)',
      category: 'Word Problem',
      description: 'Alarm triggers if motion is active at night or window is open',
      apply: () => {
        store.setNumVariables(3);
        store.setInputMode('word_problem');
        store.setWordProblem("The alarm sounds if there is motion at night, or if the window is open.");
      }
    }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Quick-Start Example Presets Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🚀</span>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Quick-Start Examples:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map(p => (
            <button
              key={p.name}
              onClick={p.apply}
              title={p.description}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-700 transition-all text-left flex items-center gap-1.5"
            >
              <span className="text-[10px] text-slate-400 font-mono">[{p.category}]</span>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Configuration Card */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="flex justify-between items-center flex-wrap gap-3 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              Boolean Logic Input
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter Boolean equations via Truth Table, Minterms, Algebraic Notation, or Word Problem
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Share link button */}
            <button
              onClick={handleCopyShareLink}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 transition-all flex items-center gap-1.5 relative shadow-xs"
              title="Copy shareable direct link with current settings"
            >
              <span>🔗</span>
              <span>{copyToast ? 'Link Copied!' : 'Share'}</span>
            </button>

            <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">Vars (2-6):</label>
                <input 
                  type="number" min="2" max="6" 
                  value={store.numVariables} 
                  onChange={e => store.setNumVariables(Number(e.target.value))}
                  className="border border-slate-300 rounded-lg px-2 py-1 w-14 bg-white text-center font-mono text-xs font-bold focus:border-indigo-500 outline-none"
                />
              </div>
              <div className="h-4 w-px bg-slate-300"></div>
              <div className="flex gap-1.5 items-center">
                {localVars.slice(0, store.numVariables).map((v, i) => (
                  <input 
                    key={i}
                    type="text"
                    maxLength={3}
                    value={v}
                    onChange={(e) => handleVarChange(i, e.target.value)}
                    onBlur={() => handleVarBlur(i)}
                    className="border border-slate-300 rounded-lg px-1.5 py-1 w-9 text-center font-mono text-xs font-bold uppercase bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                    title={`Click to rename variable ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6" role="tablist">
          {(['truth_table', 'min_max', 'expression', 'word_problem'] as const).map(mode => {
            const labels: Record<string, string> = {
              truth_table: 'Truth Table',
              min_max: 'Σ Minterms / Π Maxterms',
              expression: 'Algebraic Expression',
              word_problem: 'Natural Word Problem',
            };
            return (
              <button 
                key={mode} 
                role="tab"
                aria-selected={store.inputMode === mode}
                onClick={() => store.setInputMode(mode)}
                className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border text-center ${
                  store.inputMode === mode 
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>

        {store.inputMode === 'word_problem' && (
          <div className="mt-2">
            <WordProblemInput />
          </div>
        )}

        {store.inputMode === 'expression' && (
          <div className="mt-2 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Boolean Expression String
            </label>
            <input 
              type="text" 
              placeholder="e.g. A'B + C or A * B' + C * D (Supports +, *, ', ^, XOR, NOT)" 
              value={store.expressionStr}
              onChange={e => store.setExpression(e.target.value)}
              className="w-full border border-slate-300 p-3.5 rounded-xl font-mono text-base bg-slate-50/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-inner"
            />
            <p className="text-[11px] text-slate-500">
              Tip: Use prime tick (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">A'</code>) or <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">!A</code> for negation, <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">+</code> for OR, and adjacency or <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">*</code> for AND.
            </p>
          </div>
        )}

        {store.inputMode === 'min_max' && (
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex gap-2">
              <button 
                onClick={() => store.setIsMintermInputMode(true)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  store.isMintermInputMode 
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                Σ Minterms (SOP 1s)
              </button>
              <button 
                onClick={() => store.setIsMintermInputMode(false)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  !store.isMintermInputMode 
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs' 
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                Π Maxterms (POS 0s)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  {store.isMintermInputMode ? 'Minterm Indices (e.g. 0, 2, 5)' : 'Maxterm Indices (e.g. 1, 3, 7)'}
                </label>
                <input 
                  type="text" 
                  value={minMaxInput}
                  onChange={e => {
                    const val = e.target.value;
                    setMinMaxInput(val);
                    const terms = val.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                    store.setMintermsMaxterms(terms, store.dontCares);
                  }}
                  placeholder="0, 2, 5"
                  className="w-full border border-slate-300 p-2.5 rounded-xl font-mono text-sm bg-slate-50/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Don't Cares (Optional, e.g. 6, 7)
                </label>
                <input 
                  type="text" 
                  value={dcInput}
                  onChange={e => {
                    const val = e.target.value;
                    setDcInput(val);
                    const dcs = val.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                    store.setMintermsMaxterms(store.isMintermInputMode ? store.minterms : store.maxterms, dcs);
                  }}
                  placeholder="6, 7"
                  className="w-full border border-slate-300 p-2.5 rounded-xl font-mono text-sm bg-slate-50/50 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {store.inputMode === 'truth_table' && (
          <div className="overflow-auto max-h-[380px] border border-slate-200 rounded-xl shadow-inner mt-2">
            <table className="w-full text-center text-xs font-mono">
              <thead className="bg-slate-100/90 text-slate-700 sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="p-2.5 font-bold text-slate-500">Row</th>
                  {store.variableNames.map(v => <th key={v} className="p-2.5 font-bold">{v}</th>)}
                  <th className="p-2.5 border-l border-slate-200 font-bold text-indigo-700">
                    Output F <span className="text-[10px] uppercase font-normal bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded ml-1">Click to toggle</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {store.truthTable.map((row, i) => (
                  <tr key={i} className="hover:bg-indigo-50/40 transition-colors">
                    <td className="p-2 text-slate-400 font-mono text-[11px]">{i}</td>
                    {store.variableNames.map(v => <td key={v} className="p-2 text-slate-600">{row.inputs[v]}</td>)}
                    <td 
                      className={`p-2 border-l border-slate-200 cursor-pointer font-bold text-sm select-none hover:bg-indigo-100/70 transition-colors ${
                        row.output === 1 ? 'text-emerald-600 bg-emerald-50/30' : row.output === 'X' ? 'text-amber-500' : 'text-slate-400'
                      }`}
                      onClick={() => store.updateTruthTableOutput(i, row.output === 0 ? 1 : row.output === 1 ? 'X' : 0)}
                    >
                      {row.output}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {store.inputMode !== 'word_problem' && (
          <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
            <button 
              onClick={store.process} 
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 active:scale-95 text-xs uppercase tracking-wider flex items-center gap-2"
            >
              <span>⚡</span>
              <span>Simplify & Synthesize Circuits</span>
            </button>
          </div>
        )}
        
        {store.error && (
          <div className="mt-4 p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <span>⚠️</span>
            <span>{store.error}</span>
          </div>
        )}
      </div>

      {/* Results & Circuit Topologies */}
      {store.simplifiedSOP !== null && (
        <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-3 pb-4 border-b border-slate-200">
             <div>
               <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                 <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                 Optimization Results
               </h2>
               <p className="text-xs text-slate-500 mt-0.5">Quine-McCluskey Minimal Form & Universal Gate Synthesis</p>
             </div>

             <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
               <button 
                 onClick={() => { store.setOutputMode('sop'); store.process(); }}
                 className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                   store.outputMode === 'sop' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'
                 }`}
               >
                 SOP Form (Sum of Products)
               </button>
               <button 
                 onClick={() => { store.setOutputMode('pos'); store.process(); }}
                 className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                   store.outputMode === 'pos' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'
                 }`}
               >
                 POS Form (Product of Sums)
               </button>
             </div>
          </div>
          
          {/* Expression Banner & K-Map Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 flex flex-col gap-2">
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500">
                Minimal {store.outputMode.toUpperCase()} Equation
              </h3>
              <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-900/50 shadow-md flex-1 flex flex-col justify-center items-center text-center">
                <div className="text-xs text-indigo-400 font-mono mb-1 uppercase tracking-wider">F({store.variableNames.join(', ')}) =</div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-emerald-300 tracking-wide break-all">
                  {store.outputMode === 'sop' ? store.simplifiedSOP : store.simplifiedPOS}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-5 flex flex-col gap-2">
               <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500">
                 Karnaugh Map Grouping
               </h3>
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex justify-center items-center overflow-auto flex-1 min-h-[140px]">
                 <KMap />
               </div>
            </div>
          </div>

          {/* Verification Badge */}
          {store.verificationResult && (
            <div className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-2 ${
              store.verificationResult.matched 
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
                : 'bg-rose-50/80 border-rose-300 text-rose-950'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-lg">{store.verificationResult.matched ? "✅" : "❌"}</span>
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider">
                    {store.verificationResult.matched ? "Formal Verification Passed" : "Verification Mismatch"}
                  </span>
                  <p className="text-xs opacity-90 mt-0.5">
                    {store.verificationResult.matched 
                      ? "All 3 synthesized circuits (Standard, NAND-only, and NOR-only) produce identical truth table outputs across all 2^N combinations."
                      : "Circuit simulator detected a discrepancy between generated circuits and user truth table."
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3 Circuit Schematics */}
          <div className="space-y-6 pt-2">
            {/* Standard Circuit */}
            {store.circuitDAG && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="flex justify-between items-center px-4 py-3 bg-slate-100 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                    Standard Multi-Level Circuit (AND / OR / NOT)
                  </h3>
                  <button 
                    onClick={() => downloadSvg('svg-std', 'Standard_Circuit')} 
                    className="text-xs font-semibold bg-white hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg transition-colors border border-slate-300 shadow-xs"
                  >
                    Export SVG
                  </button>
                </div>
                <div id="svg-std" className="p-3">
                  <CircuitCanvas circuit={store.circuitDAG} title="Standard Multi-Level Circuit" />
                </div>
              </div>
            )}
            
            {/* NAND-only Circuit */}
            {store.nandDAG && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="flex justify-between items-center px-4 py-3 bg-slate-100 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    NAND-Only Universal Logic Synthesis (De Morgan Minimal)
                  </h3>
                  <button 
                    onClick={() => downloadSvg('svg-nand', 'NAND_Circuit')} 
                    className="text-xs font-semibold bg-white hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg transition-colors border border-slate-300 shadow-xs"
                  >
                    Export SVG
                  </button>
                </div>
                <div id="svg-nand" className="p-3">
                  <CircuitCanvas circuit={store.nandDAG} title="NAND-Only Universal Logic Circuit" />
                </div>
              </div>
            )}
            
            {/* NOR-only Circuit */}
            {store.norDAG && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <div className="flex justify-between items-center px-4 py-3 bg-slate-100 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    NOR-Only Universal Logic Synthesis (De Morgan Minimal)
                  </h3>
                  <button 
                    onClick={() => downloadSvg('svg-nor', 'NOR_Circuit')} 
                    className="text-xs font-semibold bg-white hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg transition-colors border border-slate-300 shadow-xs"
                  >
                    Export SVG
                  </button>
                </div>
                <div id="svg-nor" className="p-3">
                  <CircuitCanvas circuit={store.norDAG} title="NOR-Only Universal Logic Circuit" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
