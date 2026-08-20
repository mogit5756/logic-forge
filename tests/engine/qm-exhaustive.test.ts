import { describe, expect, it } from 'vitest';
import { Parser } from '../../src/engine/expression/parser';
import { astToCircuit } from '../../src/engine/circuit-gen/generator';
import { evaluateCircuit } from '../../src/engine/simulator/simulator';
import { qmFormatPOS, qmFormatSOP, simplifyQM } from '../../src/engine/quine-mccluskey/qm';

function astForExpression(expression: string) {
  return expression === '0' || expression === '1'
    ? { type: 'CONSTANT' as const, value: Number(expression) as 0 | 1 }
    : new Parser(expression, ['A', 'B', 'C']).parse();
}

describe('Exhaustive 3-variable minimization', () => {
  it('preserves every truth function through SOP and POS formatting', () => {
    const variables = ['A', 'B', 'C'];
    for (let functionMask = 0; functionMask < 256; functionMask++) {
      const minterms = Array.from({ length: 8 }, (_, index) => index)
        .filter(index => ((functionMask >> index) & 1) === 1);
      const maxterms = Array.from({ length: 8 }, (_, index) => index)
        .filter(index => ((functionMask >> index) & 1) === 0);

      for (const [mode, expression] of [
        ['sop', qmFormatSOP(simplifyQM(minterms, [], 3), variables)],
        ['pos', qmFormatPOS(simplifyQM(maxterms, [], 3), variables)]
      ] as const) {
        const circuit = astToCircuit(astForExpression(expression), variables);
        for (let index = 0; index < 8; index++) {
          const inputs = {
            A: ((index >> 2) & 1) as 0 | 1,
            B: ((index >> 1) & 1) as 0 | 1,
            C: (index & 1) as 0 | 1
          };
          const output = Object.values(evaluateCircuit(circuit, inputs))[0];
          expect(output, `${mode} mask=${functionMask}, expression=${expression}, index=${index}`).toBe(((functionMask >> index) & 1) as 0 | 1);
        }
      }
    }
  });
});
