export function simplifyQM(
  minterms: number[],
  dontCares: number[],
  numVariables: number,
  timeoutMs: number = 2000
): string[] {
  if (!Number.isInteger(numVariables) || numVariables < 1 || numVariables > 6) {
    throw new Error('Quine–McCluskey supports between 1 and 6 variables.');
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error('Simplification timeout must be a positive number.');
  }

  const maxTerms = 1 << numVariables;
  const normalize = (values: number[]) => [...new Set(values.filter(value => Number.isInteger(value) && value >= 0 && value < maxTerms))];
  const normalizedMinterms = normalize(minterms);
  const normalizedDontCares = normalize(dontCares).filter(value => !normalizedMinterms.includes(value));

  // Return early for edge cases. All don't-cares may be assigned to 1.
  if (normalizedMinterms.length + normalizedDontCares.length === maxTerms) return ['1'];
  if (normalizedMinterms.length === 0) return [];

  const startTime = Date.now();
  const checkTimeout = () => {
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`Quine-McCluskey simplification timed out after ${timeoutMs}ms. Expression is too complex.`);
    }
  };

  // 1. Group implicants by number of 1s
  let currentImplicants: Set<string> = new Set();
  const allTerms = [...new Set([...normalizedMinterms, ...normalizedDontCares])];
  const implicantMinterms = new Map<string, number[]>();

  for (const m of allTerms) {
    const bin = m.toString(2).padStart(numVariables, '0');
    currentImplicants.add(bin);
    implicantMinterms.set(bin, [m]);
  }

  const primeImplicants: Set<string> = new Set();
  
  // Memoize combinations
  const combineMemo = new Map<string, string | null>();
  const combine = (a: string, b: string): string | null => {
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    if (combineMemo.has(key)) return combineMemo.get(key)!;
    
    let diffCount = 0;
    let res = '';
    for (let i = 0; i < numVariables; i++) {
      if (a[i] === b[i]) {
        res += a[i];
      } else if (a[i] === '-' || b[i] === '-') {
        combineMemo.set(key, null);
        return null;
      } else {
        diffCount++;
        res += '-';
      }
      if (diffCount > 1) {
        combineMemo.set(key, null);
        return null;
      }
    }
    combineMemo.set(key, res);
    return res;
  };

  while (currentImplicants.size > 0) {
    checkTimeout();
    const nextImplicants: Set<string> = new Set();
    const combinedThisRound: Set<string> = new Set();
    
    // Group by number of 1s to optimize combination step
    const groups: string[][] = Array.from({ length: numVariables + 1 }, () => []);
    for (const imp of currentImplicants) {
      const onesCount = (imp.match(/1/g) || []).length;
      groups[onesCount].push(imp);
    }
    
    for (let i = 0; i < numVariables; i++) {
      for (const a of groups[i]) {
        for (const b of groups[i + 1]) {
          const combined = combine(a, b);
          if (combined) {
            nextImplicants.add(combined);
            combinedThisRound.add(a);
            combinedThisRound.add(b);
            
            // Merge coverage from every pair that produces this implicant.
            const mins = new Set([
              ...(implicantMinterms.get(combined) ?? []),
              ...(implicantMinterms.get(a) ?? []),
              ...(implicantMinterms.get(b) ?? [])
            ]);
            implicantMinterms.set(combined, Array.from(mins));
          }
        }
      }
    }
    
    for (const imp of currentImplicants) {
      if (!combinedThisRound.has(imp)) {
        primeImplicants.add(imp);
      }
    }
    currentImplicants = nextImplicants;
  }
  
  // 2. Prime Implicant Chart
  const chart: Record<number, string[]> = {};
  for (const m of normalizedMinterms) {
    chart[m] = [];
  }
  
  const piList = Array.from(primeImplicants);
  for (const pi of piList) {
    const coveredMins = implicantMinterms.get(pi)!;
    for (const m of coveredMins) {
      if (chart[m] !== undefined) {
        chart[m].push(pi);
      }
    }
  }
  
  // 3. Find Essential Prime Implicants
  const essentialPIs = new Set<string>();
  let uncoveredMinterms = new Set(normalizedMinterms);
  
  for (const m of normalizedMinterms) {
    if (chart[m].length === 1) {
      const epi = chart[m][0];
      essentialPIs.add(epi);
    }
  }
  
  for (const epi of essentialPIs) {
    const covered = implicantMinterms.get(epi)!;
    for (const c of covered) {
      uncoveredMinterms.delete(c);
    }
  }
  
  if (uncoveredMinterms.size === 0) {
    return Array.from(essentialPIs);
  }
  
  // 4. Petrick's Method
  checkTimeout();
  const petricksExpression: string[][] = [];
  for (const m of uncoveredMinterms) {
    petricksExpression.push(chart[m]);
  }
  
  let sop: Set<string>[] = [new Set(petricksExpression[0])];
  
  for (let i = 1; i < petricksExpression.length; i++) {
    checkTimeout();
    const currentSum = petricksExpression[i];
    const newSop: Set<string>[] = [];
    
    for (const product of sop) {
      for (const term of currentSum) {
        const newProduct = new Set(product);
        newProduct.add(term);
        newSop.push(newProduct);
      }
    }
    
    const minimalSop: Set<string>[] = [];
    for (const p of newSop) {
      let isSuper = false;
      for (const other of newSop) {
        if (p !== other && other.size < p.size) {
           let subset = true;
           for (const t of other) {
             if (!p.has(t)) { subset = false; break; }
           }
           if (subset) { isSuper = true; break; }
        }
      }
      if (!isSuper) minimalSop.push(p);
    }
    sop = minimalSop;
  }
  
  if (sop.length === 0) {
    return Array.from(essentialPIs);
  }
  
  let bestProduct = sop[0];
  let minTerms = bestProduct.size;
  let maxLiterals = 0;
  
  const getLiteralsCount = (pi: string) => (pi.match(/0|1/g) || []).length;
  
  for (const product of sop) {
    if (product.size < minTerms) {
      bestProduct = product;
      minTerms = product.size;
      let litCount = 0;
      for (const p of product) litCount += getLiteralsCount(p);
      maxLiterals = litCount;
    } else if (product.size === minTerms) {
      let litCount = 0;
      for (const p of product) litCount += getLiteralsCount(p);
      if (litCount > maxLiterals) {
        bestProduct = product;
        maxLiterals = litCount;
      }
    }
  }
  
  for (const p of bestProduct) {
    essentialPIs.add(p);
  }
  
  return Array.from(essentialPIs);
}

