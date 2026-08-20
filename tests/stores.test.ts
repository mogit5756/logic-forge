import { beforeEach, describe, expect, it } from 'vitest';
import { useLogicStore } from '../src/stores/useLogicStore';

describe('Logic store input invariants', () => {
  beforeEach(() => {
    useLogicStore.getState().setNumVariables(3);
    useLogicStore.getState().setInputMode('truth_table');
  });

  it('clamps variable dimensions to the supported 2–6 range', () => {
    useLogicStore.getState().setNumVariables(99);
    expect(useLogicStore.getState().numVariables).toBe(6);
    expect(useLogicStore.getState().truthTable).toHaveLength(64);

    useLogicStore.getState().setNumVariables(1);
    expect(useLogicStore.getState().numVariables).toBe(2);
    expect(useLogicStore.getState().truthTable).toHaveLength(4);
  });

  it('normalizes and deconflicts minterm/maxterm and dont-care indices', () => {
    useLogicStore.getState().setMintermsMaxterms([1, 1, -1, 99], [1, 2, 2]);
    const state = useLogicStore.getState();
    expect(state.minterms).toEqual([1]);
    expect(state.dontCares).toEqual([2]);
    expect(state.maxterms).toEqual([0, 3, 4, 5, 6, 7]);
    expect(state.truthTable[1].output).toBe(1);
    expect(state.truthTable[2].output).toBe('X');
  });

  it('normalizes long word-problem variable names into parser-safe aliases', () => {
    useLogicStore.getState().applyWordProblemLogic(
      { MOTION: 'Motion is active', NIGHT: 'It is nighttime' },
      '(MOTION AND NIGHT)'
    );
    const state = useLogicStore.getState();
    expect(state.variableNames.slice(0, 2)).toEqual(['A', 'B']);
    expect(state.expressionStr).toBe('(A AND B)');
    expect(state.verificationResult?.matched).toBe(true);
    expect(state.error).toBeNull();
  });
});
