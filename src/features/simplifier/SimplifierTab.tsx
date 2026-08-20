import React, { useState, useEffect } from 'react';
import { useLogicStore } from '../../stores/useLogicStore';
import { CircuitCanvas } from '../../components/circuit/CircuitCanvas';
import { KMap } from '../../components/simplifier/KMap';
import { WordProblemInput } from '../../components/simplifier/WordProblemInput';

export const SimplifierTab: React.FC = () => {
  const store = useLogicStore();

  const [minMaxInput, setMinMaxInput] = useState((store.isMintermInputMode ? store.minterms : store.maxterms).join(','));
  const [dcInput, setDcInput] = useState(store.dontCares.join(','));

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
  }, [store.isMintermInputMode, store.minterms, store.maxterms, store.dontCares]);

  const handleVarRename = (index: number, val: string) => {
    // Validate: max 3 chars, alphanumeric, starts with letter
    const valid = /^[a-zA-Z][a-zA-Z0-9]{0,2}$/.test(val);
    if (!valid && val !== '') return; // Let user clear it while typing, but ideally they type valid
    
    // Convert to upper
    const upper = val.toUpperCase();
    
    // Check reserved
    const reserved = ['AND', 'OR', 'NOT', 'XOR', 'XNOR', 'NAND', 'NOR'];
    if (reserved.includes(upper)) return;
    
    // Check duplicates
    if (store.variableNames.some((v, i) => i !== index && v === upper)) return;

    store.renameVariable(index, upper || 'V');
  };

  const downloadSvg = (id: string, filename: string) => {
    const svgElement = document.getElementById(id);
    if (!svgElement) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
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

  return (
    <div className="flex flex-col gap-8 p-6 max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-surface-100">
        <h2 className="text-2xl font-bold mb-4">Logic Input</h2>
        
        <div className="mb-6 flex flex-wrap gap-6 items-end">
          <div>
            <label className="block text-sm font-semibold mb-1">Variables (2-6)</label>
            <input 
              type="number" min="2" max="6" 
              value={store.numVariables} 
              onChange={e => store.setNumVariables(Number(e.target.value))}
              className="border rounded px-2 py-1 w-20 bg-surface-50"
            />
          </div>
          <div className="flex gap-2">
            {store.variableNames.map((v, i) => (
              <div key={i} className="flex flex-col">
                <label className="text-[10px] font-mono text-surface-500 uppercase">Var {i+1}</label>
                <input 
                  type="text"
                  maxLength={3}
                  value={v}
                  onChange={(e) => handleVarRename(i, e.target.value)}
                  className="border rounded px-2 py-1 w-12 text-center font-mono uppercase bg-surface-50 focus:border-primary-500 outline-none"
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mb-4">
          {(['truth_table', 'min_max', 'expression', 'word_problem'] as const).map(mode => (
            <button 
              key={mode} 
              onClick={() => store.setInputMode(mode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${store.inputMode === mode ? 'bg-primary-600 text-white' : 'bg-surface-100 hover:bg-surface-200'}`}
            >
              {mode.replace('_', ' ').replace('min max', 'Minterms/Maxterms').toUpperCase()}
            </button>
          ))}
        </div>

        {store.inputMode === 'word_problem' && (
          <div className="mt-4 border-t pt-4">
            <WordProblemInput />
          </div>
        )}

        {store.inputMode === 'expression' && (
          <div className="mt-4">
            <label className="block text-sm font-semibold mb-1">Boolean Expression</label>
            <input 
              type="text" 
              placeholder="e.g. A'B + C (Use +, *, ', ^)" 
              value={store.expressionStr}
              onChange={e => store.setExpression(e.target.value)}
              className="w-full border p-3 rounded font-mono text-lg bg-surface-50"
            />
          </div>
        )}

        {store.inputMode === 'min_max' && (
          <div className="flex flex-col gap-4 mt-4 border-t pt-4">
            <div className="flex gap-4">
              <button 
                onClick={() => store.setIsMintermInputMode(true)}
                className={`px-4 py-1 rounded border font-medium ${store.isMintermInputMode ? 'bg-primary-100 border-primary-500 text-primary-800' : 'bg-surface-50 hover:bg-surface-100'}`}
              >
                Σ Minterms
              </button>
              <button 
                onClick={() => store.setIsMintermInputMode(false)}
                className={`px-4 py-1 rounded border font-medium ${!store.isMintermInputMode ? 'bg-primary-100 border-primary-500 text-primary-800' : 'bg-surface-50 hover:bg-surface-100'}`}
              >
                Π Maxterms
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-surface-800 mb-1">
                {store.isMintermInputMode ? 'Minterms (comma separated e.g. 0,2,5)' : 'Maxterms (comma separated e.g. 1,3,7)'}
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
                className="w-full border p-3 rounded font-mono bg-surface-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-surface-800 mb-1">Don't Cares (optional)</label>
              <input 
                type="text" 
                value={dcInput}
                onChange={e => {
                  const val = e.target.value;
                  setDcInput(val);
                  const dcs = val.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                  store.setMintermsMaxterms(store.isMintermInputMode ? store.minterms : store.maxterms, dcs);
                }}
                className="w-full border p-3 rounded font-mono bg-surface-50"
              />
            </div>
          </div>
        )}

        {store.inputMode === 'truth_table' && (
          <div className="overflow-auto max-h-[400px] border rounded shadow-inner mt-4">
            <table className="w-full text-center">
              <thead className="bg-surface-100 sticky top-0 z-10">
                <tr>
                  {store.variableNames.map(v => <th key={v} className="p-3 border-b">{v}</th>)}
                  <th className="p-3 border-b border-l">Output <span className="text-[10px] uppercase bg-surface-200 px-1 rounded ml-1">Toggle 0/1/X</span></th>
                </tr>
              </thead>
              <tbody>
                {store.truthTable.map((row, i) => (
                  <tr key={i} className="border-b hover:bg-surface-50 transition-colors">
                    {store.variableNames.map(v => <td key={v} className="p-2 text-surface-500 font-mono">{row.inputs[v]}</td>)}
                    <td 
                      className={`p-2 border-l cursor-pointer font-bold text-lg select-none hover:bg-primary-100 ${row.output === 'X' ? 'text-surface-400' : 'text-primary-600'}`}
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
          <button 
            onClick={store.process} 
            className="mt-6 px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-lg transition-all shadow-md active:scale-95"
          >
            Simplify & Generate Circuits
          </button>
        )}
        
        {store.error && <p className="text-red-500 mt-4 p-3 bg-red-50 rounded border border-red-200">{store.error}</p>}
      </div>

      {store.simplifiedSOP !== null && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-surface-100">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-2xl font-bold">Results</h2>
             <div className="flex bg-surface-100 p-1 rounded-lg">
               <button 
                 onClick={() => { store.setOutputMode('sop'); store.process(); }}
                 className={`px-4 py-1 text-sm font-bold rounded-md ${store.outputMode === 'sop' ? 'bg-white shadow text-primary-600' : 'text-surface-600 hover:text-surface-900'}`}
               >
                 SOP Output
               </button>
               <button 
                 onClick={() => { store.setOutputMode('pos'); store.process(); }}
                 className={`px-4 py-1 text-sm font-bold rounded-md ${store.outputMode === 'pos' ? 'bg-white shadow text-primary-600' : 'text-surface-600 hover:text-surface-900'}`}
               >
                 POS Output
               </button>
             </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="flex-1">
              <h3 className="text-sm uppercase tracking-wider font-semibold text-surface-500 mb-2">
                Simplified {store.outputMode.toUpperCase()} Expression
              </h3>
              <p className="text-2xl font-mono bg-surface-50 p-6 rounded-lg border border-surface-200 text-center shadow-inner min-h-[100px] flex items-center justify-center break-all">
                {store.outputMode === 'sop' ? store.simplifiedSOP : store.simplifiedPOS}
              </p>
            </div>
            
            <div className="flex-1">
               <h3 className="text-sm uppercase tracking-wider font-semibold text-surface-500 mb-2">Karnaugh Map</h3>
               <div className="bg-surface-50 p-4 rounded-lg border border-surface-200 flex justify-center overflow-auto min-h-[100px]">
                 <KMap />
               </div>
            </div>
          </div>

          <div className="flex flex-col gap-12">
            {store.circuitDAG && (
              <div className="border p-4 rounded-lg relative">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div> Standard Circuit (AND/OR/NOT)
                  </h3>
                  <button onClick={() => downloadSvg('svg-std', 'Standard_Circuit')} className="text-xs bg-surface-200 hover:bg-surface-300 px-3 py-1 rounded">Download SVG</button>
                </div>
                <div id="svg-std">
                  <CircuitCanvas circuit={store.circuitDAG} />
                </div>
              </div>
            )}
            
            {store.nandDAG && (
              <div className="border p-4 rounded-lg relative">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div> NAND-only Circuit
                  </h3>
                  <button onClick={() => downloadSvg('svg-nand', 'NAND_Circuit')} className="text-xs bg-surface-200 hover:bg-surface-300 px-3 py-1 rounded">Download SVG</button>
                </div>
                <div id="svg-nand">
                  <CircuitCanvas circuit={store.nandDAG} />
                </div>
              </div>
            )}
            
            {store.norDAG && (
              <div className="border p-4 rounded-lg relative">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div> NOR-only Circuit
                  </h3>
                  <button onClick={() => downloadSvg('svg-nor', 'NOR_Circuit')} className="text-xs bg-surface-200 hover:bg-surface-300 px-3 py-1 rounded">Download SVG</button>
                </div>
                <div id="svg-nor">
                  <CircuitCanvas circuit={store.norDAG} />
                </div>
              </div>
            )}
          </div>
          
          {store.verificationResult && (
            <div className={`mt-8 p-6 rounded-xl border-2 ${store.verificationResult.matched ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
              <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                {store.verificationResult.matched ? "✅ Verification Passed" : "❌ Verification Failed"}
              </h3>
              <p className="text-sm opacity-90">
                {store.verificationResult.matched 
                  ? "All generated circuits (Standard, NAND-only, NOR-only) logically match the input function across all 2^n combinations."
                  : "Mismatches detected between generated circuits and input! This indicates an error in the derivation engine."
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
