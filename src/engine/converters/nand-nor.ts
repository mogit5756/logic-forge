import type { ASTNode } from '../expression/parser';

export function convertToNand(node: ASTNode): ASTNode {
  if (node.type === 'VAR') return node;
  
  const left = node.left ? convertToNand(node.left) : undefined;
  const right = node.right ? convertToNand(node.right) : undefined;

  switch (node.type) {
    case 'NOT':
      return { type: 'NAND', left: left, right: left };
    case 'AND': {
      const nand: ASTNode = { type: 'NAND', left: left, right: right };
      return { type: 'NAND', left: nand, right: nand };
    }
    case 'OR': {
      const notLeft: ASTNode = { type: 'NAND', left: left, right: left };
      const notRight: ASTNode = { type: 'NAND', left: right, right: right };
      return { type: 'NAND', left: notLeft, right: notRight };
    }
    case 'XOR': {
      const nandAB: ASTNode = { type: 'NAND', left: left, right: right };
      const leftPart: ASTNode = { type: 'NAND', left: left, right: nandAB };
      const rightPart: ASTNode = { type: 'NAND', left: right, right: nandAB };
      return { type: 'NAND', left: leftPart, right: rightPart };
    }
    case 'XNOR': {
      const xor = convertToNand({ type: 'XOR', left: node.left, right: node.right });
      return { type: 'NAND', left: xor, right: xor };
    }
    default:
      return node;
  }
}

export function convertToNor(node: ASTNode): ASTNode {
  if (node.type === 'VAR') return node;
  
  const left = node.left ? convertToNor(node.left) : undefined;
  const right = node.right ? convertToNor(node.right) : undefined;

  switch (node.type) {
    case 'NOT':
      return { type: 'NOR', left: left, right: left };
    case 'OR': {
      const nor: ASTNode = { type: 'NOR', left: left, right: right };
      return { type: 'NOR', left: nor, right: nor };
    }
    case 'AND': {
      const notLeft: ASTNode = { type: 'NOR', left: left, right: left };
      const notRight: ASTNode = { type: 'NOR', left: right, right: right };
      return { type: 'NOR', left: notLeft, right: notRight };
    }
    case 'XOR': {
      const norAB: ASTNode = { type: 'NOR', left: left, right: right };
      const notA: ASTNode = { type: 'NOR', left: left, right: left };
      const notB: ASTNode = { type: 'NOR', left: right, right: right };
      const andAB: ASTNode = { type: 'NOR', left: notA, right: notB };
      return { type: 'NOR', left: norAB, right: andAB };
    }
    case 'XNOR': {
      const xor = convertToNor({ type: 'XOR', left: node.left, right: node.right });
      return { type: 'NOR', left: xor, right: xor };
    }
    default:
      return node;
  }
}
