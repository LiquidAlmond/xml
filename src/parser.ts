import type { XMLNode } from "./types";

const NAME_REGEX = /[A-Za-z0-9:_-]/;
const WS_REGEX = /\s/;

export class Parser {
  private xml: string;
  private i: number = 0;
  private len: number;
  private line: number = 1;
  private column: number = 1;

  constructor(xml: string) {
    this.xml = xml;
    this.len = xml.length;
  }

  parse(): any {
    this.skipDeclaration();
    while (this.xml.charCodeAt(this.i) === 60 && this.xml.charCodeAt(this.i + 1) === 63) {
      this.skipProcessingInstruction();
    }
    const node = this.parseElement();
    return { [node.name]: node.value };
  }

  private pos(): string {
    return `line ${this.line}, column ${this.column}`;
  }

  private advance(n: number): void {
    for (let j = 0; j < n; j++) {
      if (this.xml.charCodeAt(this.i + j) === 10) {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
    }
    this.i += n;
  }

  private skipDeclaration(): void {
    if (this.xml.charCodeAt(this.i) === 60 && this.xml.charCodeAt(this.i + 1) === 63) {
      const end = this.xml.indexOf("?>", this.i);
      if (end === -1) throw new Error(`Unclosed processing instruction at ${this.pos()}`);
      this.advance(end - this.i + 2);
    }
  }

  private skipProcessingInstruction(): void {
    if (this.xml.charCodeAt(this.i) === 60 && this.xml.charCodeAt(this.i + 1) === 63) {
      const end = this.xml.indexOf("?>", this.i);
      if (end === -1) throw new Error(`Unclosed processing instruction at ${this.pos()}`);
      this.advance(end - this.i + 2);
    }
  }

  private skipComment(): void {
    if (this.xml.startsWith("<!--", this.i)) {
      const end = this.xml.indexOf("-->", this.i);
      if (end === -1) throw new Error(`Unclosed comment at ${this.pos()}`);
      this.advance(end - this.i + 3);
    }
  }

  private parseElement(): { name: string; value: unknown } {
    this.expect("<");
    const name = this.readName();

    const attrs: Record<string, unknown> = {};
    while (true) {
      this.skipWhitespace();
      const ch = this.peek();
      if (ch === "/" || ch === ">") break;
      const attr = this.readName();
      this.expect("=");
      const val = this.readQuoted();
      attrs[`@${attr}`] = val;
    }

    if (this.peek() === "/") {
      this.advance(2);
      return { name, value: attrs };
    }

    this.expect(">");

    const children: (string | Record<string, unknown> | null)[] = [];

    while (!this.startsWith("</")) {
      while (this.startsWith("<!--")) {
        this.skipComment();
      }
      if (this.startsWith("</")) break;
      while (this.xml.charCodeAt(this.i) === 60 && this.xml.charCodeAt(this.i + 1) === 63) {
        this.skipProcessingInstruction();
      }
      if (this.startsWith("</")) break;

      if (this.startsWith("<![CDATA[")) {
        this.advance(9);
        const end = this.xml.indexOf("]]>", this.i);
        const text = this.xml.slice(this.i, end);
        children.push({ "[CDATA]": text });
        this.advance(end - this.i + 3);
        continue;
      }

      if (this.peek() === "<") {
        const child = this.parseElement();
        children.push({ [child.name]: child.value });
        continue;
      }

      const text = this.readText();
      const trimmed = text.trim();
      if (trimmed) children.push(trimmed);
    }

    this.expect("</");
    this.readName();
    this.expect(">");

    const hasAttrs = Object.keys(attrs).length > 0;
    const hasChildren = children.length > 0;
    const singleChild = children.length === 1 ? children[0] : null;

    if (singleChild && !hasAttrs) {
      return { name, value: singleChild as XMLNode[string] };
    } else if (singleChild && typeof singleChild === "string") {
      attrs["#text"] = singleChild;
      return { name, value: attrs };
    } else if (hasChildren) {
      attrs["#children"] = children;
      return { name, value: attrs };
    }

    return { name, value: attrs };
  }

  private readName(): string {
    const start = this.i;
    while (this.i < this.len && NAME_REGEX.test(this.xml[this.i])) {
      this.i++;
    }
    this.column += this.i - start;
    return this.xml.slice(start, this.i);
  }

  private readQuoted(): string {
    const q = this.xml.charCodeAt(this.i++);
    this.column++;
    const start = this.i;
    while (this.i < this.len && this.xml.charCodeAt(this.i) !== q) {
      this.i++;
    }
    const val = this.xml.slice(start, this.i);
    this.i++;
    this.column += this.i - start + 1;
    return val;
  }

  private readText(): string {
    const start = this.i;
    while (this.i < this.len && this.xml.charCodeAt(this.i) !== 60) {
      this.i++;
    }
    const text = this.xml.slice(start, this.i);
    for (const ch of text) {
      if (ch === "\n") {
        this.line++;
        this.column = 1;
      } else {
        this.column++;
      }
    }
    return text;
  }

  private expect(s: string): void {
    if (!this.startsWith(s)) throw new Error(`Invalid XML at ${this.pos()}: expected "${s}"`);
    this.advance(s.length);
  }

  private peek(): string {
    return this.xml[this.i];
  }

  private startsWith(s: string): boolean {
    return this.xml.startsWith(s, this.i);
  }

  private skipWhitespace(): void {
    while (this.i < this.len && WS_REGEX.test(this.xml[this.i])) {
      this.advance(1);
    }
  }
}
