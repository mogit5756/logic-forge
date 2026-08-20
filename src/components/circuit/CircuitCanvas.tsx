import React from 'react';
import type { Circuit, CircuitNode } from '../../engine/types';

interface CircuitCanvasProps {
  circuit: Circuit;
  height?: number;
  nodeValues?: Record<string, 0 | 1>;
}

const GATE_WIDTH = 60;
const GATE_HEIGHT = 40;
const PORT_RADIUS = 18;

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({ circuit, height = 450, nodeValues }) => {
  const { nodes } = circuit;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  Object.values(nodes).forEach(n => {
    if (n.x !== undefined && n.x < minX) minX = n.x;
    if (n.x !== undefined && n.x > maxX) maxX = n.x;
    if (n.y !== undefined && n.y < minY) minY = n.y;
    if (n.y !== undefined && n.y > maxY) maxY = n.y;
  });
  
  const vWidth = Math.max(800, (maxX === -Infinity ? 600 : maxX - minX) + 240);
  const vHeight = Math.max(350, (maxY === -Infinity ? 300 : maxY - minY) + 200);
  const vX = minX === Infinity ? 0 : minX - 100;
  const vY = minY === Infinity ? 0 : minY - 100;

  // Track fan-out for rendering junction dots
  const fanOutCount: Record<string, number> = {};
  Object.values(nodes).forEach(target => {
    target.inputs.forEach(srcId => {
      fanOutCount[srcId] = (fanOutCount[srcId] || 0) + 1;
    });
  });

  const getSourcePort = (src: CircuitNode) => {
    const x = src.x ?? 0;
    const y = src.y ?? 0;
    if (src.type === 'INPUT' || src.type === 'CONSTANT' || src.type === 'OUTPUT') {
      return { x: x + GATE_WIDTH / 2 + PORT_RADIUS, y };
    }
    const hasBubble = src.type === 'NOT' || src.type === 'NAND' || src.type === 'NOR' || src.type === 'XNOR';
    return { x: x + GATE_WIDTH + (hasBubble ? 10 : 0), y };
  };

  const getTargetPort = (target: CircuitNode, inputIndex: number, totalInputs: number) => {
    const x = target.x ?? 0;
    const y = target.y ?? 0;
    if (target.type === 'OUTPUT' || target.type === 'INPUT') {
      return { x: x + GATE_WIDTH / 2 - PORT_RADIUS, y };
    }
    const offset = totalInputs > 1 
      ? ((inputIndex / (totalInputs - 1)) - 0.5) * 22
      : 0;
    return { x, y: y + offset };
  };

  const renderGate = (node: CircuitNode) => {
    const x = node.x || 0;
    const y = node.y || 0;
    
    const isActive = nodeValues ? nodeValues[node.id] === 1 : false;
    const valText = nodeValues !== undefined ? nodeValues[node.id] : undefined;
    const activeColor = '#10b981'; // Emerald 500
    const inactiveColor = '#94a3b8'; // Slate 400
    const borderStroke = nodeValues !== undefined ? (isActive ? activeColor : inactiveColor) : '#475569';
    const textFill = nodeValues !== undefined ? (isActive ? '#047857' : '#475569') : '#1e293b';

    let body: React.ReactNode = null;
    const hasBubble = node.type === 'NOT' || node.type === 'NAND' || node.type === 'NOR' || node.type === 'XNOR';

    if (node.type === 'INPUT') {
      body = (
        <g>
          <circle cx={x + GATE_WIDTH / 2} cy={y} r={PORT_RADIUS} fill={isActive ? '#ecfdf5' : '#f8fafc'} stroke={borderStroke} strokeWidth={2} />
          <text x={x + GATE_WIDTH / 2} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold" fill={textFill} pointerEvents="none">
            {node.label || node.id}
          </text>
        </g>
      );
    } else if (node.type === 'CONSTANT') {
      body = (
        <g>
          <rect x={x + GATE_WIDTH / 2 - PORT_RADIUS} y={y - PORT_RADIUS} width={PORT_RADIUS * 2} height={PORT_RADIUS * 2} rx={4} fill="#fef3c7" stroke="#d97706" strokeWidth={2} />
          <text x={x + GATE_WIDTH / 2} y={y} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold" fill="#b45309" pointerEvents="none">
            {node.value ?? (node.label || '1')}
          </text>
        </g>
      );
    } else if (node.type === 'OUTPUT') {
      body = (
        <g>
          <circle cx={x + GATE_WIDTH / 2} cy={y} r={PORT_RADIUS} fill={isActive ? '#eff6ff' : '#f8fafc'} stroke={isActive ? '#3b82f6' : borderStroke} strokeWidth={2} />
          <text x={x + GATE_WIDTH / 2} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold" fill={isActive ? '#1d4ed8' : textFill} pointerEvents="none">
            {node.label || node.id}
          </text>
        </g>
      );
    } else if (node.type === 'AND' || node.type === 'NAND') {
      body = (
        <path d={`M ${x} ${y - GATE_HEIGHT / 2} h ${GATE_WIDTH / 2} a ${GATE_WIDTH / 2} ${GATE_HEIGHT / 2} 0 0 1 0 ${GATE_HEIGHT} h -${GATE_WIDTH / 2} Z`} fill="#ffffff" stroke={borderStroke} strokeWidth={2} />
      );
    } else if (node.type === 'OR' || node.type === 'NOR') {
      body = (
        <path d={`M ${x} ${y - GATE_HEIGHT / 2} q ${GATE_WIDTH / 3} ${GATE_HEIGHT / 2} 0 ${GATE_HEIGHT} q ${GATE_WIDTH / 1.5} 0 ${GATE_WIDTH} -${GATE_HEIGHT / 2} q -${GATE_WIDTH / 3} -${GATE_HEIGHT / 2} -${GATE_WIDTH} -${GATE_HEIGHT / 2} Z`} fill="#ffffff" stroke={borderStroke} strokeWidth={2} />
      );
    } else if (node.type === 'XOR' || node.type === 'XNOR') {
      body = (
        <g>
          <path d={`M ${x - 5} ${y - GATE_HEIGHT / 2} q ${GATE_WIDTH / 3} ${GATE_HEIGHT / 2} 0 ${GATE_HEIGHT}`} fill="none" stroke={borderStroke} strokeWidth={2} />
          <path d={`M ${x} ${y - GATE_HEIGHT / 2} q ${GATE_WIDTH / 3} ${GATE_HEIGHT / 2} 0 ${GATE_HEIGHT} q ${GATE_WIDTH / 1.5} 0 ${GATE_WIDTH} -${GATE_HEIGHT / 2} q -${GATE_WIDTH / 3} -${GATE_HEIGHT / 2} -${GATE_WIDTH} -${GATE_HEIGHT / 2} Z`} fill="#ffffff" stroke={borderStroke} strokeWidth={2} />
        </g>
      );
    } else if (node.type === 'NOT') {
      body = (
        <polygon points={`${x},${y - GATE_HEIGHT / 2} ${x + GATE_WIDTH},${y} ${x},${y + GATE_HEIGHT / 2}`} fill="#ffffff" stroke={borderStroke} strokeWidth={2} />
      );
    }

    const isGate = node.type !== 'INPUT' && node.type !== 'OUTPUT' && node.type !== 'CONSTANT';

    return (
      <g key={node.id} className="transition-all duration-200">
        {body}
        {hasBubble && (
          <circle cx={x + GATE_WIDTH + 5} cy={y} r={4} fill="#ffffff" stroke={borderStroke} strokeWidth={2} />
        )}
        {isGate && (
          <text x={x + GATE_WIDTH / 2 - (node.type === 'NOT' ? 8 : 0)} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold" fill={textFill} pointerEvents="none">
            {node.label || node.type}
          </text>
        )}
        {valText !== undefined && (
          <g>
            <rect x={x + GATE_WIDTH / 2 - 10} y={y + GATE_HEIGHT / 2 + 3} width={20} height={14} rx={3} fill={isActive ? '#ecfdf5' : '#f1f5f9'} stroke={isActive ? '#10b981' : '#cbd5e1'} strokeWidth={1} />
            <text x={x + GATE_WIDTH / 2} y={y + GATE_HEIGHT / 2 + 10} textAnchor="middle" dominantBaseline="central" fontSize={9} fontWeight="bold" fill={isActive ? '#047857' : '#64748b'} pointerEvents="none">
              {valText}
            </text>
          </g>
        )}
      </g>
    );
  };
  
  const renderWires = () => {
    const paths: React.ReactNode[] = [];
    const drawnJunctions = new Set<string>();

    Object.values(nodes).forEach(target => {
      target.inputs.forEach((srcId, index) => {
        const src = nodes[srcId];
        if (src && src.x !== undefined && target.x !== undefined) {
          const srcPort = getSourcePort(src);
          const tgtPort = getTargetPort(target, index, target.inputs.length);
          
          const isActive = nodeValues ? nodeValues[srcId] === 1 : false;
          const strokeColor = nodeValues ? (isActive ? '#10b981' : '#cbd5e1') : '#64748b';
          const strokeWidth = isActive ? 2.5 : 1.75;
          
          // Staggered horizontal bend to avoid multiple parallel lines merging into one
          const stagger = 0.35 + ((index % 3) * 0.15);
          const midX = srcPort.x + (tgtPort.x - srcPort.x) * stagger;
          
          const d = `M ${srcPort.x} ${srcPort.y} H ${midX} V ${tgtPort.y} H ${tgtPort.x}`;
          paths.push(
            <path 
              key={`${srcId}-${target.id}-${index}`} 
              d={d} 
              fill="none" 
              stroke={strokeColor} 
              strokeWidth={strokeWidth} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={isActive ? "transition-all duration-300" : ""} 
            />
          );

          // Junction dot at source port if fanout > 1
          if ((fanOutCount[srcId] || 0) > 1 && !drawnJunctions.has(srcId)) {
            drawnJunctions.add(srcId);
            paths.push(
              <circle 
                key={`junc-${srcId}`} 
                cx={srcPort.x} 
                cy={srcPort.y} 
                r={3} 
                fill={strokeColor} 
              />
            );
          }
        }
      });
    });
    return paths;
  };

  return (
    <div className="w-full h-full min-h-[400px] overflow-auto border border-surface-100 rounded-lg bg-slate-50/50 shadow-inner flex items-center justify-center p-4">
      <svg width="100%" height={height} viewBox={`${vX} ${vY} ${vWidth} ${vHeight}`} xmlns="http://www.w3.org/2000/svg" className="overflow-visible">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x={vX} y={vY} width={vWidth} height={vHeight} fill="url(#grid)" />
        {renderWires()}
        {Object.values(nodes).map(renderGate)}
      </svg>
    </div>
  );
};

