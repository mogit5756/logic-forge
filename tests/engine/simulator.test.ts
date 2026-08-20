import { describe, it, expect } from 'vitest';
import { evaluateCircuit } from '../../src/engine/simulator/simulator';
import { Circuit } from '../../src/engine/types';

describe('Circuit Simulator', () => {
  it('evaluates an AND gate', () => {
    const circuit: Circuit = {
      inputNodes: ['IN_A', 'IN_B'],
      outputNodes: ['OUT'],
      nodes: {
        'IN_A': { id: 'IN_A', type: 'INPUT', label: 'A', inputs: [] },
        'IN_B': { id: 'IN_B', type: 'INPUT', label: 'B', inputs: [] },
        'AND1': { id: 'AND1', type: 'AND', inputs: ['IN_A', 'IN_B'] },
        'OUT': { id: 'OUT', type: 'OUTPUT', label: 'Y', inputs: ['AND1'] },
      }
    };
    
    expect(evaluateCircuit(circuit, { A: 0, B: 0 })).toEqual({ Y: 0 });
    expect(evaluateCircuit(circuit, { A: 0, B: 1 })).toEqual({ Y: 0 });
    expect(evaluateCircuit(circuit, { A: 1, B: 0 })).toEqual({ Y: 0 });
    expect(evaluateCircuit(circuit, { A: 1, B: 1 })).toEqual({ Y: 1 });
  });

  it('evaluates a full adder logic', () => {
    // A XOR B XOR Cin
    const circuit: Circuit = {
      inputNodes: ['A', 'B', 'C'],
      outputNodes: ['SUM', 'COUT'],
      nodes: {
        'A': { id: 'A', type: 'INPUT', label: 'A', inputs: [] },
        'B': { id: 'B', type: 'INPUT', label: 'B', inputs: [] },
        'C': { id: 'C', type: 'INPUT', label: 'C', inputs: [] },
        
        'XOR1': { id: 'XOR1', type: 'XOR', inputs: ['A', 'B'] },
        'XOR2': { id: 'XOR2', type: 'XOR', inputs: ['XOR1', 'C'] }, // Sum
        
        'AND1': { id: 'AND1', type: 'AND', inputs: ['A', 'B'] },
        'AND2': { id: 'AND2', type: 'AND', inputs: ['XOR1', 'C'] },
        'OR1': { id: 'OR1', type: 'OR', inputs: ['AND1', 'AND2'] }, // Cout
        
        'SUM': { id: 'SUM', type: 'OUTPUT', label: 'SUM', inputs: ['XOR2'] },
        'COUT': { id: 'COUT', type: 'OUTPUT', label: 'COUT', inputs: ['OR1'] },
      }
    };
    
    expect(evaluateCircuit(circuit, { A: 1, B: 1, C: 1 })).toEqual({ SUM: 1, COUT: 1 });
    expect(evaluateCircuit(circuit, { A: 1, B: 0, C: 0 })).toEqual({ SUM: 1, COUT: 0 });
    expect(evaluateCircuit(circuit, { A: 0, B: 1, C: 1 })).toEqual({ SUM: 0, COUT: 1 });
  });
});
