export type TokenType = 'VAR' | 'NOT' | 'AND' | 'OR' | 'XOR' | 'XNOR' | 'LPAREN' | 'RPAREN' | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
}

export type ASTNodeType = 'VAR' | 'NOT' | 'AND' | 'OR' | 'XOR' | 'XNOR' | 'NAND' | 'NOR';

export interface ASTNode {
  type: ASTNodeType;
  value?: string;
  left?: ASTNode;
  right?: ASTNode;
}

export function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  
  // Clean whitespace
  const str = expr.replace(/\s+/g, '').toUpperCase();
  
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
    } else {
      // Check for multi-char words: AND, OR, NOT, XOR, XNOR
      if (str.startsWith('NOT', i)) {
        tokens.push({ type: 'NOT', value: 'NOT' });
        i += 3;
      } else if (str.startsWith('AND', i)) {
        tokens.push({ type: 'AND', value: 'AND' });
        i += 3;
      } else if (str.startsWith('XNOR', i)) {
        tokens.push({ type: 'XNOR', value: 'XNOR' });
        i += 4;
      } else if (str.startsWith('XOR', i)) {
        tokens.push({ type: 'XOR', value: 'XOR' });
        i += 3;
      } else if (str.startsWith('OR', i)) {
        tokens.push({ type: 'OR', value: 'OR' });
        i += 2;
      } else if (/[A-Z]/.test(char)) {
        tokens.push({ type: 'VAR', value: char });
        i++;
      } else {
        throw new Error(`Unexpected character: ${char} at position ${i}`);
      }
    }
  }
  
  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// Precedence: NOT > AND > XOR/XNOR > OR
export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(expr: string) {
    this.tokens = tokenize(expr);
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
      } else if (type === 'VAR' || type === 'LPAREN' || type === 'NOT') {
        // Implicit AND (e.g. AB -> A AND B)
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
      // Prefix NOT (e.g. !A)
      this.consume();
      const right = this.parseNot();
      return { type: 'NOT', left: right };
    }
    
    let node = this.parsePrimary();
    
    // Postfix NOT (e.g. A')
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
    } else if (token.type === 'LPAREN') {
      const node = this.parseOr();
      if (this.consume().type !== 'RPAREN') {
        throw new Error("Expected closing parenthesis ')'");
      }
      return node;
    }
    throw new Error(`Unexpected token in expression: ${token.value || token.type}`);
  }
}
