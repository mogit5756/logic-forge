import { describe, it, expect } from 'vitest';
import { FullAdderCircuit, FullSubtractorCircuit, buildRippleCarryAdder, buildTwosComplementSubtractor } from '../src/features/arithmetic/predefinedCircuits';
import { evaluateCircuitAllNodes } from '../src/engine/simulator/simulator';

describe('Arithmetic Circuits', () => {
  it('Full Adder calculates correct Sum and Cout for all 8 combinations', () => {
    const truthTable = [
      { A: 0, B: 0, CIN: 0, SUM: 0, COUT: 0 },
      { A: 0, B: 0, CIN: 1, SUM: 1, COUT: 0 },
      { A: 0, B: 1, CIN: 0, SUM: 1, COUT: 0 },
      { A: 0, B: 1, CIN: 1, SUM: 0, COUT: 1 },
      { A: 1, B: 0, CIN: 0, SUM: 1, COUT: 0 },
      { A: 1, B: 0, CIN: 1, SUM: 0, COUT: 1 },
      { A: 1, B: 1, CIN: 0, SUM: 0, COUT: 1 },
      { A: 1, B: 1, CIN: 1, SUM: 1, COUT: 1 },
    ];

    truthTable.forEach(({ A, B, CIN, SUM, COUT }) => {
      const result = evaluateCircuitAllNodes(FullAdderCircuit, { A, B, CIN });
      expect(result['SUM']).toBe(SUM);
      expect(result['COUT']).toBe(COUT);
    });
  });

  it('Full Subtractor calculates correct Diff and Bout for all 8 combinations', () => {
    const truthTable = [
      { A: 0, B: 0, BIN: 0, DIFF: 0, BOUT: 0 },
      { A: 0, B: 0, BIN: 1, DIFF: 1, BOUT: 1 },
      { A: 0, B: 1, BIN: 0, DIFF: 1, BOUT: 1 },
      { A: 0, B: 1, BIN: 1, DIFF: 0, BOUT: 1 },
      { A: 1, B: 0, BIN: 0, DIFF: 1, BOUT: 0 },
      { A: 1, B: 0, BIN: 1, DIFF: 0, BOUT: 0 },
      { A: 1, B: 1, BIN: 0, DIFF: 0, BOUT: 0 },
      { A: 1, B: 1, BIN: 1, DIFF: 1, BOUT: 1 },
    ];

    truthTable.forEach(({ A, B, BIN, DIFF, BOUT }) => {
      const result = evaluateCircuitAllNodes(FullSubtractorCircuit, { A, B, BIN });
      expect(result['DIFF']).toBe(DIFF);
      expect(result['BOUT']).toBe(BOUT);
    });
  });

  it('4-bit Ripple Carry Adder correctly adds without carry', () => {
    const rca = buildRippleCarryAdder(4);
    // 5 (0101) + 2 (0010) = 7 (0111)
    const result = evaluateCircuitAllNodes(rca, { A0: 1, A1: 0, A2: 1, A3: 0, B0: 0, B1: 1, B2: 0, B3: 0, CIN: 0 });
    expect(result['SUM0']).toBe(1);
    expect(result['SUM1']).toBe(1);
    expect(result['SUM2']).toBe(1);
    expect(result['SUM3']).toBe(0);
    expect(result['COUT']).toBe(0);
  });

  it('4-bit Ripple Carry Adder correctly adds with a single carry', () => {
    const rca = buildRippleCarryAdder(4);
    // 3 (0011) + 5 (0101) = 8 (1000)
    const result = evaluateCircuitAllNodes(rca, { A0: 1, A1: 1, A2: 0, A3: 0, B0: 1, B1: 0, B2: 1, B3: 0, CIN: 0 });
    expect(result['SUM0']).toBe(0);
    expect(result['SUM1']).toBe(0);
    expect(result['SUM2']).toBe(0);
    expect(result['SUM3']).toBe(1);
    expect(result['COUT']).toBe(0);
  });

  it('4-bit Ripple Carry Adder full ripple (all 1s + 1)', () => {
    const rca = buildRippleCarryAdder(4);
    // 15 (1111) + 0 with Cin=1 = 16 (Cout=1, Sum=0000)
    const result = evaluateCircuitAllNodes(rca, { A0: 1, A1: 1, A2: 1, A3: 1, B0: 0, B1: 0, B2: 0, B3: 0, CIN: 1 });
    expect(result['SUM0']).toBe(0);
    expect(result['SUM1']).toBe(0);
    expect(result['SUM2']).toBe(0);
    expect(result['SUM3']).toBe(0);
    expect(result['COUT']).toBe(1);
  });

  it('8-bit Ripple Carry Adder full ripple (all 1s + 1)', () => {
    const rca = buildRippleCarryAdder(8);
    // 255 (11111111) + 0 with Cin=1 = 256 (Cout=1, Sum=00000000)
    const result = evaluateCircuitAllNodes(rca, { 
      A0: 1, A1: 1, A2: 1, A3: 1, A4: 1, A5: 1, A6: 1, A7: 1, 
      B0: 0, B1: 0, B2: 0, B3: 0, B4: 0, B5: 0, B6: 0, B7: 0, 
      CIN: 1 
    });
    for(let i=0; i<8; i++) {
        expect(result[`SUM${i}`]).toBe(0);
    }
    expect(result['COUT']).toBe(1);
  });

  it('4-bit Twos Complement Subtractor', () => {
    const sub = buildTwosComplementSubtractor(4);
    // 7 (0111) - 2 (0010) = 5 (0101)
    const result = evaluateCircuitAllNodes(sub, { A0: 1, A1: 1, A2: 1, A3: 0, B0: 0, B1: 1, B2: 0, B3: 0, CIN: 1 });
    expect(result['SUM0']).toBe(1);
    expect(result['SUM1']).toBe(0);
    expect(result['SUM2']).toBe(1);
    expect(result['SUM3']).toBe(0);
    expect(result['COUT']).toBe(1); // Borrow/sign
  });
});
