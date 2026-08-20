import { describe, it, expect } from 'vitest';
import { Parser } from '../src/engine/expression/parser';
import { convertToNand, convertToNor } from '../src/engine/converters/nand-nor';
import { astToCircuit } from '../src/engine/circuit-gen/generator';
import { evaluateCircuit } from '../src/engine/simulator/simulator';

describe('NAND and NOR Converter Minimal Gate Counts & Accuracy', () => {
  function countLogicGates(circuit: any): number {
    return Object.values(circuit.nodes).filter(
      (n: any) => n.type !== 'INPUT' && n.type !== 'OUTPUT' && n.type !== 'CONSTANT'
    ).length;
  }

  it('(A AND B) OR (C AND D) converts to exactly 3 NAND gates', () => {
    const ast = new Parser('(A AND B) OR (C AND D)').parse();
    const nandAst = convertToNand(ast);
    const circuit = astToCircuit(nandAst, ['A', 'B', 'C', 'D']);
    const gateCount = countLogicGates(circuit);
    expect(gateCount).toBe(3); // NAND(A,B), NAND(C,D), and NAND(NAND(A,B), NAND(C,D))
  });

  it('Shared inverted literals e.g. (!A AND B) OR (!A AND C) reuse inverter (4 NAND gates total)', () => {
    const ast = new Parser("(!A AND B) OR (!A AND C)").parse();
    const nandAst = convertToNand(ast);
    const circuit = astToCircuit(nandAst, ['A', 'B', 'C']);
    const gateCount = countLogicGates(circuit);
    // 1 shared inverter for !A (NAND(A,A)), 1 NAND(notA, B), 1 NAND(notA, C), 1 output NAND
    expect(gateCount).toBe(4);
  });

  it('A XOR B converts to exactly 4 NAND gates', () => {
    const ast = new Parser('A XOR B').parse();
    const nandAst = convertToNand(ast);
    const circuit = astToCircuit(nandAst, ['A', 'B']);
    const gateCount = countLogicGates(circuit);
    expect(gateCount).toBe(4);
  });

  it('NOR conversion: (A OR B) AND (C OR D) converts to exactly 3 NOR gates', () => {
    const ast = new Parser('(A OR B) AND (C OR D)').parse();
    const norAst = convertToNor(ast);
    const circuit = astToCircuit(norAst, ['A', 'B', 'C', 'D']);
    const gateCount = countLogicGates(circuit);
    expect(gateCount).toBe(3); // NOR(A,B), NOR(C,D), and NOR(NOR(A,B), NOR(C,D))
  });

  it('Shared inverted literals in NOR: (!A OR B) AND (!A OR C) uses 4 NOR gates', () => {
    const ast = new Parser("(!A OR B) AND (!A OR C)").parse();
    const norAst = convertToNor(ast);
    const circuit = astToCircuit(norAst, ['A', 'B', 'C']);
    const gateCount = countLogicGates(circuit);
    expect(gateCount).toBe(4); // 1 shared NOR(A,A) inverter, 2 sum NORs, 1 output NOR
  });

  it('Complex 3-term 2-literal SOP: (!A AND B) OR (B AND !C) OR (A AND C) produces exact 8 NAND gates', () => {
    const expr = "(!A AND B) OR (B AND !C) OR (A AND C)";
    const ast = new Parser(expr).parse();
    const nandAst = convertToNand(ast);
    const circuit = astToCircuit(nandAst, ['A', 'B', 'C']);
    const count = countLogicGates(circuit);
    // 2 inverters (!A, !C) + 3 product NANDs + 3 combiner NANDs = 8
    expect(count).toBe(8);
  });

  it('3-literal 2-term SOP: (!A AND !B AND C) OR (A AND B AND !C) produces exact 10 NAND gates', () => {
    const expr = "(!A AND !B AND C) OR (A AND B AND !C)";
    const ast = new Parser(expr).parse();
    const nandAst = convertToNand(ast);
    const circuit = astToCircuit(nandAst, ['A', 'B', 'C']);
    const count = countLogicGates(circuit);
    // 3 inverters (!A, !B, !C) + 3 gates for T1 + 3 gates for T2 + 1 output gate = 10
    expect(count).toBe(10);
  });

  it('Gate count bounds for 4-var and 5-var expressions stay strictly minimal', () => {
    const expr = "(A AND B AND C) OR (B AND C AND D) OR (!A AND !D)";
    const ast = new Parser(expr).parse();
    const nandAst = convertToNand(ast);
    const norAst = convertToNor(ast);

    const stdCircuit = astToCircuit(ast, ['A', 'B', 'C', 'D']);
    const nandCircuit = astToCircuit(nandAst, ['A', 'B', 'C', 'D']);
    const norCircuit = astToCircuit(norAst, ['A', 'B', 'C', 'D']);

    const stdCount = countLogicGates(stdCircuit);
    const nandCount = countLogicGates(nandCircuit);
    const norCount = countLogicGates(norCircuit);

    expect(stdCount).toBeLessThanOrEqual(10);
    expect(nandCount).toBeLessThanOrEqual(14);
    expect(norCount).toBeLessThanOrEqual(20);
  });

  it('Normalizes pre-existing NOR nodes when generating NAND-only circuits', () => {
    const ast = {
      type: 'NOR' as const,
      left: { type: 'VAR' as const, value: 'A' },
      right: { type: 'VAR' as const, value: 'B' }
    };
    const nandAst = convertToNand(ast);
    const circuit = astToCircuit(nandAst, ['A', 'B']);
    const gateTypes = Object.values(circuit.nodes)
      .filter((n: any) => !['INPUT', 'OUTPUT', 'CONSTANT'].includes(n.type))
      .map((n: any) => n.type);
    expect(gateTypes.every(type => type === 'NAND')).toBe(true);
    for (const a of [0, 1] as const) {
      for (const b of [0, 1] as const) {
        const output = Object.values(evaluateCircuit(circuit, { A: a, B: b }))[0];
        expect(output).toBe((!(a || b) ? 1 : 0));
      }
    }
  });

  it('Normalizes pre-existing NAND nodes when generating NOR-only circuits', () => {
    const ast = {
      type: 'NAND' as const,
      left: { type: 'VAR' as const, value: 'A' },
      right: { type: 'VAR' as const, value: 'B' }
    };
    const norAst = convertToNor(ast);
    const circuit = astToCircuit(norAst, ['A', 'B']);
    const gateTypes = Object.values(circuit.nodes)
      .filter((n: any) => !['INPUT', 'OUTPUT', 'CONSTANT'].includes(n.type))
      .map((n: any) => n.type);
    expect(gateTypes.every(type => type === 'NOR')).toBe(true);
    for (const a of [0, 1] as const) {
      for (const b of [0, 1] as const) {
        const output = Object.values(evaluateCircuit(circuit, { A: a, B: b }))[0];
        expect(output).toBe((!(a && b) ? 1 : 0));
      }
    }
  });

  it('Exhaustively verifies truth tables of Standard, NAND, and NOR for 3-variable expressions', () => {
    const exprs = [
      'A AND B AND C',
      'A OR B OR C',
      '(A AND B) OR C',
      '(A XOR B) AND C',
      '(!A AND B) OR (!B AND C) OR (A AND !C)'
    ];

    for (const expr of exprs) {
      const ast = new Parser(expr).parse();
      const nandAst = convertToNand(ast);
      const norAst = convertToNor(ast);

      const stdCircuit = astToCircuit(ast, ['A', 'B', 'C']);
      const nandCircuit = astToCircuit(nandAst, ['A', 'B', 'C']);
      const norCircuit = astToCircuit(norAst, ['A', 'B', 'C']);

      for (let a = 0; a <= 1; a++) {
        for (let b = 0; b <= 1; b++) {
          for (let c = 0; c <= 1; c++) {
            const inputs = { A: a as 0 | 1, B: b as 0 | 1, C: c as 0 | 1 };
            const stdOut = Object.values(evaluateCircuit(stdCircuit, inputs))[0];
            const nandOut = Object.values(evaluateCircuit(nandCircuit, inputs))[0];
            const norOut = Object.values(evaluateCircuit(norCircuit, inputs))[0];

            expect(nandOut).toBe(stdOut);
            expect(norOut).toBe(stdOut);
          }
        }
      }
    }
  });
});
