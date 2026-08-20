export interface SharedState {
  tab?: 'simplifier' | 'arithmetic';
  mode?: 'truth_table' | 'min_max' | 'expression' | 'word_problem';
  n?: number;
  vars?: string[];
  expr?: string;
  min?: number[];
  max?: number[];
  dc?: number[];
  lab?: string;
  w?: number;
  a?: number;
  b?: number;
  cin?: number;
}

function parseInteger(value: string | null): number | undefined {
  if (value === null || !/^-?\d+$/.test(value.trim())) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function parseIndexList(value: string | null): number[] | undefined {
  if (value === null || value.trim() === '') return [];
  return [...new Set(value.split(',')
    .map(item => parseInteger(item.trim()))
    .filter((item): item is number => item !== undefined))];
}

export function parseUrlState(): SharedState | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const stateKeys = ['tab', 'mode', 'lab', 'expr', 'n', 'vars', 'min', 'max', 'dc', 'w', 'a', 'b', 'cin'];
  if (!stateKeys.some(key => params.has(key))) return null;

  const res: SharedState = {};
  const tab = params.get('tab');
  if (tab === 'simplifier' || tab === 'arithmetic') res.tab = tab;

  const mode = params.get('mode');
  if (mode === 'truth_table' || mode === 'min_max' || mode === 'expression' || mode === 'word_problem') res.mode = mode;

  const n = parseInteger(params.get('n'));
  if (n !== undefined) res.n = n;

  if (params.has('vars')) {
    res.vars = params.get('vars')!
      .split(',')
      .map(value => value.trim().toUpperCase())
      .filter(Boolean);
  }
  if (params.has('expr')) res.expr = params.get('expr') || '';

  const min = parseIndexList(params.get('min'));
  const max = parseIndexList(params.get('max'));
  const dc = parseIndexList(params.get('dc'));
  if (min !== undefined) res.min = min;
  if (max !== undefined) res.max = max;
  if (dc !== undefined) res.dc = dc;

  if (params.has('lab')) res.lab = params.get('lab') || undefined;
  const w = parseInteger(params.get('w'));
  const a = parseInteger(params.get('a'));
  const b = parseInteger(params.get('b'));
  const cin = parseInteger(params.get('cin'));
  if (w !== undefined) res.w = w;
  if (a !== undefined) res.a = a;
  if (b !== undefined) res.b = b;
  if (cin !== undefined) res.cin = cin;

  return res;
}

export function updateUrlParams(state: Record<string, string | number | undefined | null>) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  const newUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  window.history.replaceState(null, '', newUrl);
}
