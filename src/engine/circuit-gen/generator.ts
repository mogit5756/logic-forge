import type { ASTNode } from '../expression/parser';
import type { Circuit, CircuitNode, GateType } from '../types';

let idCounter = 0;
const generateId = (prefix: string) => `${prefix}_${idCounter++}`;

export function getVariablesFromAST(node: ASTNode, vars: Set<string> = new Set()): Set<string> {
  if (node.type === 'VAR' && node.value !== undefined) {
    vars.add(String(node.value));
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
  
  // Use Maps to cache visited AST node object references and structural signatures.
  // This turns the AST into a strictly minimal DAG and eliminates duplicate subexpressions and inverters.
  const visitedObj = new Map<ASTNode, string>();
  const visitedSig = new Map<string, string>();
  
  function traverse(node: ASTNode): string {
    if (visitedObj.has(node)) {
      return visitedObj.get(node)!;
    }
    
    if (node.type === 'VAR') {
      const varName = String(node.value);
      if (inputMap[varName]) {
        return inputMap[varName];
      } else {
        const id = generateId(`IN_${varName}`);
        nodes[id] = { id, type: 'INPUT', label: varName, inputs: [] };
        inputNodes.push(id);
        inputMap[varName] = id;
        return id;
      }
    }
    
    if (node.type === 'CONSTANT') {
      const id = generateId(`CONST_${node.value}`);
      const val: 0 | 1 = node.value === 1 || node.value === '1' ? 1 : 0;
      nodes[id] = { id, type: 'CONSTANT', label: node.value?.toString(), value: val, inputs: [] };
      visitedObj.set(node, id);
      return id;
    }
    
    const gateInputs: string[] = [];
    if (node.left) gateInputs.push(traverse(node.left));
    if (node.right) gateInputs.push(traverse(node.right));
    
    // Structural signature for deduplicating identical subtrees/inverters
    // For 2-input commutative gates, sort inputs to canonical form
    const isCommutative = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR'].includes(node.type);
    const sortedInputs = isCommutative ? [...gateInputs].sort() : gateInputs;
    const signature = `${node.type}(${sortedInputs.join(',')})`;

    if (visitedSig.has(signature)) {
      const existingId = visitedSig.get(signature)!;
      visitedObj.set(node, existingId);
      return existingId;
    }

    const id = generateId(node.type);
    visitedObj.set(node, id);
    visitedSig.set(signature, id);
    
    nodes[id] = { id, type: node.type as GateType, inputs: gateInputs };
    return id;
  }
  
  const rootId = traverse(ast);
  
  const outId = generateId('OUT');
  nodes[outId] = { id: outId, type: 'OUTPUT', label: 'Y', inputs: [rootId] };
  
  return { nodes, inputNodes, outputNodes: [outId] };
}
