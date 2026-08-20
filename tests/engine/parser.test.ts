import { describe, it, expect } from 'vitest';
import { Parser } from '../../src/engine/expression/parser';

describe('Expression Parser', () => {
  it('parses single variable', () => {
    const parser = new Parser('A');
    expect(parser.parse()).toEqual({ type: 'VAR', value: 'A' });
  });

  it('parses NOT', () => {
    const p1 = new Parser("A'");
    expect(p1.parse()).toEqual({ type: 'NOT', left: { type: 'VAR', value: 'A' } });

    const p2 = new Parser("!A");
    expect(p2.parse()).toEqual({ type: 'NOT', left: { type: 'VAR', value: 'A' } });
  });

  it('parses implicit AND', () => {
    const parser = new Parser('AB');
    expect(parser.parse()).toEqual({
      type: 'AND',
      left: { type: 'VAR', value: 'A' },
      right: { type: 'VAR', value: 'B' }
    });
  });

  it('respects precedence: NOT > AND > OR', () => {
    const parser = new Parser("A' + BC");
    // Should be OR(NOT(A), AND(B,C))
    expect(parser.parse()).toEqual({
      type: 'OR',
      left: { type: 'NOT', left: { type: 'VAR', value: 'A' } },
      right: {
        type: 'AND',
        left: { type: 'VAR', value: 'B' },
        right: { type: 'VAR', value: 'C' }
      }
    });
  });
  
  it('parses constants and known multi-character variables without breaking compact notation', () => {
    expect(new Parser('1').parse()).toEqual({ type: 'CONSTANT', value: 1 });
    expect(new Parser('IN1 AND !X2', ['IN1', 'X2']).parse()).toEqual({
      type: 'AND',
      left: { type: 'VAR', value: 'IN1' },
      right: { type: 'NOT', left: { type: 'VAR', value: 'X2' } }
    });
    expect(new Parser('AB').parse()).toEqual({
      type: 'AND',
      left: { type: 'VAR', value: 'A' },
      right: { type: 'VAR', value: 'B' }
    });
  });

  it('handles parentheses', () => {
    const parser = new Parser("A(B+C)");
    expect(parser.parse()).toEqual({
      type: 'AND',
      left: { type: 'VAR', value: 'A' },
      right: {
        type: 'OR',
        left: { type: 'VAR', value: 'B' },
        right: { type: 'VAR', value: 'C' }
      }
    });
  });
});
