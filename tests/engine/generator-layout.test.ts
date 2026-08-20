import { describe, expect, it } from 'vitest';
import { astToCircuit } from '../../src/engine/circuit-gen/generator';
import { assignLayers } from '../../src/engine/layout/layering';
import type { Circuit } from '../../src/engine/types';

describe('Circuit generation and layout invariants', () => {
  it('deduplicates repeated constants and preserves the circuit output', () => {
    const circuit = astToCircuit({
      type: 'OR',
      left: { type: 'CONSTANT', value: 1 },
      right: { type: 'CONSTANT', value: 1 }
    }, []);
    const constants = Object.values(circuit.nodes).filter(node => node.type === 'CONSTANT');
    expect(constants).toHaveLength(1);
    expect(() => assignLayers(circuit)).not.toThrow();
  });

  it('rejects malformed AST nodes instead of emitting incomplete gates', () => {
    expect(() => astToCircuit({ type: 'AND', left: { type: 'VAR', value: 'A' } }, ['A']))
      .toThrow(/both operands are required/);
    expect(() => astToCircuit({ type: 'NOT' }, []))
      .toThrow(/missing left operand/);
  });

  it('rejects missing circuit references and cycles during layout', () => {
    const missing: Circuit = {
      inputNodes: [],
      outputNodes: ['OUT'],
      nodes: { OUT: { id: 'OUT', type: 'OUTPUT', label: 'Y', inputs: ['NOPE'] } }
    };
    expect(() => assignLayers(missing)).toThrow(/missing node NOPE/);

    const cyclic: Circuit = {
      inputNodes: [],
      outputNodes: ['OUT'],
      nodes: {
        A: { id: 'A', type: 'NOT', inputs: ['B'] },
        B: { id: 'B', type: 'NOT', inputs: ['A'] },
        OUT: { id: 'OUT', type: 'OUTPUT', label: 'Y', inputs: ['A'] }
      }
    };
    expect(() => assignLayers(cyclic)).toThrow(/contains a cycle/);
  });
});
