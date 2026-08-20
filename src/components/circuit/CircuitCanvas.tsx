import React from 'react';
import type { Circuit, CircuitNode } from '../../engine/types';

interface CircuitCanvasProps {
  circuit: Circuit;
  height?: number;
  nodeValues?: Record<string, 0 | 1>;
}

const GATE_WIDTH = 60;
const GATE_HEIGHT = 40;

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({ circuit, height = 400, nodeValues }) => {
  const { nodes } = circuit;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  Object.values(nodes).forEach(n => {
    if (n.x !== undefined && n.x < minX) minX = n.x;
    if (n.x !== undefined && n.x > maxX) maxX = n.x;
    if (n.y !== undefined && n.y < minY) minY = n.y;
    if (n.y !== undefined && n.y > maxY) maxY = n.y;
  });
  
  const vWidth = Math.max(800, maxX - minX + 200);
  const vHeight = Math.max(400, maxY - minY + 200);
  const vX = minX === Infinity ? 0 : minX - 100;
  const vY = minY === Infinity ? 0 : minY - 100;

  const renderGate = (node: CircuitNode) => {
    const x = node.x || 0;
    const y = node.y || 0;
    
    let body = <rect x={x} y={y - GATE_HEIGHT/2} width={GATE_WIDTH} height={GATE_HEIGHT} rx={5} fill="#fff" stroke="#333" strokeWidth={2} />;
    
    if (node.type === 'INPUT' || node.type === 'OUTPUT') {
      body = <circle cx={x + GATE_WIDTH/2} cy={y} r={20} fill="#f0fdf4" stroke="#22c55e" strokeWidth={2} />;
    } else if (node.type === 'AND' || node.type === 'NAND') {
      body = <path d={`M ${x} ${y - GATE_HEIGHT/2} h ${GATE_WIDTH/2} a ${GATE_WIDTH/2} ${GATE_HEIGHT/2} 0 0 1 0 ${GATE_HEIGHT} h -${GATE_WIDTH/2} Z`} fill="#fff" stroke="#333" strokeWidth={2} />;
    } else if (node.type === 'OR' || node.type === 'NOR') {
      body = <path d={`M ${x} ${y - GATE_HEIGHT/2} q ${GATE_WIDTH/3} ${GATE_HEIGHT/2} 0 ${GATE_HEIGHT} q ${GATE_WIDTH/1.5} 0 ${GATE_WIDTH} -${GATE_HEIGHT/2} q -${GATE_WIDTH/3} -${GATE_HEIGHT/2} -${GATE_WIDTH} -${GATE_HEIGHT/2} Z`} fill="#fff" stroke="#333" strokeWidth={2} />;
    } else if (node.type === 'XOR' || node.type === 'XNOR') {
      body = (
        <g>
          <path d={`M ${x-5} ${y - GATE_HEIGHT/2} q ${GATE_WIDTH/3} ${GATE_HEIGHT/2} 0 ${GATE_HEIGHT}`} fill="none" stroke="#333" strokeWidth={2} />
          <path d={`M ${x} ${y - GATE_HEIGHT/2} q ${GATE_WIDTH/3} ${GATE_HEIGHT/2} 0 ${GATE_HEIGHT} q ${GATE_WIDTH/1.5} 0 ${GATE_WIDTH} -${GATE_HEIGHT/2} q -${GATE_WIDTH/3} -${GATE_HEIGHT/2} -${GATE_WIDTH} -${GATE_HEIGHT/2} Z`} fill="#fff" stroke="#333" strokeWidth={2} />
        </g>
      );
    } else if (node.type === 'NOT') {
      body = <polygon points={`${x},${y-GATE_HEIGHT/2} ${x+GATE_WIDTH},${y} ${x},${y+GATE_HEIGHT/2}`} fill="#fff" stroke="#333" strokeWidth={2} />;
    }

    const hasBubble = node.type === 'NOT' || node.type === 'NAND' || node.type === 'NOR' || node.type === 'XNOR';
    const isActive = nodeValues ? nodeValues[node.id] === 1 : false;
    const bodyStroke = nodeValues ? (isActive ? '#22c55e' : '#94a3b8') : '#333';
    const textColor = nodeValues ? (isActive ? '#16a34a' : '#64748b') : '#333';
    
    // Quick fix for body elements stroke
    const styledBody = React.cloneElement(body, { stroke: bodyStroke });

    return (
      <g key={node.id}>
        {styledBody}
        {hasBubble && <circle cx={x + GATE_WIDTH + 5} cy={y} r={5} fill="#fff" stroke={bodyStroke} strokeWidth={2} />}
        <text x={x + GATE_WIDTH/2} y={y} textAnchor="middle" alignmentBaseline="middle" fontSize={12} fontWeight="bold" fill={textColor} pointerEvents="none">
          {node.label || node.type}
        </text>
        {nodeValues && (
          <text x={x + GATE_WIDTH/2} y={y + 25} textAnchor="middle" fontSize={10} fill={bodyStroke} pointerEvents="none">
            {nodeValues[node.id]}
          </text>
        )}
      </g>
    );
  };
  
  const renderWires = () => {
    const paths: React.ReactNode[] = [];
    Object.values(nodes).forEach(target => {
      target.inputs.forEach((srcId, index) => {
        const src = nodes[srcId];
        if (src && src.x !== undefined && target.x !== undefined) {
          const hasBubble = src.type === 'NOT' || src.type === 'NAND' || src.type === 'NOR' || src.type === 'XNOR';
          const startX = src.x + GATE_WIDTH + (hasBubble ? 10 : 0);
          const startY = src.y || 0;
          
          let endX = target.x;
          if (target.type === 'INPUT' || target.type === 'OUTPUT') endX += 10;

          const offset = target.inputs.length > 1 ? (index === 0 ? -10 : 10) : 0;
          const endY = (target.y || 0) + offset;
          
          const midX = (startX + endX) / 2;
          const isActive = nodeValues ? nodeValues[srcId] === 1 : false;
          const strokeColor = nodeValues ? (isActive ? '#22c55e' : '#cbd5e1') : '#64748b';
          
          const d = `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`;
          paths.push(<path key={`${srcId}-${target.id}`} d={d} fill="none" stroke={strokeColor} strokeWidth={isActive ? 3 : 2} className={isActive ? "transition-all duration-300" : ""} />);
        }
      });
    });
    return paths;
  };

  return (
    <div className="w-full overflow-auto border border-surface-100 rounded-lg bg-white shadow-sm">
      <svg width="100%" height={height} viewBox={`${vX} ${vY} ${vWidth} ${vHeight}`} xmlns="http://www.w3.org/2000/svg">
        {renderWires()}
        {Object.values(nodes).map(renderGate)}
      </svg>
    </div>
  );
};
