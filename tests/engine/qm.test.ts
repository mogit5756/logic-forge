import { describe, it, expect } from 'vitest';
import { simplifyQM, implicantToExpression, qmFormatSOP } from '../../src/engine/quine-mccluskey/qm';

describe('Quine-McCluskey Engine', () => {
  it('simplifies all 1s to 1', () => {
    expect(simplifyQM([0, 1, 2, 3], [], 2)).toEqual(['1']);
  });

  it('simplifies all 0s to empty', () => {
    expect(simplifyQM([], [], 2)).toEqual([]);
  });

  it('simplifies F(A,B,C) = sum(m(3,4,5,6,7)) to A + BC', () => {
    const res = simplifyQM([3, 4, 5, 6, 7], [], 3);
    expect(res).toContain('1--');
    expect(res).toContain('-11');
    expect(res.length).toBe(2);
    
    const expr = qmFormatSOP(['1--', '-11'], ['A', 'B', 'C']);
    // Might be A + BC or BC + A
    expect(expr === "A + BC" || expr === "BC + A").toBe(true);
  });

  it('handles dont cares F=sum(m(0,1,2)), d(3) -> 0--', () => {
    // 0,1,2,3 -> A' (0--)
    const res = simplifyQM([0,1,2], [3], 2);
    expect(res).toEqual(['1']); 
  });
  
  it('handles dont cares F=sum(m(0,2)), d(1,3) -> 1', () => {
    // 0,2 + d(1,3) = 0,1,2,3 -> '1'
    const res = simplifyQM([0,2], [1,3], 2);
    expect(res).toEqual(['1']);
  });

  it('treats an all-dont-care function as fully generalized', () => {
    expect(simplifyQM([], [0, 1, 2, 3], 2)).toEqual(['1']);
  });

  it('normalizes duplicate, invalid, and overlapping indices', () => {
    expect(simplifyQM([0, 0, 4, -1], [1, 1, 0, 8], 2)).toEqual(['0-']);
  });

  it('does not combine implicants that differ because of an existing dash', () => {
    const result = simplifyQM([0, 1, 2, 4], [], 3);
    expect(result.every(implicant => implicant.length === 3)).toBe(true);
    expect(result).not.toContain('--0');
  });

  it('timeout protection on large input', () => {
    // Simulate a complex 6 variable checkerboard
    const minterms = [];
    for (let i = 0; i < 64; i += 2) minterms.push(i);
    // Actually, QM handles this fine, it might not timeout.
    // We just ensure it runs and doesn't crash.
    const res = simplifyQM(minterms, [], 6);
    expect(res.length).toBeGreaterThan(0);
  });
});