export function implicantToExpression(implicant: string, variables: string[]): string {
  if (implicant === '1') return '1';
  let expr = '';
  for (let i = 0; i < implicant.length; i++) {
    if (implicant[i] === '1') {
      expr += variables[i];
    } else if (implicant[i] === '0') {
      expr += variables[i] + "'";
    }
  }
  return expr || '1';
}

export function qmFormatSOP(implicants: string[], variables: string[]): string {
  if (implicants.length === 0) return '0';
  if (implicants.length === 1 && implicants[0] === '1') return '1';
  return implicants.map(i => implicantToExpression(i, variables)).join(' + ');
}

export function implicantToExpressionPOS(implicant: string, variables: string[]): string {
  if (implicant === '1') return '0'; // Since it covers all maxterms, output is 0
  let terms: string[] = [];
  for (let i = 0; i < implicant.length; i++) {
    if (implicant[i] === '1') {
      terms.push(variables[i] + "'");
    } else if (implicant[i] === '0') {
      terms.push(variables[i]);
    }
  }
  if (terms.length === 0) return '0';
  if (terms.length === 1) return terms[0];
  return `(${terms.join(' + ')})`;
}

export function qmFormatPOS(implicants: string[], variables: string[]): string {
  if (implicants.length === 0) return '1';
  if (implicants.length === 1 && implicants[0] === '1') return '0';
  
  // if all are single terms without parens, we don't need outer parens, but they already have them if len > 1
  return implicants.map(i => implicantToExpressionPOS(i, variables)).join('');
}
