import type { Circuit } from '../types';

export function assignLayers(circuit: Circuit): void {
  const layers: Record<string, number> = {};
  const { nodes, inputNodes } = circuit;
  
  for (const id of inputNodes) {
    layers[id] = 0;
  }
  
  function computeLayer(id: string): number {
    if (layers[id] !== undefined) return layers[id];
    
    const node = nodes[id];
    if (!node) return 0;
    
    let maxDepth = -1;
    for (const inId of node.inputs) {
      const depth = computeLayer(inId);
      if (depth > maxDepth) maxDepth = depth;
    }
    
    layers[id] = maxDepth + 1;
    return layers[id];
  }
  
  const maxLayerIds: Record<number, string[]> = {};
  let maxGlobalLayer = 0;
  for (const id of Object.keys(nodes)) {
    const l = computeLayer(id);
    if (l > maxGlobalLayer) maxGlobalLayer = l;
    if (!maxLayerIds[l]) maxLayerIds[l] = [];
    maxLayerIds[l].push(id);
  }
  
  const LAYER_WIDTH = 160;
  const NODE_HEIGHT = 80;
  
  for (let l = 0; l <= maxGlobalLayer; l++) {
    const nodesInLayer = maxLayerIds[l] || [];
    
    // Barycenter heuristic: Sort nodes by the average Y position of their inputs
    if (l > 0) {
      nodesInLayer.sort((a, b) => {
        const avgY = (id: string) => {
          const node = nodes[id];
          if (!node || node.inputs.length === 0) return 0;
          let sum = 0;
          let count = 0;
          for (const inId of node.inputs) {
            const inNode = nodes[inId];
            if (inNode && inNode.y !== undefined) {
              sum += inNode.y;
              count++;
            }
          }
          return count > 0 ? sum / count : 0;
        };
        return avgY(a) - avgY(b);
      });
    }

    const totalHeight = nodesInLayer.length * NODE_HEIGHT;
    let currentY = -totalHeight / 2 + NODE_HEIGHT / 2;
    
    // Simple vertical centering
    for (const id of nodesInLayer) {
      nodes[id].x = l * LAYER_WIDTH;
      nodes[id].y = currentY;
      currentY += NODE_HEIGHT;
    }
  }
}
