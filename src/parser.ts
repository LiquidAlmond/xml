import type { XMLNode } from "./types";

const NAME_REGEX = /[A-Za-z0-9:_-]/;
const WS_REGEX = /\s/;

export class Parser {
  private xml: string;
  private i: number = 0;
  private len: number;

  constructor(xml: string) {
    this.xml = xml;
    this.len = xml.length;
  }

  parse(): any {
    this.skipDeclaration();
    const node = this.parseElement();
    return { [node.name]: node.value };
  }

  private skipDeclaration(): void {
    if (this.xml.charCodeAt(this.i) === 60 && this.xml.charCodeAt(this.i + 1) === 63) {
      const end = this.xml.indexOf("?>", this.i);
      this.i = end + 2;
    }
  }

  private skipComment(): void {
    if (this.xml.startsWith("<!--", this.i)) {
      const end = this.xml.indexOf("-->", this.i);
      if (end === -1) throw new Error("Unclosed comment");
      this.i = end + 3;
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
      this.i += 2;
      return { name, value: attrs };
    }

    this.expect(">");

    const children: (string | Record<string, unknown> | null)[] = [];

    while (!this.startsWith("</")) {
      this.skipComment();

      if (this.startsWith("<![CDATA[")) {
        this.i += 9;
        const end = this.xml.indexOf("]]>", this.i);
        const text = this.xml.slice(this.i, end);
        children.push({ "[CDATA]": text });
        this.i = end + 3;
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
    return this.xml.slice(start, this.i);
  }

  private readQuoted(): string {
    const q = this.xml.charCodeAt(this.i++);
    const start = this.i;
    while (this.i < this.len && this.xml.charCodeAt(this.i) !== q) {
      this.i++;
    }
    const val = this.xml.slice(start, this.i);
    this.i++;
    return val;
  }

  private readText(): string {
    const start = this.i;
    while (this.i < this.len && this.xml.charCodeAt(this.i) !== 60) {
      this.i++;
    }
    return this.xml.slice(start, this.i);
  }

  private expect(s: string): void {
    if (!this.startsWith(s)) throw new Error("Invalid XML");
    this.i += s.length;
  }

  private peek(): string {
    return this.xml[this.i];
  }

  private startsWith(s: string): boolean {
    return this.xml.startsWith(s, this.i);
  }

  private skipWhitespace(): void {
    while (this.i < this.len && WS_REGEX.test(this.xml[this.i])) {
      this.i++;
    }
  }
}
