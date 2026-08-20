import type { ASTNode } from '../expression/parser';
import type { Circuit, CircuitNode, GateType } from '../types';

let idCounter = 0;
const generateId = (prefix: string) => `${prefix}_${idCounter++}`;

export function getVariablesFromAST(node: ASTNode, vars: Set<string> = new Set()): Set<string> {
  if (node.type === 'VAR') {
    vars.add(node.value!);
  }
  if (node.left) getVariablesFromAST(node.left, vars);
  if (node.right) getVariablesFromAST(node.right, vars);
  return vars;
}

export function astToCircuit(ast: ASTNode, variables: string[]): Circuit {
  idCounter = 0;
  const nodes: Record<string, CircuitNode> = {};
  const inputNodes: string[] = [];
  
  const inputMap: Record<string, string> = {};
  for (const v of variables) {
    const id = generateId(`IN_${v}`);
    nodes[id] = { id, type: 'INPUT', label: v, inputs: [] };
    inputNodes.push(id);
    inputMap[v] = id;
  }
  
  // Deduplicate similar expressions to avoid repeating trees?
  // For a simple visualizer, it's better to show the full tree explicitly.
  function traverse(node: ASTNode): string {
    if (node.type === 'VAR') {
      if (inputMap[node.value!]) {
        return inputMap[node.value!];
      } else {
        const id = generateId(`IN_${node.value}`);
        nodes[id] = { id, type: 'INPUT', label: node.value, inputs: [] };
        inputNodes.push(id);
        inputMap[node.value!] = id;
        return id;
      }
    }
    
    const id = generateId(node.type);
    const gateInputs: string[] = [];
    
    if (node.left) gateInputs.push(traverse(node.left));
    if (node.right) gateInputs.push(traverse(node.right));
    
    nodes[id] = { id, type: node.type as GateType, inputs: gateInputs };
    return id;
  }
  
  const rootId = traverse(ast);
  
  const outId = generateId('OUT');
  nodes[outId] = { id: outId, type: 'OUTPUT', label: 'Y', inputs: [rootId] };
  
  return { nodes, inputNodes, outputNodes: [outId] };
}
