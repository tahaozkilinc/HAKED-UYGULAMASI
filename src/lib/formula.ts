// Basit ve güvenli formül değerlendirici. Sadece +, -, *, /, parantez,
// sayı ve alan adı (identifier) destekler. `eval` KULLANILMAZ.
// Örn: "miktar * birim_fiyat", "(miktar - iskonto) * birim_fiyat"

type Token =
  | { type: "num"; value: number }
  | { type: "ident"; value: string }
  | { type: "op"; value: "+" | "-" | "*" | "/" }
  | { type: "lparen" }
  | { type: "rparen" };

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        num += expr[i];
        i++;
      }
      tokens.push({ type: "num", value: parseFloat(num) });
      continue;
    }
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = "";
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) {
        ident += expr[i];
        i++;
      }
      tokens.push({ type: "ident", value: ident });
      continue;
    }
    if ("+-*/".includes(ch)) {
      tokens.push({ type: "op", value: ch as "+" | "-" | "*" | "/" });
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen" });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen" });
      i++;
      continue;
    }
    throw new Error(`Formülde beklenmeyen karakter: "${ch}"`);
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(
    private tokens: Token[],
    private vars: Record<string, number>,
  ) {}

  private peek() {
    return this.tokens[this.pos];
  }

  private next() {
    return this.tokens[this.pos++];
  }

  parse(): number {
    const value = this.parseExpr();
    if (this.pos !== this.tokens.length) {
      throw new Error("Formül ayrıştırılamadı");
    }
    return value;
  }

  private parseExpr(): number {
    let value = this.parseTerm();
    while (this.peek()?.type === "op" && (this.peek() as { type: "op"; value: string }).value.match(/[+-]/)) {
      const op = (this.next() as { type: "op"; value: "+" | "-" }).value;
      const rhs = this.parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  private parseTerm(): number {
    let value = this.parseFactor();
    while (this.peek()?.type === "op" && (this.peek() as { type: "op"; value: string }).value.match(/[*/]/)) {
      const op = (this.next() as { type: "op"; value: "*" | "/" }).value;
      const rhs = this.parseFactor();
      value = op === "*" ? value * rhs : rhs === 0 ? 0 : value / rhs;
    }
    return value;
  }

  private parseFactor(): number {
    const token = this.next();
    if (!token) throw new Error("Formül eksik");
    if (token.type === "num") return token.value;
    if (token.type === "ident") return this.vars[token.value] ?? 0;
    if (token.type === "lparen") {
      const value = this.parseExpr();
      const close = this.next();
      if (close?.type !== "rparen") throw new Error("Kapatılmamış parantez");
      return value;
    }
    if (token.type === "op" && token.value === "-") {
      return -this.parseFactor();
    }
    throw new Error("Formül ayrıştırılamadı");
  }
}

export function evaluateFormula(
  expr: string,
  vars: Record<string, number | string | undefined>,
): number {
  const numericVars: Record<string, number> = {};
  for (const [key, value] of Object.entries(vars)) {
    const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
    numericVars[key] = Number.isFinite(n) ? n : 0;
  }
  try {
    const tokens = tokenize(expr);
    return new Parser(tokens, numericVars).parse();
  } catch {
    return 0;
  }
}
