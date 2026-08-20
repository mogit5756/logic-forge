import type { ASTNode } from '../expression/parser';

function nandNot(node: ASTNode): ASTNode {
  if (node.type === 'NAND' && node.left === node.right) {
    return node.left!;
  }
  return { type: 'NAND', left: node, right: node };
}

function norNot(node: ASTNode): ASTNode {
  if (node.type === 'NOR' && node.left === node.right) {
    return node.left!;
  }
  return { type: 'NOR', left: node, right: node };
}

export function convertToNand(node: ASTNode): ASTNode {
  if (node.type === 'VAR' || node.type === 'CONSTANT') return node;
  
  const left = node.left ? convertToNand(node.left) : undefined;
  const right = node.right ? convertToNand(node.right) : undefined;

  switch (node.type) {
    case 'NOT':
      return nandNot(left!);
    case 'AND': {
      const nand: ASTNode = { type: 'NAND', left: left, right: right };
      return nandNot(nand);
    }
    case 'OR': {
      const notLeft = nandNot(left!);
      const notRight = nandNot(right!);
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
      return nandNot(xor);
    }
    default:
      return node;
  }
}

export function convertToNor(node: ASTNode): ASTNode {
  if (node.type === 'VAR' || node.type === 'CONSTANT') return node;
  
  const left = node.left ? convertToNor(node.left) : undefined;
  const right = node.right ? convertToNor(node.right) : undefined;

  switch (node.type) {
    case 'NOT':
      return norNot(left!);
    case 'OR': {
      const nor: ASTNode = { type: 'NOR', left: left, right: right };
      return norNot(nor);
    }
    case 'AND': {
      const notLeft = norNot(left!);
      const notRight = norNot(right!);
      return { type: 'NOR', left: notLeft, right: notRight };
    }
    case 'XOR': {
      const norAB: ASTNode = { type: 'NOR', left: left, right: right };
      const notA = norNot(left!);
      const notB = norNot(right!);
      const andAB: ASTNode = { type: 'NOR', left: notA, right: notB };
      return { type: 'NOR', left: norAB, right: andAB };
    }
    case 'XNOR': {
      const xor = convertToNor({ type: 'XOR', left: node.left, right: node.right });
      return norNot(xor);
    }
    default:
      return node;
  }
}
