import { create } from 'zustand';
import { Parser } from '../engine/expression/parser';
import { simplifyQM, qmFormatSOP, qmFormatPOS } from '../engine/quine-mccluskey/qm';
import { astToCircuit, getVariablesFromAST } from '../engine/circuit-gen/generator';
import { convertToNand, convertToNor } from '../engine/converters/nand-nor';
import { assignLayers } from '../engine/layout/layering';
import { evaluateCircuit } from '../engine/simulator/simulator';
import type { Circuit, TruthTableRow } from '../engine/types';

interface LogicState {
  numVariables: number;
  variableNames: string[];
  
  inputMode: 'truth_table' | 'min_max' | 'expression' | 'word_problem';
  isMintermInputMode: boolean; // true for minterms, false for maxterms
  outputMode: 'sop' | 'pos';
  
  truthTable: TruthTableRow[];
  minterms: number[];
  dontCares: number[];
  maxterms: number[];
  expressionStr: string;
  wordProblemStr: string;
  error: string | null;
  
  simplifiedSOP: string | null;
  simplifiedPOS: string | null;
  primeImplicants: string[];
  
  circuitDAG: Circuit | null;
  nandDAG: Circuit | null;
  norDAG: Circuit | null;
  verificationResult: { matched: boolean, mismatches: any[] } | null;
  
  setNumVariables: (n: number) => void;
  renameVariable: (index: number, name: string) => void;
  setInputMode: (mode: 'truth_table' | 'min_max' | 'expression' | 'word_problem') => void;
  setIsMintermInputMode: (isMin: boolean) => void;
  setOutputMode: (mode: 'sop' | 'pos') => void;
  updateTruthTableOutput: (index: number, val: 0 | 1 | 'X') => void;
  setMintermsMaxterms: (terms: number[], dontCares?: number[]) => void;
  setExpression: (expr: string) => void;
  setWordProblem: (str: string) => void;
  applyWordProblemLogic: (vars: Record<string, string>, expr: string) => void;
  process: () => void;
}

const DEFAULT_VARS = ['A', 'B', 'C', 'D', 'E', 'F'];

function createEmptyTruthTable(numVars: number, varNames: string[] = DEFAULT_VARS): TruthTableRow[] {
  const rows: TruthTableRow[] = [];
  const max = 1 << numVars;
  for (let i = 0; i < max; i++) {
    const inputs: Record<string, 0 | 1> = {};
    for (let bit = 0; bit < numVars; bit++) {
      inputs[varNames[numVars - 1 - bit]] = (i & (1 << bit)) ? 1 : 0;
    }
    rows.push({ inputs, output: 0 });
  }
  return rows;
}

