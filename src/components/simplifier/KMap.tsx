import React from 'react';
import { useLogicStore } from '../../stores/useLogicStore';
import { implicantToExpression, implicantToExpressionPOS } from '../../engine/quine-mccluskey/qm';

const GRAY_CODE_1 = ['0', '1'];
const GRAY_CODE_2 = ['00', '01', '11', '10'];

const COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

interface GridProps {
  vars: string[];
  prefix: string;
  rows: string[];
  cols: string[];
  rowVars: string;
  colVars: string;
}

export const KMap: React.FC = () => {
  const { numVariables, variableNames, truthTable, primeImplicants, outputMode } = useLogicStore();

  const renderGrid = ({ prefix, rows, cols, rowVars, colVars }: GridProps) => {
    return (
      <div className="inline-block border border-surface-300 rounded overflow-hidden shadow-sm bg-white m-2 relative">
        <div className="absolute top-0 left-0 border-b border-r border-surface-300 bg-surface-100" style={{ width: '40px', height: '40px' }}>
           <svg className="absolute w-full h-full text-surface-400">
             <line x1="0" y1="0" x2="40" y2="40" stroke="currentColor" strokeWidth="1" />
           </svg>
           <span className="absolute bottom-1 left-1 text-[10px] font-bold leading-none">{rowVars}</span>
           <span className="absolute top-1 right-1 text-[10px] font-bold leading-none">{colVars}</span>
        </div>
        
        <table className="border-collapse text-center">
          <thead>
            <tr>
              <th className="w-[40px] h-[40px] border border-surface-300 bg-surface-100 p-0 m-0"></th>
              {cols.map(c => <th key={c} className="w-[40px] h-[40px] border border-surface-300 bg-surface-100 text-xs font-mono font-medium p-0 m-0">{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r}>
                <td className="w-[40px] h-[40px] border border-surface-300 bg-surface-100 text-xs font-mono font-medium p-0 m-0">
                  {r}
                </td>
                {cols.map((c) => {
                  const binStr = prefix + r + c;
                  const mIndex = parseInt(binStr, 2);
                  const val = truthTable[mIndex]?.output ?? 0;
                  
                  // Determine overlapping prime implicants
                  const overlaps = primeImplicants.map((pi, piIdx) => {
                    let matches = true;
                    for (let i = 0; i < pi.length; i++) {
                      if (pi[i] !== '-' && pi[i] !== binStr[i]) {
                        matches = false;
                        break;
                      }
                    }
                    return matches ? piIdx : -1;
                  }).filter(x => x !== -1);
                  
                  return (
                    <td key={c} className="w-[40px] h-[40px] border border-surface-300 relative p-0 m-0">
                      {overlaps.map((piIdx, i) => {
                        const color = COLORS[piIdx % COLORS.length];
                        const shrink = i * 4;
                        return (
                          <div 
                            key={piIdx}
                            className="absolute rounded-sm opacity-50"
                            style={{
                              left: `${shrink}px`, top: `${shrink}px`, 
                              right: `${shrink}px`, bottom: `${shrink}px`,
                              backgroundColor: color,
                              pointerEvents: 'none',
                              zIndex: 10 + i
                            }}
                          />
                        );
                      })}
                      <span className="relative z-20 font-bold font-mono" style={{ color: overlaps.length > 0 ? '#000' : '#64748b' }}>
                        {val}
                      </span>
                      <span className="absolute bottom-0 right-0 text-[8px] text-surface-400 p-[2px] pointer-events-none">
                        m{mIndex}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  let grids = [];
  
  if (numVariables === 2) {
    grids.push(<div key="1">{renderGrid({
      vars: variableNames.slice(0, 2), prefix: '',
      rows: GRAY_CODE_1, cols: GRAY_CODE_1, rowVars: variableNames[0], colVars: variableNames[1]
    })}</div>);
  } else if (numVariables === 3) {
    grids.push(<div key="1">{renderGrid({
      vars: variableNames.slice(0, 3), prefix: '',
      rows: GRAY_CODE_1, cols: GRAY_CODE_2, rowVars: variableNames[0], colVars: variableNames.slice(1).join('')
    })}</div>);
  } else if (numVariables === 4) {
    grids.push(<div key="1">{renderGrid({
      vars: variableNames.slice(0, 4), prefix: '',
      rows: GRAY_CODE_2, cols: GRAY_CODE_2, rowVars: variableNames.slice(0,2).join(''), colVars: variableNames.slice(2).join('')
    })}</div>);
  } else if (numVariables === 5) {
    const v = variableNames;
    grids.push(<div key="0" className="flex flex-col items-center"><span className="font-bold mb-1">{v[0]} = 0</span>{renderGrid({
      vars: v.slice(1, 5), prefix: '0',
      rows: GRAY_CODE_2, cols: GRAY_CODE_2, rowVars: v.slice(1,3).join(''), colVars: v.slice(3,5).join('')
    })}</div>);
    grids.push(<div key="1" className="flex flex-col items-center"><span className="font-bold mb-1">{v[0]} = 1</span>{renderGrid({
      vars: v.slice(1, 5), prefix: '1',
      rows: GRAY_CODE_2, cols: GRAY_CODE_2, rowVars: v.slice(1,3).join(''), colVars: v.slice(3,5).join('')
    })}</div>);
  } else if (numVariables === 6) {
    const v = variableNames;
    const prefixes = ['00', '01', '11', '10'];
    prefixes.forEach(p => {
      grids.push(<div key={p} className="flex flex-col items-center"><span className="font-bold mb-1">{v.slice(0,2).join('')} = {p}</span>{renderGrid({
        vars: v.slice(2, 6), prefix: p,
        rows: GRAY_CODE_2, cols: GRAY_CODE_2, rowVars: v.slice(2,4).join(''), colVars: v.slice(4,6).join('')
      })}</div>);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 items-start justify-center">
        {grids}
      </div>
      
      {primeImplicants.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-semibold mb-2">Legend (Prime Implicants)</h4>
          <div className="flex flex-wrap gap-3">
            {primeImplicants.map((pi, i) => {
              const expr = outputMode === 'sop' ? implicantToExpression(pi, variableNames) : implicantToExpressionPOS(pi, variableNames);
              return (
                <div key={pi} className="flex items-center gap-2 bg-surface-50 px-2 py-1 rounded border shadow-sm">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="font-mono text-sm font-bold">{expr}</span>
                  <span className="font-mono text-xs text-surface-500">({pi})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
