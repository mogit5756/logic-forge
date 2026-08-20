import type { ASTNode } from '../expression/parser';

export function nandNot(node: ASTNode): ASTNode {
  if (node.type === 'NAND' && node.left === node.right) {
    return node.left!;
  }
  return { type: 'NAND', left: node, right: node };
}

export function norNot(node: ASTNode): ASTNode {
  if (node.type === 'NOR' && node.left === node.right) {
    return node.left!;
  }
  return { type: 'NOR', left: node, right: node };
}

function collectOperands(node: ASTNode, opType: 'AND' | 'OR'): ASTNode[] {
  if (node.type === opType) {
    return [
      ...(node.left ? collectOperands(node.left, opType) : []),
      ...(node.right ? collectOperands(node.right, opType) : [])
    ];
  }
  return [node];
}

// Converts a product of terms into a NAND tree producing NOT(product)
function buildInvertedProductNand(andNode: ASTNode): ASTNode {
  const literals = collectOperands(andNode, 'AND');
  if (literals.length === 1) {
    return nandNot(convertToNand(literals[0]));
  }
  let acc: ASTNode = {
    type: 'NAND',
    left: convertToNand(literals[0]),
    right: convertToNand(literals[1])
  };
  for (let i = 2; i < literals.length; i++) {
    acc = {
      type: 'NAND',
      left: nandNot(acc),
      right: convertToNand(literals[i])
    };
  }
  return acc;
}

// Converts a sum of terms into a NOR tree producing NOT(sum)
function buildInvertedSumNor(orNode: ASTNode): ASTNode {
  const literals = collectOperands(orNode, 'OR');
  if (literals.length === 1) {
    return norNot(convertToNor(literals[0]));
  }
  let acc: ASTNode = {
    type: 'NOR',
    left: convertToNor(literals[0]),
    right: convertToNor(literals[1])
  };
  for (let i = 2; i < literals.length; i++) {
    acc = {
      type: 'NOR',
      left: norNot(acc),
      right: convertToNor(literals[i])
    };
  }
  return acc;
}

export function convertToNand(node: ASTNode): ASTNode {
  if (node.type === 'VAR' || node.type === 'CONSTANT') return node;

  switch (node.type) {
    case 'NOT':
      return nandNot(convertToNand(node.left!));

    case 'OR': {
      // 2-Level SOP De Morgan Optimization:
      // T1 + T2 + ... + Tm = NAND( NOT(T1), NOT(T2), ..., NOT(Tm) )
      const terms = collectOperands(node, 'OR');
      if (terms.length === 1) {
        return convertToNand(terms[0]);
      }
      // For each product term, buildInvertedProductNand gives NOT(T_i) directly in 1 NAND stage
      const invertedTerms = terms.map(t => {
        if (t.type === 'AND') {
          return buildInvertedProductNand(t);
        }
        return nandNot(convertToNand(t));
      });

      // Now combine inverted terms with a NAND tree
      let acc: ASTNode = {
        type: 'NAND',
        left: invertedTerms[0],
        right: invertedTerms[1]
      };
      for (let i = 2; i < invertedTerms.length; i++) {
        acc = {
          type: 'NAND',
          left: nandNot(acc),
          right: invertedTerms[i]
        };
      }
      return acc;
    }

    case 'AND': {
      const invProd = buildInvertedProductNand(node);
      return nandNot(invProd);
    }

    case 'NAND':
      // NAND is already in the target family; still normalize both inputs
      // because a programmatically supplied AST may contain mixed gate types.
      return {
        type: 'NAND',
        left: convertToNand(node.left!),
        right: convertToNand(node.right!)
      };

    case 'NOR':
      // NOR(a,b) = NOT(a OR b). Convert the OR expression to NANDs first,
      // then realize the final inversion with a NAND used as an inverter.
      return nandNot(convertToNand({ type: 'OR', left: node.left, right: node.right }));

    case 'XOR': {
      const left = convertToNand(node.left!);
      const right = convertToNand(node.right!);
      const nandAB: ASTNode = { type: 'NAND', left, right };
      const leftPart: ASTNode = { type: 'NAND', left, right: nandAB };
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

  switch (node.type) {
    case 'NOT':
      return norNot(convertToNor(node.left!));

    case 'AND': {
      // 2-Level POS De Morgan Optimization:
      // S1 * S2 * ... * Sm = NOR( NOT(S1), NOT(S2), ..., NOT(Sm) )
      const terms = collectOperands(node, 'AND');
      if (terms.length === 1) {
        return convertToNor(terms[0]);
      }
      const invertedTerms = terms.map(t => {
        if (t.type === 'OR') {
          return buildInvertedSumNor(t);
        }
        return norNot(convertToNor(t));
      });

      let acc: ASTNode = {
        type: 'NOR',
        left: invertedTerms[0],
        right: invertedTerms[1]
      };
      for (let i = 2; i < invertedTerms.length; i++) {
        acc = {
          type: 'NOR',
          left: norNot(acc),
          right: invertedTerms[i]
        };
      }
      return acc;
    }

    case 'OR': {
      const invSum = buildInvertedSumNor(node);
      return norNot(invSum);
    }

    case 'NOR':
      // NOR is already in the target family; still normalize both inputs
      // because a programmatically supplied AST may contain mixed gate types.
      return {
        type: 'NOR',
        left: convertToNor(node.left!),
        right: convertToNor(node.right!)
      };

    case 'NAND':
      // NAND(a,b) = NOT(a AND b). Convert the AND expression to NORs first,
      // then realize the final inversion with a NOR used as an inverter.
      return norNot(convertToNor({ type: 'AND', left: node.left, right: node.right }));

    case 'XOR': {
      const left = convertToNor(node.left!);
      const right = convertToNor(node.right!);
      const norAB: ASTNode = { type: 'NOR', left, right };
      const notA = norNot(left);
      const notB = norNot(right);
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

