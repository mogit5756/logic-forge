import type { Circuit } from '../types';

export function evaluateCircuit(
  circuit: Circuit,
  inputs: Record<string, 0 | 1>
): Record<string, 0 | 1> {
  const memo = new Map<string, 0 | 1>();

  const evalNode = (nodeId: string): 0 | 1 => {
    if (memo.has(nodeId)) {
      return memo.get(nodeId)!;
    }

    const node = circuit.nodes[nodeId];
    if (!node) {
      throw new Error(`Node ${nodeId} not found in circuit`);
    }

    let result: 0 | 1;

    switch (node.type) {
      case 'INPUT':
        if (inputs[node.id] !== undefined) {
          result = inputs[node.id];
        } else if (node.label && inputs[node.label] !== undefined) {
          result = inputs[node.label];
        } else {
          throw new Error(`Input value for ${node.label || node.id} not provided`);
        }
        break;
      case 'CONSTANT':
        result = (node.value ?? 0) as 0 | 1;
        break;
      case 'NOT':
        result = evalNode(node.inputs[0]) === 0 ? 1 : 0;
        break;
      case 'AND':
        result = node.inputs.every((i) => evalNode(i) === 1) ? 1 : 0;
        break;
      case 'OR':
        result = node.inputs.some((i) => evalNode(i) === 1) ? 1 : 0;
        break;
      case 'NAND':
        result = node.inputs.every((i) => evalNode(i) === 1) ? 0 : 1;
        break;
      case 'NOR':
        result = node.inputs.some((i) => evalNode(i) === 1) ? 0 : 1;
        break;
      case 'XOR': {
        const count = node.inputs.reduce((sum, i) => sum + evalNode(i), 0);
        result = (count % 2) as 0 | 1;
        break;
      }
      case 'XNOR': {
        const count = node.inputs.reduce((sum, i) => sum + evalNode(i), 0);
        result = (count % 2 === 0) ? 1 : 0;
        break;
      }
      case 'OUTPUT':
        result = evalNode(node.inputs[0]);
        break;
      default:
        throw new Error(`Unknown gate type: ${node.type}`);
    }

    memo.set(nodeId, result);
    return result;
  };

  const outputValues: Record<string, 0 | 1> = {};
  for (const outId of circuit.outputNodes) {
    const node = circuit.nodes[outId];
    outputValues[node.label || outId] = evalNode(outId);
  }

  return outputValues;
}

export function evaluateCircuitAllNodes(
  circuit: Circuit,
  inputs: Record<string, 0 | 1>
): Record<string, 0 | 1> {
  const memo = new Map<string, 0 | 1>();

  const evalNode = (nodeId: string): 0 | 1 => {
    if (memo.has(nodeId)) {
      return memo.get(nodeId)!;
    }

    const node = circuit.nodes[nodeId];
    if (!node) {
      throw new Error(`Node ${nodeId} not found in circuit`);
    }

    let result: 0 | 1;

    switch (node.type) {
      case 'INPUT':
        if (inputs[node.id] !== undefined) {
          result = inputs[node.id];
        } else if (node.label && inputs[node.label] !== undefined) {
          result = inputs[node.label];
        } else {
          result = 0; // Default to 0 for missing inputs in lab
        }
        break;
      case 'CONSTANT':
        result = (node.value ?? 0) as 0 | 1;
        break;
      case 'NOT':
        result = evalNode(node.inputs[0]) === 0 ? 1 : 0;
        break;
      case 'AND':
        result = node.inputs.every((i) => evalNode(i) === 1) ? 1 : 0;
        break;
      case 'OR':
        result = node.inputs.some((i) => evalNode(i) === 1) ? 1 : 0;
        break;
      case 'NAND':
        result = node.inputs.every((i) => evalNode(i) === 1) ? 0 : 1;
        break;
      case 'NOR':
        result = node.inputs.some((i) => evalNode(i) === 1) ? 0 : 1;
        break;
      case 'XOR': {
        const count = node.inputs.reduce((sum, i) => sum + evalNode(i), 0);
        result = (count % 2) as 0 | 1;
        break;
      }
      case 'XNOR': {
        const count = node.inputs.reduce((sum, i) => sum + evalNode(i), 0);
        result = (count % 2 === 0) ? 1 : 0;
        break;
      }
      case 'OUTPUT':
        result = evalNode(node.inputs[0]);
        break;
      default:
        throw new Error(`Unknown gate type: ${node.type}`);
    }

    memo.set(nodeId, result);
    return result;
  };

  // Evaluate all outputs to ensure all paths are covered
  for (const outId of circuit.outputNodes) {
    evalNode(outId);
  }

  const allValues: Record<string, 0 | 1> = {};
  for (const [id, val] of memo.entries()) {
    allValues[id] = val;
  }
  return allValues;
}
