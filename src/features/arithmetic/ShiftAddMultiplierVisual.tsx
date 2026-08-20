import React from 'react';

interface ShiftAddMultiplierVisualProps {
  bits: 2 | 3;
  inputA: number;
  inputB: number;
}

export const ShiftAddMultiplierVisual: React.FC<ShiftAddMultiplierVisualProps> = ({
  bits,
  inputA,
  inputB,
}) => {
  const getBit = (val: number, bit: number): 0 | 1 => ((val >> bit) & 1) as 0 | 1;

  const totalBits = bits * 2;
  const bitsA = Array.from({ length: bits }, (_, i) => getBit(inputA, i));
  const bitsB = Array.from({ length: bits }, (_, i) => getBit(inputB, i));
  const prod = inputA * inputB;

  // Calculate each partial product row
  const rows = bitsB.map((bVal, rowIndex) => {
    const shiftedRow: (number | null)[] = Array(totalBits).fill(null);
    for (let col = 0; col < bits; col++) {
      const bitA = bitsA[col];
      shiftedRow[rowIndex + col] = bitA & bVal;
    }
    return {
      bBit: bVal,
      rowIndex,
      rowValues: shiftedRow, // index 0 is LSB (column 0)
    };
  });

  return (
    <div className="bg-slate-900 text-white rounded-xl p-5 font-mono shadow-md border border-slate-800 my-4 overflow-x-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="text-xs uppercase tracking-wider font-semibold text-indigo-400">
          Shift-and-Add Binary Multiplier Matrix ({bits}x{bits})
        </div>
        <div className="text-xs text-slate-400">
          Multiplicand × Multiplier = Product
        </div>
      </div>

      <div className="min-w-[440px] text-xs flex flex-col items-center">
        {/* Multiplicand A */}
        <div className="flex items-center justify-end w-full max-w-md py-1">
          <span className="text-slate-400 mr-4 text-[11px]">Multiplicand (A = {inputA}):</span>
          <div className="flex gap-2">
            {Array.from({ length: totalBits - bits }).map((_, i) => (
              <div key={i} className="w-8 h-8 flex items-center justify-center text-slate-700">·</div>
            ))}
            {bitsA.slice().reverse().map((bit, idx) => {
              const bitIdx = bits - 1 - idx;
              return (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center font-bold border ${
                    bit === 1 
                      ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300' 
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-[13px]">{bit}</span>
                  <span className="text-[8px] text-slate-400">A{bitIdx}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multiplier B */}
        <div className="flex items-center justify-end w-full max-w-md py-1 border-b border-slate-700/80 pb-2">
          <span className="text-slate-400 mr-4 text-[11px]">Multiplier (B = {inputB}):</span>
          <span className="text-indigo-400 font-bold text-base mr-1">×</span>
          <div className="flex gap-2">
            {Array.from({ length: totalBits - bits }).map((_, i) => (
              <div key={i} className="w-8 h-8 flex items-center justify-center text-slate-700">·</div>
            ))}
            {bitsB.slice().reverse().map((bit, idx) => {
              const bitIdx = bits - 1 - idx;
              return (
                <div
                  key={idx}
                  className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center font-bold border ${
                    bit === 1 
                      ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300' 
                      : 'bg-slate-800/80 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-[13px]">{bit}</span>
                  <span className="text-[8px] text-slate-400">B{bitIdx}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Partial product rows */}
        <div className="w-full max-w-md py-2 space-y-1.5 border-b-2 border-indigo-500/50 pb-3">
          {rows.map(({ bBit, rowIndex, rowValues }) => {
            const isActiveRow = bBit === 1;
            return (
              <div key={rowIndex} className="flex items-center justify-end">
                <span className="text-slate-400 mr-4 text-[10px]">
                  Row {rowIndex} (A · B{rowIndex} = {bBit}):
                </span>
                <div className="flex gap-2">
                  {Array.from({ length: totalBits }).map((_, colReverse) => {
                    const colIndex = totalBits - 1 - colReverse;
                    const val = rowValues[colIndex];
                    if (val === null) {
                      return (
                        <div key={colReverse} className="w-8 h-7 flex items-center justify-center text-slate-700 text-xs">
                          {colIndex < rowIndex ? '0' : '·'}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={colReverse}
                        className={`w-8 h-7 rounded flex flex-col items-center justify-center font-bold border ${
                          isActiveRow
                            ? val === 1
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                            : 'bg-slate-900 border-slate-800 text-slate-600'
                        }`}
                      >
                        <span className="text-[12px]">{val}</span>
                        <span className="text-[7px] text-slate-500">
                          A{colIndex - rowIndex}B{rowIndex}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Column Summation */}
        <div className="flex items-center justify-end w-full max-w-md pt-3">
          <span className="text-emerald-400 font-bold mr-4 text-xs">
            Product (P = {prod}):
          </span>
          <div className="flex gap-2">
            {Array.from({ length: totalBits }).map((_, colReverse) => {
              const bitIndex = totalBits - 1 - colReverse;
              const pBit = getBit(prod, bitIndex);
              return (
                <div
                  key={colReverse}
                  className={`w-8 h-9 rounded-lg flex flex-col items-center justify-center font-bold border ${
                    pBit === 1
                      ? 'bg-emerald-900/90 border-emerald-400 text-emerald-200 shadow-sm shadow-emerald-900'
                      : 'bg-slate-800 border-slate-600 text-slate-400'
                  }`}
                >
                  <span className="text-[14px]">{pBit}</span>
                  <span className="text-[8px] text-emerald-400 font-semibold">P{bitIndex}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column Weights reference */}
        <div className="flex items-center justify-end w-full max-w-md pt-1.5 text-[9px] text-slate-500">
          <span className="mr-4">Bit Weights:</span>
          <div className="flex gap-2">
            {Array.from({ length: totalBits }).map((_, colReverse) => {
              const bitIndex = totalBits - 1 - colReverse;
              return (
                <div key={colReverse} className="w-8 text-center">
                  2^{bitIndex} ({1 << bitIndex})
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
