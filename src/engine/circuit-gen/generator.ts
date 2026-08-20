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
  
  // Use a Map to cache visited AST node object references. 
  // This turns the AST into a DAG and completely eliminates duplicate subexpressions/inverters.
  const visited = new Map<ASTNode, string>();
  
  function traverse(node: ASTNode): string {
    if (visited.has(node)) {
      return visited.get(node)!;
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
      visited.set(node, id);
      return id;
    }
    
    const id = generateId(node.type);
    
    // We must set it in visited BEFORE traversing children in case of loops (though ASTs are trees here)
    visited.set(node, id);
    
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
