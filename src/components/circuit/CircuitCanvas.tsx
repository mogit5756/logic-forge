import React, { useState, useRef } from 'react';
import type { Circuit, CircuitNode } from '../../engine/types';

interface CircuitCanvasProps {
  circuit: Circuit;
  height?: number;
  nodeValues?: Record<string, 0 | 1>;
  title?: string;
}

const GATE_WIDTH = 60;
const GATE_HEIGHT = 40;
const PORT_RADIUS = 18;

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({ 
  circuit, 
  height = 450, 
  nodeValues,
  title = "Circuit Schematic Diagram" 
}) => {
  const { nodes } = circuit;
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  Object.values(nodes).forEach(n => {
    if (n.x !== undefined && n.x < minX) minX = n.x;
    if (n.x !== undefined && n.x > maxX) maxX = n.x;
    if (n.y !== undefined && n.y < minY) minY = n.y;
    if (n.y !== undefined && n.y > maxY) maxY = n.y;
  });
  
  const baseWidth = Math.max(800, (maxX === -Infinity ? 600 : maxX - minX) + 240);
  const baseHeight = Math.max(350, (maxY === -Infinity ? 300 : maxY - minY) + 200);
  const baseX = minX === Infinity ? 0 : minX - 100;
  const baseY = minY === Infinity ? 0 : minY - 100;

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

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(z => Math.min(2.5, Number((z + 0.2).toFixed(2))));
  const handleZoomOut = () => setZoom(z => Math.max(0.4, Number((z - 0.2).toFixed(2))));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const renderGate = (node: CircuitNode) => {
    const x = node.x || 0;
    const y = node.y || 0;
    
    const isActive = nodeValues ? nodeValues[node.id] === 1 : false;
    const valText = nodeValues !== undefined ? nodeValues[node.id] : undefined;
    
    // High contrast colors
    const activeBorder = '#059669'; // Emerald 600
    const idleBorder = '#334155'; // Slate 700 - high contrast
    const borderStroke = nodeValues !== undefined ? (isActive ? activeBorder : idleBorder) : '#1e293b';
    const textFill = nodeValues !== undefined ? (isActive ? '#065f46' : '#0f172a') : '#0f172a';

    let body: React.ReactNode = null;
    const hasBubble = node.type === 'NOT' || node.type === 'NAND' || node.type === 'NOR' || node.type === 'XNOR';

    if (node.type === 'INPUT') {
      body = (
        <g>
          <circle 
            cx={x + GATE_WIDTH / 2} 
            cy={y} 
            r={PORT_RADIUS} 
            fill={isActive ? '#d1fae5' : '#ffffff'} 
            stroke={borderStroke} 
            strokeWidth={isActive ? 2.5 : 2} 
          />
          <text 
            x={x + GATE_WIDTH / 2} 
            y={y} 
            textAnchor="middle" 
            dominantBaseline="central" 
            fontSize={11} 
            fontWeight="bold" 
            fill={textFill} 
            fontFamily="monospace"
            pointerEvents="none"
          >
            {node.label || node.id}
          </text>
        </g>
      );
    } else if (node.type === 'CONSTANT') {
      body = (
        <g>
          <rect 
            x={x + GATE_WIDTH / 2 - PORT_RADIUS} 
            y={y - PORT_RADIUS} 
            width={PORT_RADIUS * 2} 
            height={PORT_RADIUS * 2} 
            rx={4} 
            fill="#fef3c7" 
            stroke="#d97706" 
            strokeWidth={2} 
          />
          <text 
            x={x + GATE_WIDTH / 2} 
            y={y} 
            textAnchor="middle" 
            dominantBaseline="central" 
            fontSize={12} 
            fontWeight="bold" 
            fill="#b45309" 
            fontFamily="monospace"
            pointerEvents="none"
          >
            {node.value ?? (node.label || '1')}
          </text>
        </g>
      );
    } else if (node.type === 'OUTPUT') {
      body = (
        <g>
          <circle 
            cx={x + GATE_WIDTH / 2} 
            cy={y} 
            r={PORT_RADIUS} 
            fill={isActive ? '#eff6ff' : '#ffffff'} 
            stroke={isActive ? '#2563eb' : borderStroke} 
            strokeWidth={isActive ? 2.5 : 2} 
          />
          <text 
            x={x + GATE_WIDTH / 2} 
            y={y} 
            textAnchor="middle" 
            dominantBaseline="central" 
            fontSize={11} 
            fontWeight="bold" 
            fill={isActive ? '#1d4ed8' : textFill} 
            fontFamily="monospace"
            pointerEvents="none"
          >
            {node.label || node.id}
          </text>
        </g>
      );
    } else if (node.type === 'AND' || node.type === 'NAND') {
      body = (
        <path 
          d={`M ${x} ${y - GATE_HEIGHT / 2} h ${GATE_WIDTH / 2} a ${GATE_WIDTH / 2} ${GATE_HEIGHT / 2} 0 0 1 0 ${GATE_HEIGHT} h -${GATE_WIDTH / 2} Z`} 
          fill={isActive ? '#f0fdf4' : '#ffffff'} 
          stroke={borderStroke} 
          strokeWidth={isActive ? 2.5 : 2} 
        />
      );
    } else if (node.type === 'OR' || node.type === 'NOR') {
      body = (
        <path 
          d={`M ${x} ${y - GATE_HEIGHT / 2} q ${GATE_WIDTH / 3} ${GATE_HEIGHT / 2} 0 ${GATE_HEIGHT} q ${GATE_WIDTH / 1.5} 0 ${GATE_WIDTH} -${GATE_HEIGHT / 2} q -${GATE_WIDTH / 3} -${GATE_HEIGHT / 2} -${GATE_WIDTH} -${GATE_HEIGHT / 2} Z`} 
          fill={isActive ? '#f0fdf4' : '#ffffff'} 
          stroke={borderStroke} 
          strokeWidth={isActive ? 2.5 : 2} 
        />
      );
    } else if (node.type === 'XOR' || node.type === 'XNOR') {
      body = (
        <g>
          <path 
            d={`M ${x - 5} ${y - GATE_HEIGHT / 2} q ${GATE_WIDTH / 3} ${GATE_HEIGHT / 2} 0 ${GATE_HEIGHT}`} 
            fill="none" 
            stroke={borderStroke} 
            strokeWidth={isActive ? 2.5 : 2} 
          />
          <path 
            d={`M ${x} ${y - GATE_HEIGHT / 2} q ${GATE_WIDTH / 3} ${GATE_HEIGHT / 2} 0 ${GATE_HEIGHT} q ${GATE_WIDTH / 1.5} 0 ${GATE_WIDTH} -${GATE_HEIGHT / 2} q -${GATE_WIDTH / 3} -${GATE_HEIGHT / 2} -${GATE_WIDTH} -${GATE_HEIGHT / 2} Z`} 
            fill={isActive ? '#f0fdf4' : '#ffffff'} 
            stroke={borderStroke} 
            strokeWidth={isActive ? 2.5 : 2} 
          />
        </g>
      );
    } else if (node.type === 'NOT') {
      body = (
        <polygon 
          points={`${x},${y - GATE_HEIGHT / 2} ${x + GATE_WIDTH},${y} ${x},${y + GATE_HEIGHT / 2}`} 
          fill={isActive ? '#f0fdf4' : '#ffffff'} 
          stroke={borderStroke} 
          strokeWidth={isActive ? 2.5 : 2} 
        />
      );
    }

    const isGate = node.type !== 'INPUT' && node.type !== 'OUTPUT' && node.type !== 'CONSTANT';

    return (
      <g key={node.id} className="transition-all duration-200">
        {body}
        {hasBubble && (
          <circle 
            cx={x + GATE_WIDTH + 5} 
            cy={y} 
            r={4} 
            fill="#ffffff" 
            stroke={borderStroke} 
            strokeWidth={2} 
          />
        )}
        {isGate && (
          <text 
            x={x + GATE_WIDTH / 2 - (node.type === 'NOT' ? 8 : 0)} 
            y={y} 
            textAnchor="middle" 
            dominantBaseline="central" 
            fontSize={11} 
            fontWeight="bold" 
            fill={textFill} 
            fontFamily="monospace"
            pointerEvents="none"
          >
            {node.label || node.type}
          </text>
        )}
        {valText !== undefined && (
          <g>
            <rect 
              x={x + GATE_WIDTH / 2 - 11} 
              y={y + GATE_HEIGHT / 2 + 3} 
              width={22} 
              height={14} 
              rx={3} 
              fill={isActive ? '#d1fae5' : '#e2e8f0'} 
              stroke={isActive ? '#059669' : '#94a3b8'} 
              strokeWidth={1} 
            />
            <text 
              x={x + GATE_WIDTH / 2} 
              y={y + GATE_HEIGHT / 2 + 10} 
              textAnchor="middle" 
              dominantBaseline="central" 
              fontSize={9} 
              fontWeight="bold" 
              fill={isActive ? '#065f46' : '#334155'} 
              fontFamily="monospace"
              pointerEvents="none"
            >
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
          
          // High-contrast wire styling: Solid Slate 700 (#334155) for idle, Vivid Emerald (#059669) for active
          const strokeColor = nodeValues !== undefined 
            ? (isActive ? '#059669' : '#334155') 
            : '#334155';
          const strokeWidth = isActive ? 2.75 : 2.0;
          
          // Staggered horizontal bend to avoid multiple parallel lines merging
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
                r={3.5} 
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
    <div className="relative w-full h-full min-h-[400px] overflow-hidden rounded-xl bg-slate-50 border border-slate-200 select-none">
      {/* Zoom / Pan Navigation Overlay */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-white/90 backdrop-blur px-2 py-1 rounded-lg border border-slate-300 shadow-sm text-xs font-mono text-slate-700">
        <button 
          onClick={handleZoomIn} 
          className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded font-bold transition-colors"
          title="Zoom In"
          aria-label="Zoom In"
        >
          +
        </button>
        <span className="w-10 text-center font-bold">{Math.round(zoom * 100)}%</span>
        <button 
          onClick={handleZoomOut} 
          className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded font-bold transition-colors"
          title="Zoom Out"
          aria-label="Zoom Out"
        >
          −
        </button>
        <div className="h-4 w-px bg-slate-300 mx-1"></div>
        <button 
          onClick={handleResetView} 
          className="px-1.5 py-0.5 hover:bg-slate-100 rounded text-[11px] font-sans font-medium transition-colors"
          title="Reset View"
          aria-label="Reset View"
        >
          Reset
        </button>
      </div>

      {/* SVG Canvas with Interactive Drag & Pan */}
      <div 
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg 
          width="100%" 
          height={height} 
          viewBox={`${baseX} ${baseY} ${baseWidth} ${baseHeight}`} 
          xmlns="http://www.w3.org/2000/svg" 
          className="overflow-visible transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
          role="img"
          aria-label={title}
        >
          <defs>
            <pattern id="circuit-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
            </pattern>
          </defs>
          <rect x={baseX - 500} y={baseY - 500} width={baseWidth + 1000} height={baseHeight + 1000} fill="url(#circuit-grid)" />
          {renderWires()}
          {Object.values(nodes).map(renderGate)}
        </svg>
      </div>
    </div>
  );
};
