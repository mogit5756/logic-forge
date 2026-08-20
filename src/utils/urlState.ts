export interface SharedState {
  tab?: 'simplifier' | 'arithmetic';
  // Simplifier params
  mode?: string;
  n?: number;
  vars?: string[];
  expr?: string;
  min?: number[];
  max?: number[];
  dc?: number[];
  // Arithmetic params
  lab?: string;
  w?: number;
  a?: number;
  b?: number;
  cin?: number;
}

export function parseUrlState(): SharedState | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (!params.has('tab') && !params.has('mode') && !params.has('lab') && !params.has('expr')) {
    return null;
  }

  const res: SharedState = {};
  if (params.has('tab')) res.tab = params.get('tab') as 'simplifier' | 'arithmetic';
  if (params.has('mode')) res.mode = params.get('mode')!;
  if (params.has('n')) res.n = parseInt(params.get('n')!) || 3;
  if (params.has('vars')) res.vars = params.get('vars')!.split(',').map(s => s.trim().toUpperCase());
  if (params.has('expr')) res.expr = params.get('expr')!;
  if (params.has('min')) res.min = params.get('min')!.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
  if (params.has('max')) res.max = params.get('max')!.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
  if (params.has('dc')) res.dc = params.get('dc')!.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));

  if (params.has('lab')) res.lab = params.get('lab')!;
  if (params.has('w')) res.w = parseInt(params.get('w')!) || 4;
  if (params.has('a')) res.a = parseInt(params.get('a')!) || 0;
  if (params.has('b')) res.b = parseInt(params.get('b')!) || 0;
  if (params.has('cin')) res.cin = parseInt(params.get('cin')!) || 0;

  return res;
}

export function updateUrlParams(state: Record<string, string | number | undefined | null>) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();
  Object.entries(state).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      params.set(k, String(v));
    }
  });
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState(null, '', newUrl);
}
