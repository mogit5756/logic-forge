import React from 'react';

export interface ArithmeticExplanationProps {
  labId: string;
  bitWidth: number;
  inputA: number;
  inputB: number;
  carryIn: number;
  finalNodeValues: Record<string, 0 | 1>;
}

export const ArithmeticExplanation: React.FC<ArithmeticExplanationProps> = ({
  labId,
  bitWidth,
  inputA,
  inputB,
  carryIn,
}) => {
  const getBit = (val: number, bit: number): 0 | 1 => ((val >> bit) & 1) as 0 | 1;

  switch (labId) {
    case 'half-adder': {
      const a = getBit(inputA, 0);
      const b = getBit(inputB, 0);
      const sum = a ^ b;
      const carry = a & b;
      return (
        <div className="space-y-6 text-sm text-surface-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-base text-surface-900 mb-1">1. Overview</h4>
            <p>
              A <strong>Half Adder</strong> is the fundamental building block of digital addition. It takes two single-bit binary inputs (<code className="font-mono text-primary-700">A</code> and <code className="font-mono text-primary-700">B</code>) and computes their arithmetic sum, producing a 2-bit binary output (<code className="font-mono text-primary-700">CARRY SUM</code>). It is called "half" because it does not accept a carry-in from a preceding stage.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">2. Signal Legend & Meaning</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><code className="font-mono font-bold text-surface-900">A</code>: 1-bit input addend.</li>
              <li><code className="font-mono font-bold text-surface-900">B</code>: 1-bit input addend.</li>
              <li><code className="font-mono font-bold text-surface-900">XOR1</code>: XOR gate computing the modulo-2 sum bit (A ⊕ B).</li>
              <li><code className="font-mono font-bold text-surface-900">AND1</code>: AND gate detecting when both inputs are 1 to produce a carry (A · B).</li>
              <li><code className="font-mono font-bold text-surface-900">SUM</code> (S): LSB output representing the sum bit (weight 2⁰ = 1).</li>
              <li><code className="font-mono font-bold text-surface-900">CARRY</code> (C): MSB output representing carry overflow (weight 2¹ = 2).</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-1">3. Logic Equations & Derivation</h4>
            <div className="bg-surface-100 p-3 rounded font-mono text-xs space-y-1 text-surface-800 border">
              <div>SUM = A ⊕ B = (A · B') + (A' · B)</div>
              <div>CARRY = A · B</div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">4. Live Bitwise Worked Trace (Current Inputs)</h4>
            <div className="bg-primary-50/60 p-4 rounded-lg border border-primary-200 font-mono text-xs space-y-2 text-primary-950">
              <div className="flex justify-between border-b border-primary-200 pb-1">
                <span>Input A = {a}</span>
                <span>Input B = {b}</span>
              </div>
              <div>• XOR1 (Sum): {a} ⊕ {b} = <strong>{sum}</strong> → <span className="text-primary-700 font-bold">SUM = {sum}</span></div>
              <div>• AND1 (Carry): {a} · {b} = <strong>{carry}</strong> → <span className="text-primary-700 font-bold">CARRY = {carry}</span></div>
              <div className="pt-1 border-t border-primary-200 text-xs">
                <strong>Decimal Verification:</strong> {a} + {b} = {a + b} (Binary output: <code className="bg-white px-1.5 py-0.5 rounded border">{carry}{sum}₂</code>)
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'full-adder': {
      const a = getBit(inputA, 0);
      const b = getBit(inputB, 0);
      const cin = getBit(carryIn, 0);
      const xor1 = a ^ b;
      const and1 = a & b;
      const sum = xor1 ^ cin;
      const and2 = xor1 & cin;
      const cout = and1 | and2;

      return (
        <div className="space-y-6 text-sm text-surface-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-base text-surface-900 mb-1">1. Overview</h4>
            <p>
              A <strong>Full Adder</strong> adds three 1-bit binary values: two input bits (<code className="font-mono text-primary-700">A</code>, <code className="font-mono text-primary-700">B</code>) and a carry-in bit (<code className="font-mono text-primary-700">Cin</code>) from a lower-order stage. This allows full adders to be cascaded into multi-bit adders.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">2. Signal Legend & Meaning</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><code className="font-mono font-bold text-surface-900">A</code>, <code className="font-mono font-bold text-surface-900">B</code>: Primary 1-bit input operands.</li>
              <li><code className="font-mono font-bold text-surface-900">CIN</code>: Incoming carry from the preceding less-significant bit stage.</li>
              <li><code className="font-mono font-bold text-surface-900">XOR1</code>: First-stage sum (A ⊕ B, Half Adder 1 sum).</li>
              <li><code className="font-mono font-bold text-surface-900">AND1</code>: First-stage carry (A · B, Half Adder 1 carry).</li>
              <li><code className="font-mono font-bold text-surface-900">XOR2</code>: Final sum (XOR1 ⊕ Cin, Half Adder 2 sum).</li>
              <li><code className="font-mono font-bold text-surface-900">AND2</code>: Second-stage carry (XOR1 · Cin, Half Adder 2 carry).</li>
              <li><code className="font-mono font-bold text-surface-900">OR1</code>: Combines the two carry sources (AND1 + AND2).</li>
              <li><code className="font-mono font-bold text-surface-900">SUM</code> (S): 1-bit output sum.</li>
              <li><code className="font-mono font-bold text-surface-900">COUT</code>: Carry-out propagating to the next bit stage.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-1">3. How it's Built & Logic Equations</h4>
            <div className="bg-surface-100 p-3 rounded font-mono text-xs space-y-1 text-surface-800 border">
              <div>SUM = (A ⊕ B) ⊕ Cin = A ⊕ B ⊕ Cin</div>
              <div>COUT = (A · B) + (Cin · (A ⊕ B))</div>
            </div>
            <p className="mt-2 text-xs text-surface-600">
              Constructed from two Half Adders: HA1 computes A + B, and HA2 adds Cin to HA1's sum. If either HA produces a carry, OR1 asserts <code className="font-mono">COUT</code>.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">4. Live Bitwise Worked Trace (Current Inputs)</h4>
            <div className="bg-primary-50/60 p-4 rounded-lg border border-primary-200 font-mono text-xs space-y-2 text-primary-950">
              <div className="flex justify-between border-b border-primary-200 pb-1">
                <span>A = {a}</span>
                <span>B = {b}</span>
                <span>Cin = {cin}</span>
              </div>
              <div>• Stage 1 (HA1): XOR1 = {a} ⊕ {b} = <strong>{xor1}</strong>, AND1 = {a} · {b} = <strong>{and1}</strong></div>
              <div>• Stage 2 (HA2): XOR2 = {xor1} ⊕ {cin} = <strong>{sum}</strong> → <span className="text-primary-700 font-bold">SUM = {sum}</span></div>
              <div>• Stage 2 Carry: AND2 = {xor1} · {cin} = <strong>{and2}</strong></div>
              <div>• Final Carry: OR1 = {and1} + {and2} = <strong>{cout}</strong> → <span className="text-primary-700 font-bold">COUT = {cout}</span></div>
              <div className="pt-1 border-t border-primary-200 text-xs">
                <strong>Decimal Verification:</strong> {a} + {b} + {cin} = {a + b + cin} (Binary output: <code className="bg-white px-1.5 py-0.5 rounded border">{cout}{sum}₂</code>)
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'ripple-adder': {
      const bitsA = Array.from({ length: bitWidth }, (_, i) => getBit(inputA, i));
      const bitsB = Array.from({ length: bitWidth }, (_, i) => getBit(inputB, i));
      
      const carries: number[] = [getBit(carryIn, 0)];
      const sums: number[] = [];
      for (let i = 0; i < bitWidth; i++) {
        const a = bitsA[i];
        const b = bitsB[i];
        const c = carries[i];
        const s = a ^ b ^ c;
        const cout = (a & b) | (c & (a ^ b));
        sums.push(s);
        carries.push(cout);
      }

      return (
        <div className="space-y-6 text-sm text-surface-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-base text-surface-900 mb-1">1. Overview</h4>
            <p>
              An <strong>{bitWidth}-bit Ripple-Carry Adder</strong> chains {bitWidth} Full Adders in series. Each Full Adder stage i computes sum bit S_i and generates a carry C_(i+1) that ripples directly into the carry-in of bit i+1.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">2. Signal Legend & Meaning</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><code className="font-mono font-bold text-surface-900">A0–A{bitWidth - 1}</code>: Bits of operand A (each bit i has place value 2^i).</li>
              <li><code className="font-mono font-bold text-surface-900">B0–B{bitWidth - 1}</code>: Bits of operand B (each bit i has place value 2^i).</li>
              <li><code className="font-mono font-bold text-surface-900">CIN</code>: Carry-in to bit 0 (C0).</li>
              <li><code className="font-mono font-bold text-surface-900">S0–S{bitWidth - 1}</code>: Individual output sum bits (S_i = A_i ⊕ B_i ⊕ C_i).</li>
              <li><code className="font-mono font-bold text-surface-900">COUT</code>: Final carry out (C_{bitWidth}) indicating overflow beyond {bitWidth} bits.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">3. Live Bit-by-Bit Carry Ripple Propagation</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono text-left border border-surface-200 rounded">
                <thead className="bg-surface-100 text-surface-800">
                  <tr>
                    <th className="p-2 border-b">Bit Stage (i)</th>
                    <th className="p-2 border-b">Weight (2^i)</th>
                    <th className="p-2 border-b">A[i]</th>
                    <th className="p-2 border-b">B[i]</th>
                    <th className="p-2 border-b">Cin (C_i)</th>
                    <th className="p-2 border-b font-bold text-primary-700">Sum (S_i)</th>
                    <th className="p-2 border-b font-bold text-primary-700">Cout (C_i+1)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-200">
                  {Array.from({ length: bitWidth }).map((_, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-surface-50"}>
                      <td className="p-2 font-bold">Bit {i}</td>
                      <td className="p-2">{1 << i}</td>
                      <td className="p-2">{bitsA[i]}</td>
                      <td className="p-2">{bitsB[i]}</td>
                      <td className="p-2">{carries[i]}</td>
                      <td className="p-2 font-bold text-primary-600">{sums[i]}</td>
                      <td className="p-2 font-bold text-amber-600">{carries[i + 1]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 p-3 bg-primary-50 rounded border border-primary-200 text-xs font-mono">
              <div>Operand A: {inputA} ({bitsA.slice().reverse().join('')}₂)</div>
              <div>Operand B: {inputB} ({bitsB.slice().reverse().join('')}₂)</div>
              <div>Carry In:  {carries[0]}</div>
              <div className="pt-1 border-t border-primary-200 font-bold">
                Total Sum: {inputA + inputB + carries[0]} (Binary: {carries[bitWidth]}{sums.slice().reverse().join('')}₂)
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'half-sub': {
      const a = getBit(inputA, 0);
      const b = getBit(inputB, 0);
      const diff = a ^ b;
      const notA = (1 - a) as 0 | 1;
      const bout = notA & b;

      return (
        <div className="space-y-6 text-sm text-surface-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-base text-surface-900 mb-1">1. Overview</h4>
            <p>
              A <strong>Half Subtractor</strong> subtracts 1-bit subtrahend <code className="font-mono text-primary-700">B</code> from 1-bit minuend <code className="font-mono text-primary-700">A</code> (A - B), producing a Difference (<code className="font-mono text-primary-700">DIFF</code>) and a Borrow-out (<code className="font-mono text-primary-700">BOUT</code>).
            </p>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">2. Signal Legend & Meaning</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><code className="font-mono font-bold text-surface-900">A</code>: Minuend bit.</li>
              <li><code className="font-mono font-bold text-surface-900">B</code>: Subtrahend bit.</li>
              <li><code className="font-mono font-bold text-surface-900">NOT_A</code>: Inverter computing A'.</li>
              <li><code className="font-mono font-bold text-surface-900">XOR1</code>: XOR gate computing Difference A ⊕ B.</li>
              <li><code className="font-mono font-bold text-surface-900">AND1</code>: AND gate computing Borrow A' · B (triggered only when 0 - 1).</li>
              <li><code className="font-mono font-bold text-surface-900">DIFF</code> (D): 1-bit difference bit.</li>
              <li><code className="font-mono font-bold text-surface-900">BOUT</code>: Borrow-out bit (indicating a borrow of 2 from the next column).</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-1">3. Logic Equations</h4>
            <div className="bg-surface-100 p-3 rounded font-mono text-xs space-y-1 text-surface-800 border">
              <div>DIFF = A ⊕ B</div>
              <div>BOUT = A' · B</div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">4. Live Bitwise Worked Trace (Current Inputs)</h4>
            <div className="bg-primary-50/60 p-4 rounded-lg border border-primary-200 font-mono text-xs space-y-2 text-primary-950">
              <div className="flex justify-between border-b border-primary-200 pb-1">
                <span>Minuend A = {a}</span>
                <span>Subtrahend B = {b}</span>
              </div>
              <div>• NOT_A: ¬{a} = <strong>{notA}</strong></div>
              <div>• XOR1 (Difference): {a} ⊕ {b} = <strong>{diff}</strong> → <span className="text-primary-700 font-bold">DIFF = {diff}</span></div>
              <div>• AND1 (Borrow): {notA} · {b} = <strong>{bout}</strong> → <span className="text-primary-700 font-bold">BOUT = {bout}</span></div>
              <div className="pt-1 border-t border-primary-200 text-xs">
                <strong>Arithmetic Check:</strong> {a} - {b} = {a - b} (Magnitude: -({bout} × 2) + {diff} = {a - b})
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'full-sub': {
      const a = getBit(inputA, 0);
      const b = getBit(inputB, 0);
      const bin = getBit(carryIn, 0);
      const xor1 = a ^ b;
      const notA = (1 - a) as 0 | 1;
      const and1 = notA & b;
      const diff = xor1 ^ bin;
      const notXor1 = (1 - xor1) as 0 | 1;
      const and2 = notXor1 & bin;
      const bout = and1 | and2;

      return (
        <div className="space-y-6 text-sm text-surface-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-base text-surface-900 mb-1">1. Overview</h4>
            <p>
              A <strong>Full Subtractor</strong> subtracts both a subtrahend bit (<code className="font-mono text-primary-700">B</code>) and a borrow-in bit (<code className="font-mono text-primary-700">Bin</code>) from minuend (<code className="font-mono text-primary-700">A</code>), computing A - B - Bin.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">2. Signal Legend & Meaning</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><code className="font-mono font-bold text-surface-900">A</code>: Minuend bit at position i.</li>
              <li><code className="font-mono font-bold text-surface-900">B</code>: Subtrahend bit at position i.</li>
              <li><code className="font-mono font-bold text-surface-900">BIN</code>: Borrow-in bit required by position i-1.</li>
              <li><code className="font-mono font-bold text-surface-900">NOT_A</code>: Inverter computing A'.</li>
              <li><code className="font-mono font-bold text-surface-900">XOR1</code>: First difference stage (A ⊕ B).</li>
              <li><code className="font-mono font-bold text-surface-900">AND1</code>: First borrow stage (A' · B).</li>
              <li><code className="font-mono font-bold text-surface-900">XOR2</code>: Final difference (XOR1 ⊕ Bin).</li>
              <li><code className="font-mono font-bold text-surface-900">NOT_XOR1</code>: Inverter computing (A ⊕ B)'.</li>
              <li><code className="font-mono font-bold text-surface-900">AND2</code>: Second borrow stage ((A ⊕ B)' · Bin).</li>
              <li><code className="font-mono font-bold text-surface-900">OR1</code>: Combines both borrow conditions (AND1 + AND2).</li>
              <li><code className="font-mono font-bold text-surface-900">DIFF</code>: Output difference bit.</li>
              <li><code className="font-mono font-bold text-surface-900">BOUT</code>: Borrow-out to position i+1.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-1">3. Logic Equations</h4>
            <div className="bg-surface-100 p-3 rounded font-mono text-xs space-y-1 text-surface-800 border">
              <div>DIFF = A ⊕ B ⊕ Bin</div>
              <div>BOUT = (A' · B) + ((A ⊕ B)' · Bin)</div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">4. Live Bitwise Worked Trace (Current Inputs)</h4>
            <div className="bg-primary-50/60 p-4 rounded-lg border border-primary-200 font-mono text-xs space-y-2 text-primary-950">
              <div className="flex justify-between border-b border-primary-200 pb-1">
                <span>A = {a}</span>
                <span>B = {b}</span>
                <span>Bin = {bin}</span>
              </div>
              <div>• Stage 1: XOR1 = {a} ⊕ {b} = <strong>{xor1}</strong>, AND1 = ¬{a} · {b} = <strong>{and1}</strong></div>
              <div>• Stage 2: XOR2 (Diff) = {xor1} ⊕ {bin} = <strong>{diff}</strong> → <span className="text-primary-700 font-bold">DIFF = {diff}</span></div>
              <div>• Stage 2 Borrow: AND2 = ¬{xor1} · {bin} = <strong>{and2}</strong></div>
              <div>• Final Borrow: OR1 = {and1} + {and2} = <strong>{bout}</strong> → <span className="text-primary-700 font-bold">BOUT = {bout}</span></div>
              <div className="pt-1 border-t border-primary-200 text-xs">
                <strong>Arithmetic Check:</strong> {a} - {b} - {bin} = {a - b - bin} (Value: -({bout} × 2) + {diff} = {a - b - bin})
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'twos-sub': {
      const bitsA = Array.from({ length: bitWidth }, (_, i) => getBit(inputA, i));
      const bitsB = Array.from({ length: bitWidth }, (_, i) => getBit(inputB, i));
      const notB = bitsB.map(b => (1 - b) as 0 | 1);
      
      const carries: number[] = [1]; // Hardwired CIN = 1
      const sums: number[] = [];
      for (let i = 0; i < bitWidth; i++) {
        const a = bitsA[i];
        const b = notB[i];
        const c = carries[i];
        const s = a ^ b ^ c;
        const cout = (a & b) | (c & (a ^ b));
        sums.push(s);
        carries.push(cout);
      }

      const diffVal = sums.reduce((acc, bit, i) => acc + (bit << i), 0);
      const isPositive = carries[bitWidth] === 1;

      return (
        <div className="space-y-6 text-sm text-surface-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-base text-surface-900 mb-1">1. Overview</h4>
            <p>
              An <strong>{bitWidth}-bit Two's Complement Subtractor</strong> performs subtraction A - B using an adder by adding the two's complement of B:
              <br />
              <code className="font-mono text-primary-700 font-bold">A - B = A + (-B) = A + (~B + 1)</code>
            </p>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">2. Signal Legend & Meaning</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><code className="font-mono font-bold text-surface-900">A0–A{bitWidth - 1}</code>: Minuend operand bits (A).</li>
              <li><code className="font-mono font-bold text-surface-900">B0–B{bitWidth - 1}</code>: Subtrahend operand bits (B).</li>
              <li><code className="font-mono font-bold text-surface-900">NOT_B0–NOT_B{bitWidth - 1}</code>: Inverters producing One's Complement ~B.</li>
              <li><code className="font-mono font-bold text-surface-900">CIN (Constant 1)</code>: Hardwired carry-in into bit 0 to add +1, completing the 2's complement conversion of B.</li>
              <li><code className="font-mono font-bold text-surface-900">S0–S{bitWidth - 1}</code>: Resulting difference bits in 2's complement form.</li>
              <li><code className="font-mono font-bold text-surface-900">COUT</code>: End-around carry indicating sign:
                <ul className="list-circle pl-4 mt-0.5">
                  <li><code className="font-mono">COUT = 1</code>: No borrow needed (A ≥ B), result is positive or zero.</li>
                  <li><code className="font-mono">COUT = 0</code>: Borrow occurred (A &lt; B), result is negative in 2's complement.</li>
                </ul>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">3. Live Bitwise Worked Trace (Current Inputs)</h4>
            <div className="bg-primary-50/60 p-4 rounded-lg border border-primary-200 font-mono text-xs space-y-2 text-primary-950">
              <div>• Minuend A: {inputA} ({bitsA.slice().reverse().join('')}₂)</div>
              <div>• Subtrahend B: {inputB} ({bitsB.slice().reverse().join('')}₂)</div>
              <div>• 1's Complement (~B): {notB.slice().reverse().join('')}₂</div>
              <div>• 2's Complement (~B + 1 via Cin=1): {((~inputB & ((1 << bitWidth) - 1)) + 1).toString(2).padStart(bitWidth, '0')}₂</div>
              
              <div className="pt-2 border-t border-primary-200">
                <div className="font-bold">Column Addition: A + (~B) + (Cin=1):</div>
                <div className="text-surface-700 text-xs mt-1">
                  Sum bits [S{bitWidth-1}..S0] = <strong>{sums.slice().reverse().join('')}₂</strong> ({diffVal})
                </div>
                <div className="text-surface-700 text-xs">
                  End Carry (COUT) = <strong>{carries[bitWidth]}</strong> ({isPositive ? "A ≥ B → Positive result" : "A < B → Negative result"})
                </div>
              </div>

              <div className="pt-2 border-t border-primary-200 font-bold">
                Mathematical Result: {inputA} - {inputB} = {inputA - inputB}
                {!isPositive && ` (Two's complement magnitude: -${(1 << bitWidth) - diffVal})`}
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'mult-2x2': {
      const a0 = getBit(inputA, 0);
      const a1 = getBit(inputA, 1);
      const b0 = getBit(inputB, 0);
      const b1 = getBit(inputB, 1);

      const pp00 = a0 & b0; // P0
      const pp10 = a1 & b0;
      const pp01 = a0 & b1;
      const pp11 = a1 & b1;

      const ha1_sum = pp10 ^ pp01; // P1
      const ha1_carry = pp10 & pp01;

      const ha2_sum = pp11 ^ ha1_carry; // P2
      const ha2_carry = pp11 & ha1_carry; // P3

      const prod = pp00 + (ha1_sum << 1) + (ha2_sum << 2) + (ha2_carry << 3);

      return (
        <div className="space-y-6 text-sm text-surface-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-base text-surface-900 mb-1">1. Overview</h4>
            <p>
              A <strong>2x2 Binary Multiplier</strong> multiplies two 2-bit numbers A = (A1 A0)₂ and B = (B1 B0)₂ to produce a 4-bit product P = (P3 P2 P1 P0)₂. It operates using partial product generation followed by column-wise adder summation, exactly like pencil-and-paper long multiplication.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">2. Signal Legend & Meaning</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><code className="font-mono font-bold text-surface-900">A0, A1</code>: Multiplicand bits (weights 2⁰ = 1, 2¹ = 2).</li>
              <li><code className="font-mono font-bold text-surface-900">B0, B1</code>: Multiplier bits (weights 2⁰ = 1, 2¹ = 2).</li>
              <li><code className="font-mono font-bold text-surface-900">AND_0_0</code> (A0 · B0): Partial product for Column 0 (weight 2⁰).</li>
              <li><code className="font-mono font-bold text-surface-900">AND_1_0</code> (A1 · B0): Partial product for Column 1 (weight 2¹) from row 0.</li>
              <li><code className="font-mono font-bold text-surface-900">AND_0_1</code> (A0 · B1): Partial product for Column 1 (weight 2¹) from row 1.</li>
              <li><code className="font-mono font-bold text-surface-900">AND_1_1</code> (A1 · B1): Partial product for Column 2 (weight 2²) from row 1.</li>
              <li><code className="font-mono font-bold text-surface-900">HA1_XOR</code>: Half Adder 1 Sum (AND_1_0 ⊕ AND_0_1 → P1).</li>
              <li><code className="font-mono font-bold text-surface-900">HA1_AND</code>: Half Adder 1 Carry (AND_1_0 · AND_0_1 → Carry to column 2).</li>
              <li><code className="font-mono font-bold text-surface-900">HA2_XOR</code>: Half Adder 2 Sum (AND_1_1 ⊕ HA1_AND → P2).</li>
              <li><code className="font-mono font-bold text-surface-900">HA2_AND</code>: Half Adder 2 Carry (AND_1_1 · HA1_AND → P3).</li>
              <li><code className="font-mono font-bold text-surface-900">P0, P1, P2, P3</code>: Final output product bits (weights 2⁰, 2¹, 2², 2³).</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">3. How Each Output Bit is Computed</h4>
            <div className="bg-surface-100 p-3 rounded font-mono text-xs space-y-1.5 text-surface-800 border">
              <div>• <strong>P0 (2⁰ = 1)</strong>: P0 = A0 · B0 (AND_0_0)</div>
              <div>• <strong>P1 (2¹ = 2)</strong>: P1 = (A1 · B0) ⊕ (A0 · B1) (HA1_XOR)</div>
              <div>• <strong>P2 (2² = 4)</strong>: P2 = (A1 · B1) ⊕ HA1_Carry (HA2_XOR)</div>
              <div>• <strong>P3 (2³ = 8)</strong>: P3 = (A1 · B1) · HA1_Carry (HA2_AND)</div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">4. Live Bitwise Worked Trace (Current Inputs)</h4>
            <div className="bg-primary-50/60 p-4 rounded-lg border border-primary-200 font-mono text-xs space-y-2 text-primary-950">
              <div className="flex justify-between border-b border-primary-200 pb-1">
                <span>Multiplicand A = {inputA} ({a1}{a0}₂)</span>
                <span>Multiplier B = {inputB} ({b1}{b0}₂)</span>
              </div>
              <div>
                <strong>Partial Products:</strong>
                <div className="pl-3 mt-1 space-y-0.5 text-surface-700">
                  <div>Row 0 (A · B0): A0·B0 = {pp00}, A1·B0 = {pp10}</div>
                  <div>Row 1 (A · B1): A0·B1 = {pp01}, A1·B1 = {pp11}</div>
                </div>
              </div>
              <div>
                <strong>Column Additions:</strong>
                <div className="pl-3 mt-1 space-y-0.5 text-surface-700">
                  <div>• Column 0 (2⁰): <strong>P0 = {pp00}</strong></div>
                  <div>• Column 1 (2¹): {pp10} + {pp01} = <strong>P1 = {ha1_sum}</strong> (Carry C1 = {ha1_carry})</div>
                  <div>• Column 2 (2²): {pp11} + C1({ha1_carry}) = <strong>P2 = {ha2_sum}</strong> (Carry C2 = {ha2_carry})</div>
                  <div>• Column 3 (2³): <strong>P3 = {ha2_carry}</strong></div>
                </div>
              </div>
              <div className="pt-2 border-t border-primary-200">
                <strong>Decimal Verification:</strong> {inputA} × {inputB} = {inputA * inputB} (Binary: <code className="bg-white px-1.5 py-0.5 rounded border">{ha2_carry}{ha2_sum}{ha1_sum}{pp00}₂</code> = {prod})
              </div>
            </div>
          </div>
        </div>
      );
    }

    case 'mult-3x3': {
      const a0 = getBit(inputA, 0);
      const a1 = getBit(inputA, 1);
      const a2 = getBit(inputA, 2);
      const b0 = getBit(inputB, 0);
      const b1 = getBit(inputB, 1);
      const b2 = getBit(inputB, 2);

      // Row 0
      const pp00 = a0 & b0;
      const pp10 = a1 & b0;
      const pp20 = a2 & b0;
      // Row 1
      const pp01 = a0 & b1;
      const pp11 = a1 & b1;
      const pp21 = a2 & b1;
      // Row 2
      const pp02 = a0 & b2;
      const pp12 = a1 & b2;
      const pp22 = a2 & b2;

      // Stage 1 Adders
      const ha1_sum = pp10 ^ pp01; // P1
      const ha1_carry = pp10 & pp01;

      const fa1_xor1 = pp20 ^ pp11;
      const fa1_and1 = pp20 & pp11;
      const fa1_sum = fa1_xor1 ^ ha1_carry;
      const fa1_and2 = fa1_xor1 & ha1_carry;
      const fa1_carry = fa1_and1 | fa1_and2;

      const ha2_sum = pp21 ^ fa1_carry;
      const ha2_carry = pp21 & fa1_carry;

      // Stage 2 Adders
      const ha3_sum = fa1_sum ^ pp02; // P2
      const ha3_carry = fa1_sum & pp02;

      const fa2_xor1 = ha2_sum ^ pp12;
      const fa2_and1 = ha2_sum & pp12;
      const fa2_sum = fa2_xor1 ^ ha3_carry; // P3
      const fa2_and2 = fa2_xor1 & ha3_carry;
      const fa2_carry = fa2_and1 | fa2_and2;

      const fa3_xor1 = ha2_carry ^ pp22;
      const fa3_and1 = ha2_carry & pp22;
      const fa3_sum = fa3_xor1 ^ fa2_carry; // P4
      const fa3_and2 = fa3_xor1 & fa2_carry;
      const fa3_carry = fa3_and1 | fa3_and2; // P5

      const p0 = pp00;
      const p1 = ha1_sum;
      const p2 = ha3_sum;
      const p3 = fa2_sum;
      const p4 = fa3_sum;
      const p5 = fa3_carry;

      const prod = p0 + (p1 << 1) + (p2 << 2) + (p3 << 3) + (p4 << 4) + (p5 << 5);

      return (
        <div className="space-y-6 text-sm text-surface-700 leading-relaxed">
          <div>
            <h4 className="font-bold text-base text-surface-900 mb-1">1. Overview</h4>
            <p>
              A <strong>3x3 Binary Multiplier</strong> computes the product of two 3-bit numbers A = (A2 A1 A0)₂ (0–7) and B = (B2 B1 B0)₂ (0–7), yielding a 6-bit result P = (P5 P4 P3 P2 P1 P0)₂ (0–49).
            </p>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">2. Signal Legend & Meaning</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li><code className="font-mono font-bold text-surface-900">A0, A1, A2</code>: Multiplicand bits (weights 2⁰=1, 2¹=2, 2²=4).</li>
              <li><code className="font-mono font-bold text-surface-900">B0, B1, B2</code>: Multiplier bits (weights 2⁰=1, 2¹=2, 2²=4).</li>
              <li><code className="font-mono font-bold text-surface-900">AND_i_j</code> (0 ≤ i, j ≤ 2): 9 Partial Product AND gates (A_i · B_j).</li>
              <li><code className="font-mono font-bold text-surface-900">HA1</code>: Adds row 0 and row 1 in Column 1 (A1·B0 + A0·B1 → Sum P1, Carry to Col 2).</li>
              <li><code className="font-mono font-bold text-surface-900">FA1</code>: Adds row 0 and row 1 in Column 2 (A2·B0 + A1·B1 + HA1.Carry → Sum S1,2, Carry to Col 3).</li>
              <li><code className="font-mono font-bold text-surface-900">HA2</code>: Adds row 1 in Column 3 with FA1 carry (A2·B1 + FA1.Carry → Sum S1,3, Carry to Col 4).</li>
              <li><code className="font-mono font-bold text-surface-900">HA3</code>: Stage 2 adder adding row 2 (S1,2 + A0·B2 → Sum P2, Carry to Col 3).</li>
              <li><code className="font-mono font-bold text-surface-900">FA2</code>: Stage 2 adder adding row 2 (S1,3 + A1·B2 + HA3.Carry → Sum P3, Carry to Col 4).</li>
              <li><code className="font-mono font-bold text-surface-900">FA3</code>: Stage 2 adder adding row 2 (HA2.Carry + A2·B2 + FA2.Carry → Sum P4, Carry P5).</li>
              <li><code className="font-mono font-bold text-surface-900">P0–P5</code>: Individual product output bits with weights 2⁰=1, 2¹=2, 2²=4, 2³=8, 2⁴=16, 2⁵=32.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">3. How Each Output Bit is Computed</h4>
            <div className="bg-surface-100 p-3 rounded font-mono text-xs space-y-1 text-surface-800 border">
              <div>• <strong>P0 (2⁰)</strong> = A0 · B0</div>
              <div>• <strong>P1 (2¹)</strong> = HA1_Sum = (A1 · B0) ⊕ (A0 · B1)</div>
              <div>• <strong>P2 (2²)</strong> = HA3_Sum = FA1_Sum ⊕ (A0 · B2)</div>
              <div>• <strong>P3 (2³)</strong> = FA2_Sum = HA2_Sum ⊕ (A1 · B2) ⊕ HA3_Carry</div>
              <div>• <strong>P4 (2⁴)</strong> = FA3_Sum = HA2_Carry ⊕ (A2 · B2) ⊕ FA2_Carry</div>
              <div>• <strong>P5 (2⁵)</strong> = FA3_Carry (Final overflow carry from column 4)</div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-base text-surface-900 mb-2">4. Live Bitwise Worked Trace (Current Inputs)</h4>
            <div className="bg-primary-50/60 p-4 rounded-lg border border-primary-200 font-mono text-xs space-y-2 text-primary-950">
              <div className="flex justify-between border-b border-primary-200 pb-1">
                <span>Multiplicand A = {inputA} ({a2}{a1}{a0}₂)</span>
                <span>Multiplier B = {inputB} ({b2}{b1}{b0}₂)</span>
              </div>
              
              <div>
                <strong>Partial Products (3 Rows):</strong>
                <div className="pl-3 mt-1 space-y-0.5 text-surface-700">
                  <div>Row 0 (A · B0): A2B0={pp20}, A1B0={pp10}, A0B0={pp00}</div>
                  <div>Row 1 (A · B1): A2B1={pp21}, A1B1={pp11}, A0B1={pp01}</div>
                  <div>Row 2 (A · B2): A2B2={pp22}, A1B2={pp12}, A0B2={pp02}</div>
                </div>
              </div>

              <div>
                <strong>Bit Assembly:</strong>
                <div className="pl-3 mt-1 space-y-0.5 text-surface-700">
                  <div>• P0 (2⁰): <strong>{p0}</strong></div>
                  <div>• P1 (2¹): <strong>{p1}</strong> (via HA1)</div>
                  <div>• P2 (2²): <strong>{p2}</strong> (via HA3)</div>
                  <div>• P3 (2³): <strong>{p3}</strong> (via FA2)</div>
                  <div>• P4 (2⁴): <strong>{p4}</strong> (via FA3 Sum)</div>
                  <div>• P5 (2⁵): <strong>{p5}</strong> (via FA3 Carry)</div>
                </div>
              </div>

              <div className="pt-2 border-t border-primary-200 font-bold">
                Decimal Verification: {inputA} × {inputB} = {inputA * inputB} (Binary: <code className="bg-white px-1.5 py-0.5 rounded border">{p5}{p4}{p3}{p2}{p1}{p0}₂</code> = {prod})
              </div>
            </div>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
};
