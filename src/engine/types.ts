export type GateType = 'AND' | 'OR' | 'NOT' | 'NAND' | 'NOR' | 'XOR' | 'XNOR' | 'INPUT' | 'OUTPUT' | 'CONSTANT';

export interface CircuitNode {
  id: string;
  type: GateType;
  label?: string; // used for inputs/outputs or debugging
  inputs: string[]; // IDs of nodes feeding into this node
  value?: 0 | 1; // Used for CONSTANT type
  x?: number;
  y?: number;
}

export interface Circuit {
  nodes: Record<string, CircuitNode>;
  inputNodes: string[]; // IDs of the primary input nodes
  outputNodes: string[]; // IDs of the primary output nodes
}

export interface TruthTableRow {
  inputs: Record<string, 0 | 1>;
  output: 0 | 1 | 'X';
}

export interface BooleanFunction {
  numVariables: number; // 2 to 6
  variableNames: string[];
  
  minterms: number[];
  dontCares: number[];
  
  maxterms: number[];
  truthTable: TruthTableRow[];
  
  simplifiedSOP?: string;
  simplifiedPOS?: string;
}

export type LogicValue = 0 | 1 | 'X';
