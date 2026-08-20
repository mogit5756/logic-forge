export type TokenType = 'VAR' | 'CONSTANT' | 'NOT' | 'AND' | 'OR' | 'XOR' | 'XNOR' | 'LPAREN' | 'RPAREN' | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
}

export type ASTNodeType = 'VAR' | 'NOT' | 'AND' | 'OR' | 'XOR' | 'XNOR' | 'NAND' | 'NOR' | 'CONSTANT';

export interface ASTNode {
  type: ASTNodeType;
  value?: string | number;
  left?: ASTNode;
  right?: ASTNode;
}

export const VARIABLE_NAME_PATTERN = /^[A-Z][A-Z0-9]{0,2}$/;
export const RESERVED_VARIABLE_NAMES = new Set(['AND', 'OR', 'NOT', 'XOR', 'XNOR', 'NAND', 'NOR']);

export function isValidVariableName(name: string): boolean {
  const normalized = name.trim().toUpperCase();
  return VARIABLE_NAME_PATTERN.test(normalized) && !RESERVED_VARIABLE_NAMES.has(normalized);
}

function matchKeyword(str: string, index: number): { type: TokenType; value: string } | null {
  const keywords: Array<[string, TokenType]> = [
    ['XNOR', 'XNOR'],
    ['XOR', 'XOR'],
    ['AND', 'AND'],
    ['NOT', 'NOT'],
    ['OR', 'OR'],
  ];
  for (const [keyword, type] of keywords) {
    if (str.startsWith(keyword, index)) return { type, value: keyword };
  }
  return null;
}

export function tokenize(expr: string, knownVariables: string[] = []): Token[] {
  const tokens: Token[] = [];
  const str = expr.replace(/\s+/g, '').toUpperCase();
  const variables = [...new Set(knownVariables
    .map(value => value.trim().toUpperCase())
    .filter(isValidVariableName))]
    .sort((a, b) => b.length - a.length);
  let i = 0;

  while (i < str.length) {
    const char = str[i];

    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: char });
      i++;
    } else if (char === ')') {
      tokens.push({ type: 'RPAREN', value: char });
      i++;
    } else if (char === "'" || char === '!' || char === '~' || char === '¬') {
      tokens.push({ type: 'NOT', value: char });
      i++;
    } else if (char === '+' || char === '|') {
      tokens.push({ type: 'OR', value: char });
      i++;
    } else if (char === '*' || char === '.' || char === '&') {
      tokens.push({ type: 'AND', value: char });
      i++;
    } else if (char === '^') {
      tokens.push({ type: 'XOR', value: char });
      i++;
    } else if (char === '0' || char === '1') {
      tokens.push({ type: 'CONSTANT', value: char });
      i++;
    } else if (/[A-Z]/.test(char)) {
      const matchedVariable = variables.find(variable => str.startsWith(variable, i));
      const keyword = matchKeyword(str, i);

      // A known variable such as IN1 must win over the keyword IN/… prefix.
      // For compact notation such as A AND B, the shorter variable A must not
      // consume the AND keyword, so keywords win unless the variable is longer.
      if (matchedVariable && (!keyword || matchedVariable.length > keyword.value.length)) {
        tokens.push({ type: 'VAR', value: matchedVariable });
        i += matchedVariable.length;
      } else if (keyword) {
        tokens.push(keyword);
        i += keyword.value.length;
      } else {
        // Without an explicit variable dictionary, retain classic compact
        // single-letter notation (AB means A AND B). Unknown identifiers that
        // contain digits are consumed as one variable, e.g. IN1.
        let end = i + 1;
        while (end < str.length && /[A-Z]/.test(str[end])) {
          end++;
        }
        if (end < str.length && /[0-9]/.test(str[end])) {
          end++;
          while (end < str.length && /[A-Z0-9]/.test(str[end])) end++;
          tokens.push({ type: 'VAR', value: str.slice(i, end) });
          i = end;
        } else {
          tokens.push({ type: 'VAR', value: char });
          i++;
        }
      }
    } else {
      throw new Error(`Unexpected character: ${char} at position ${i}`);
    }
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// Precedence: NOT > AND > XOR/XNOR > OR
export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(expr: string, knownVariables: string[] = []) {
    this.tokens = tokenize(expr, knownVariables);
  }

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  public parse(): ASTNode {
    const node = this.parseOr();
    if (this.peek().type !== 'EOF') {
      throw new Error(`Unexpected token at end: ${this.peek().value}`);
    }
    return node;
  }

  private parseOr(): ASTNode {
    let left = this.parseXor();
    while (this.peek().type === 'OR') {
      this.consume();
      const right = this.parseXor();
      left = { type: 'OR', left, right };
    }
    return left;
  }

  private parseXor(): ASTNode {
    let left = this.parseAnd();
    while (this.peek().type === 'XOR' || this.peek().type === 'XNOR') {
      const op = this.consume().type as 'XOR' | 'XNOR';
      const right = this.parseAnd();
      left = { type: op, left, right };
    }
    return left;
  }

  private parseAnd(): ASTNode {
    let left = this.parseNot();

    while (true) {
      const type = this.peek().type;
      if (type === 'AND') {
        this.consume();
        const right = this.parseNot();
        left = { type: 'AND', left, right };
      } else if (type === 'VAR' || type === 'CONSTANT' || type === 'LPAREN' || type === 'NOT') {
        // Implicit AND (e.g. AB, A(B+C), or A1B1 with known variables).
        const right = this.parseNot();
        left = { type: 'AND', left, right };
      } else {
        break;
      }
    }

    return left;
  }

  private parseNot(): ASTNode {
    const type = this.peek().type;

    if (type === 'NOT') {
      this.consume();
      const right = this.parseNot();
      return { type: 'NOT', left: right };
    }

    let node = this.parsePrimary();

    while (this.peek().type === 'NOT') {
      this.consume();
      node = { type: 'NOT', left: node };
    }

    return node;
  }

  private parsePrimary(): ASTNode {
    const token = this.consume();
    if (token.type === 'VAR') {
      return { type: 'VAR', value: token.value };
    }
    if (token.type === 'CONSTANT') {
      return { type: 'CONSTANT', value: Number(token.value) as 0 | 1 };
    }
    if (token.type === 'LPAREN') {
      const node = this.parseOr();
      if (this.consume().type !== 'RPAREN') {
        throw new Error("Expected closing parenthesis ')'" );
      }
      return node;
    }
    throw new Error(`Unexpected token in expression: ${token.value || token.type}`);
  }
}
