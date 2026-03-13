import type { XMLNode } from "./types";

const NAME_REGEX = /[A-Za-z0-9:_-]/;
const WS_REGEX = /\s/;

export class Parser {
  private xml: string;
  private i: number = 0;
  private len: number;
  private line: number = 1;
  private column: number = 1;
  private namespaces: Record<string, string> = {};

  constructor(xml: string) {
    this.xml = xml;
    this.len = xml.length;
  }

  parse(): any {
    this.namespaces = {};
    this.skipWhitespace();
    if (this.i < this.len && this.xml.charCodeAt(this.i) !== 60) {
      throw new Error(`Unexpected content before root element at ${this.pos()}`);
    }
    this.skipDeclaration();
    while (this.xml.charCodeAt(this.i) === 60 && this.xml.charCodeAt(this.i + 1) === 63) {
      this.skipProcessingInstruction();
    }
    if (this.xml.startsWith("<!DOCTYPE", this.i)) {
      this.skipDoctype();
    }
    const node = this.parseElement();
    this.skipWhitespace();
    if (this.i < this.len) {
      throw new Error(`Unexpected content after root element at ${this.pos()}`);
    }
    return { [node.name]: node.value };
  }

  private stripPrefix(name: string): string {
    const colonIndex = name.indexOf(":");
    if (colonIndex === -1) return name;
    const prefix = name.slice(0, colonIndex);
    return this.namespaces[prefix] ? name.slice(colonIndex + 1) : name;
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

  private skipDoctype(): void {
    if (this.xml.startsWith("<!DOCTYPE", this.i)) {
      let depth = 1;
      let i = this.i + 9;
      while (i < this.len && depth > 0) {
        if (this.xml.startsWith("<!--", i)) {
          const end = this.xml.indexOf("-->", i);
          if (end === -1) throw new Error(`Unclosed comment in DOCTYPE at ${this.pos()}`);
          i = end + 3;
        } else if (this.xml.charCodeAt(i) === 60 && this.xml.charCodeAt(i + 1) === 33) {
          depth++;
          i++;
        } else if (this.xml.charCodeAt(i) === 62) {
          depth--;
        }
        i++;
      }
      this.advance(i - this.i);
    }
  }

  private parseElement(): { name: string; value: unknown } {
    this.expect("<");
    const rawName = this.readName();
    const name = this.stripPrefix(rawName);

    const parentNamespaces = { ...this.namespaces };
    const attrs: Record<string, unknown> = {};
    while (true) {
      this.skipWhitespace();
      const ch = this.peek();
      if (ch === "/" || ch === ">") break;
      const attr = this.readName();
      this.expect("=");
      const val = this.readQuoted();
      if (attr.startsWith("xmlns:")) {
        const prefix = attr.slice(6);
        this.namespaces[prefix] = val;
        attrs[`$${prefix}`] = val;
      } else if (attr === "xmlns") {
        this.namespaces["_default"] = val;
        attrs["$default"] = val;
      } else {
        attrs[`@${attr}`] = val;
      }
    }

    if (this.peek() === "/") {
      this.namespaces = parentNamespaces;
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
      if (this.xml.startsWith("<!DOCTYPE", this.i)) {
        this.skipDoctype();
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

    this.namespaces = parentNamespaces;

    const hasChildren = children.length > 0;
    if (!hasChildren) {
      return { name, value: attrs };
    }

    const elementChildren = children.filter((c) => typeof c === "object" && c !== null) as Record<
      string,
      unknown
    >[];
    const textChildren = children.filter((c) => typeof c === "string") as string[];

    if (elementChildren.length > 0 && textChildren.length > 0) {
      attrs["#children"] = children;
      return { name, value: attrs };
    }

    if (elementChildren.length === 0) {
      if (textChildren.length === 1 && Object.keys(attrs).length === 0) {
        return { name, value: textChildren[0] };
      }
      if (textChildren.length > 0 && Object.keys(attrs).length === 0) {
        return { name, value: textChildren.join("") };
      }
      if (textChildren.length > 0) {
        attrs["#text"] = textChildren.join("");
      }
      return { name, value: attrs };
    }

    if (elementChildren.length === 1) {
      if (Object.keys(attrs).length === 0) {
        return { name, value: elementChildren[0] };
      }
      return { name, value: { ...attrs, ...elementChildren[0] } };
    }

    const firstKey = Object.keys(elementChildren[0])[0];
    const allSameKey = elementChildren.every((c) => Object.keys(c)[0] === firstKey);

    if (allSameKey) {
      const values = elementChildren.map((c) => c[firstKey]);
      return { name, value: { ...attrs, [firstKey]: values } };
    }

    return { name, value: { ...attrs, ...Object.assign({}, ...elementChildren) } };
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