export const useLogicStore = create<LogicState>((set, get) => ({
  numVariables: 3,
  variableNames: ['A', 'B', 'C'],
  inputMode: 'truth_table',
  isMintermInputMode: true,
  outputMode: 'sop',
  
  truthTable: createEmptyTruthTable(3, ['A', 'B', 'C']),
  minterms: [],
  maxterms: [0,1,2,3,4,5,6,7],
  dontCares: [],
  expressionStr: '',
  wordProblemStr: '',
  error: null,
  
  simplifiedSOP: null,
  simplifiedPOS: null,
  primeImplicants: [],
  circuitDAG: null,
  nandDAG: null,
  norDAG: null,
  verificationResult: null,

  setNumVariables: (n: number) => {
    const vars = DEFAULT_VARS.slice(0, n);
    set({
      numVariables: n,
      variableNames: vars,
      truthTable: createEmptyTruthTable(n, vars),
      minterms: [],
      maxterms: Array.from({length: 1 << n}, (_, i) => i),
      dontCares: [],
      simplifiedSOP: null,
      simplifiedPOS: null,
      primeImplicants: [],
      circuitDAG: null,
      nandDAG: null,
      norDAG: null,
      verificationResult: null,
      error: null
    });
  },
  
  renameVariable: (index: number, name: string) => {
    const { variableNames, numVariables } = get();
    const newVars = [...variableNames];
    newVars[index] = name.trim().toUpperCase();
    
    // Check duplicates
    if (new Set(newVars).size !== newVars.length) {
      return; // Handled by UI validation, don't update if duplicate
    }
    
    set({ variableNames: newVars, truthTable: createEmptyTruthTable(numVariables, newVars) });
  },
  
  setInputMode: (mode) => set({ inputMode: mode, error: null }),
  setIsMintermInputMode: (isMin) => {
    const { minterms, maxterms, dontCares } = get();
    set({ isMintermInputMode: isMin });
    if (isMin) {
      get().setMintermsMaxterms(minterms, dontCares);
    } else {
      get().setMintermsMaxterms(maxterms, dontCares);
    }
  },
  setOutputMode: (mode) => set({ outputMode: mode }),
  
  updateTruthTableOutput: (index, val) => {
    const { truthTable } = get();
    const newTable = [...truthTable];
    newTable[index] = { ...newTable[index], output: val };
    
    const mins: number[] = [];
    const maxs: number[] = [];
    const dcs: number[] = [];
    newTable.forEach((row, i) => {
      if (row.output === 1) mins.push(i);
      else if (row.output === 0) maxs.push(i);
      else if (row.output === 'X') dcs.push(i);
    });
    
    set({ truthTable: newTable, minterms: mins, maxterms: maxs, dontCares: dcs });
  },
  
  setMintermsMaxterms: (terms, dcs = []) => {
    const { numVariables, isMintermInputMode, variableNames } = get();
    const max = 1 << numVariables;
    const newTable = createEmptyTruthTable(numVariables, variableNames);
    
    const mins: number[] = [];
    const maxs: number[] = [];
    
    if (isMintermInputMode) {
      terms.forEach(m => { if(m < max) { newTable[m].output = 1; mins.push(m); } });
      dcs.forEach(d => { if(d < max) { newTable[d].output = 'X'; } });
      for (let i = 0; i < max; i++) {
        if (newTable[i].output === 0) maxs.push(i);
      }
    } else {
      terms.forEach(m => { if(m < max) { newTable[m].output = 0; maxs.push(m); } });
      dcs.forEach(d => { if(d < max) { newTable[d].output = 'X'; } });
      for (let i = 0; i < max; i++) {
        if (newTable[i].output === 0 && !terms.includes(i) && !dcs.includes(i)) {
          newTable[i].output = 1;
          mins.push(i);
        } else if (newTable[i].output !== 'X' && !maxs.includes(i)) {
          newTable[i].output = 1;
          mins.push(i);
        }
      }
    }
    
    set({ minterms: mins, maxterms: maxs, dontCares: dcs, truthTable: newTable });
  },
  
  setExpression: (expr) => set({ expressionStr: expr }),
  setWordProblem: (str) => set({ wordProblemStr: str }),
  
  applyWordProblemLogic: (vars: Record<string, string>, expr: string) => {
    const keys = Object.keys(vars).sort();
    const numVars = Math.max(keys.length, 2);
    const newVars = keys.slice(0, numVars);
    while (newVars.length < numVars) {
      newVars.push(DEFAULT_VARS[newVars.length]);
    }
    
    set({
      numVariables: numVars,
      variableNames: newVars,
      expressionStr: expr,
      inputMode: 'expression',
      truthTable: createEmptyTruthTable(numVars, newVars)
    });
    
    // Automatically process after setting
    get().process();
  },
  
  process: () => {
    const state = get();
    let mins = [...state.minterms];
    let maxs = [...state.maxterms];
    let dcs = [...state.dontCares];
    let tt = [...state.truthTable];
    
    set({ error: null, verificationResult: null });
    
    try {
      let ast = null;
      if (state.inputMode === 'expression') {
        const parser = new Parser(state.expressionStr);
        ast = parser.parse();
        
        const usedVars = Array.from(getVariablesFromAST(ast));
        
        // Merge missing vars from expression into our list
        const currentSet = new Set(state.variableNames.slice(0, state.numVariables));
        usedVars.forEach(v => currentSet.add(v));
        let vars = Array.from(currentSet).sort();
        if (vars.length > 6) vars = vars.slice(0, 6);
        
        const actualNumVars = vars.length;
        
        tt = [];
        mins = [];
        maxs = [];
        const max = 1 << actualNumVars;
        
        const tempCircuit = astToCircuit(ast, vars);
        
        for (let i = 0; i < max; i++) {
          const inputs: Record<string, 0 | 1> = {};
          for (let bit = 0; bit < actualNumVars; bit++) {
            inputs[vars[actualNumVars - 1 - bit]] = (i & (1 << bit)) ? 1 : 0;
          }
          const out = evaluateCircuit(tempCircuit, inputs);
          const val = Object.values(out)[0];
          tt.push({ inputs, output: val });
          if (val === 1) mins.push(i);
          else maxs.push(i);
        }
        
        if (actualNumVars !== state.numVariables || JSON.stringify(vars) !== JSON.stringify(state.variableNames)) {
          set({ numVariables: actualNumVars, variableNames: vars });
        }
      }
      
      const varsToUse = get().variableNames.slice(0, get().numVariables);
      
      // SOP QM Simplification
      const sopPrimeImplicants = simplifyQM(mins, dcs, get().numVariables);
      const simplifiedSOPStr = qmFormatSOP(sopPrimeImplicants, varsToUse);
      
      // POS QM Simplification (solve for 0s)
      const posPrimeImplicants = simplifyQM(maxs, dcs, get().numVariables);
      const simplifiedPOSStr = qmFormatPOS(posPrimeImplicants, varsToUse);
      
      // Determine final expression based on output mode
      const selectedExpression = state.outputMode === 'sop' ? simplifiedSOPStr : simplifiedPOSStr;
      const selectedImplicants = state.outputMode === 'sop' ? sopPrimeImplicants : posPrimeImplicants;
      
      // Generate Circuits
      let finalAst = null;
      try {
        finalAst = new Parser(selectedExpression).parse();
      } catch (e) {
        if (selectedExpression === '1' || selectedExpression === '0') {
          // Wrap literals manually if parsing simple bits fails or use special const AST
          finalAst = { type: 'CONSTANT', value: selectedExpression === '1' ? 1 : 0 };
        } else {
          throw e;
        }
      }
      
      // Check for simple CONSTANT Ast
      const stdCircuit = astToCircuit(finalAst as any, varsToUse);
      assignLayers(stdCircuit);
      
      const nandAst = convertToNand(finalAst as any);
      const nandCircuit = astToCircuit(nandAst, varsToUse);
      assignLayers(nandCircuit);
      
      const norAst = convertToNor(finalAst as any);
      const norCircuit = astToCircuit(norAst, varsToUse);
      assignLayers(norCircuit);
      
      // Auto-verification
      const mismatches = [];
      let matched = true;
      for (let i = 0; i < tt.length; i++) {
        const inputVec = tt[i].inputs;
        const expected = tt[i].output === 'X' ? null : tt[i].output;
        
        const stdOut = Object.values(evaluateCircuit(stdCircuit, inputVec))[0];
        const nandOut = Object.values(evaluateCircuit(nandCircuit, inputVec))[0];
        const norOut = Object.values(evaluateCircuit(norCircuit, inputVec))[0];
        
        if (stdOut !== nandOut || stdOut !== norOut || (expected !== null && stdOut !== expected)) {
          matched = false;
          mismatches.push({ inputVec, expected, stdOut, nandOut, norOut });
        }
      }
      
      set({
        truthTable: tt,
        minterms: mins,
        maxterms: maxs,
        dontCares: dcs,
        simplifiedSOP: simplifiedSOPStr,
        simplifiedPOS: simplifiedPOSStr,
        primeImplicants: selectedImplicants, // save implicants for KMap visualization
        circuitDAG: stdCircuit,
        nandDAG: nandCircuit,
        norDAG: norCircuit,
        verificationResult: { matched, mismatches }
      });
      
    } catch (err: any) {
      set({ error: err.message });
    }
  }
}));
