const CHAR_LT = 60; // <
const CHAR_GT = 62; // >
const CHAR_SLASH = 47; // /
const CHAR_QM = 63; // ?
const CHAR_EX = 33; // !
const CHAR_DASH = 45; // -
const CHAR_BRACKET_L = 91; // [
const CHAR_BRACKET_R = 93; // ]
const CHAR_COLON = 58; // :
const CHAR_EQ = 61; // =
const CHAR_DQ = 34; // "
const CHAR_SQ = 39; // '
const CHAR_SPACE = 32;
const CHAR_TAB = 9;
const CHAR_LF = 10;
const CHAR_CR = 13;

enum TagType {
  EndTag,
  ProcessingInstruction,
  Comment,
  Cdata,
  Doctype,
  ChildElement,
  Text,
}

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
    this.i = 0;
    this.line = 1;
    this.column = 1;
    this.skipWhitespaceAndMisc();
    const node = this.parseElement(new Map());
    this.skipWhitespaceAndMisc();
    if (this.i < this.len) {
      throw new Error(`Unexpected content after root element at ${this.pos()}`);
    }
    return { [node.name]: node.value };
  }

  private pos(): string {
    return `line ${this.line}, column ${this.column}`;
  }

  private peek(): number {
    return this.xml.charCodeAt(this.i);
  }

  private consume(): number {
    const ch = this.xml.charCodeAt(this.i++);
    if (ch === CHAR_LF || ch === CHAR_CR) {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return ch;
  }

  private expect(expected: number): void {
    if (this.consume() !== expected) {
      throw new Error(`Expected ${String.fromCharCode(expected)} at ${this.pos()}`);
    }
  }

  private skipWhitespaceAndMisc(): void {
    while (this.i < this.len) {
      const ch = this.peek();
      if (ch === CHAR_SPACE || ch === CHAR_TAB || ch === CHAR_LF || ch === CHAR_CR) {
        this.consume();
        continue;
      }
      if (ch === CHAR_LT) {
        const next = this.xml.charCodeAt(this.i + 1);
        if (next === CHAR_QM) {
          this.consume();
          this.consume();
          this.scanUntilSequence(
            `Unclosed processing instruction at ${this.pos()}`,
            CHAR_QM,
            CHAR_GT,
          );
          continue;
        }
        if (next === CHAR_EX) {
          const third = this.xml.charCodeAt(this.i + 2);
          if (third === CHAR_DASH) {
            this.consume();
            this.consume();
            this.consume();
            this.scanUntilSequence(
              `Unclosed comment at ${this.pos()}`,
              CHAR_DASH,
              CHAR_DASH,
              CHAR_GT,
            );
            continue;
          }
          if (third === CHAR_BRACKET_L) {
            this.consume();
            this.consume();
            this.consume();
            this.scanUntilSequence(
              `Unclosed CDATA at ${this.pos()}`,
              CHAR_BRACKET_R,
              CHAR_BRACKET_R,
              CHAR_GT,
            );
            continue;
          }
          if ((third >= 65 && third <= 90) || (third >= 97 && third <= 122)) {
            this.skipDoctype();
            continue;
          }
        }
      }
      break;
    }
  }

  private skipDoctype(): void {
    let depth = 1;
    this.consume();
    this.consume();
    while (this.i < this.len && depth > 0) {
      const ch = this.consume();
      if (ch === CHAR_LT && this.peek() === CHAR_EX) {
        const third = this.xml.charCodeAt(this.i + 1);
        if (third === CHAR_DASH) {
          this.scanUntilSequence(
            `Unclosed comment in DOCTYPE at ${this.pos()}`,
            CHAR_DASH,
            CHAR_DASH,
            CHAR_GT,
          );
        } else {
          depth++;
        }
      } else if (ch === CHAR_GT) {
        depth--;
      }
    }
  }

  private scanUntilSequence(errorMsg: string, ...seq: number[]): void {
    while (this.i < this.len) {
      let found = true;
      for (let j = 0; j < seq.length; j++) {
        if (this.xml.charCodeAt(this.i + j) !== seq[j]) {
          found = false;
          break;
        }
      }
      if (found) {
        for (let j = 0; j < seq.length; j++) {
          this.consume();
        }
        return;
      }
      this.consume();
    }
    throw new Error(errorMsg);
  }

  private detectTagType(): TagType {
    const ch = this.peek();
    if (ch !== CHAR_LT) {
      return TagType.Text;
    }

    const next = this.xml.charCodeAt(this.i + 1);
    if (next === CHAR_SLASH) {
      return TagType.EndTag;
    }
    if (next === CHAR_QM) {
      return TagType.ProcessingInstruction;
    }
    if (next === CHAR_EX) {
      const third = this.xml.charCodeAt(this.i + 2);
      if (third === CHAR_DASH) {
        return TagType.Comment;
      }
      if (third === CHAR_BRACKET_L) {
        return TagType.Cdata;
      }
      if ((third >= 65 && third <= 90) || (third >= 97 && third <= 122)) {
        return TagType.Doctype;
      }
    }
    return TagType.ChildElement;
  }

  private parseAttributes(namespaces: Map<string, string>): {
    attrs: Record<string, unknown>;
    selfClosing: boolean;
  } {
    const attrs: Record<string, unknown> = {};
    let selfClosing = false;

    while (this.i < this.len) {
      this.skipWhitespaceAndMisc();
      const ch = this.peek();
      if (ch === CHAR_GT) {
        this.consume();
        break;
      }
      if (ch === CHAR_SLASH && this.xml.charCodeAt(this.i + 1) === CHAR_GT) {
        this.consume();
        this.consume();
        selfClosing = true;
        break;
      }

      const attrName = this.readName();
      this.expect(CHAR_EQ);
      const quote = this.consume();
      const attrValue = this.readQuoted(quote);

      if (attrName.startsWith("xmlns:")) {
        const prefix = attrName.slice(6);
        namespaces.set(prefix, attrValue);
        attrs[`$${prefix}`] = attrValue;
      } else if (attrName === "xmlns") {
        namespaces.set("_default", attrValue);
        attrs.$default = attrValue;
      } else {
        attrs[`@${attrName}`] = attrValue;
      }
    }

    return { attrs, selfClosing };
  }

  private handleProcessingInstruction(): void {
    this.consume();
    this.consume();
    this.scanUntilSequence(`Unclosed processing instruction at ${this.pos()}`, CHAR_QM, CHAR_GT);
  }

  private handleComment(): void {
    this.consume();
    this.consume();
    this.consume();
    this.scanUntilSequence(`Unclosed comment at ${this.pos()}`, CHAR_DASH, CHAR_DASH, CHAR_GT);
  }

  private handleCdata(): { "[CDATA]": string } {
    const cdataStart = this.i + 9;
    let cdataEnd = cdataStart;
    while (cdataEnd < this.len) {
      if (
        this.xml.charCodeAt(cdataEnd) === CHAR_BRACKET_R &&
        this.xml.charCodeAt(cdataEnd + 1) === CHAR_BRACKET_R &&
        this.xml.charCodeAt(cdataEnd + 2) === CHAR_GT
      ) {
        break;
      }
      cdataEnd++;
    }
    const text = this.xml.slice(cdataStart, cdataEnd);
    this.i = cdataEnd + 3;
    this.column = this.column + cdataEnd + 3 - cdataStart;
    return { "[CDATA]": text };
  }

  private handleDoctype(): void {
    this.skipDoctype();
  }

  private readClosingTag(): void {
    this.expect(CHAR_LT);
    this.expect(CHAR_SLASH);
    this.readName();
    this.skipWhitespaceAndMisc();
    this.expect(CHAR_GT);
  }

  private flushTextContent(textParts: string[]): string | null {
    if (textParts.length === 0) {
      return null;
    }
    const trimmed = textParts.join("").trim();
    textParts.length = 0;
    return trimmed || null;
  }

  private parseElement(parentNamespaces: Map<string, string>): { name: string; value: unknown } {
    this.expect(CHAR_LT);

    const rawName = this.readName();
    const namespaces = new Map(parentNamespaces);
    const { attrs, selfClosing } = this.parseAttributes(namespaces);

    if (selfClosing) {
      return { name: this.stripPrefix(rawName, namespaces), value: attrs };
    }

    const name = this.stripPrefix(rawName, namespaces);
    const children: (string | Record<string, unknown>)[] = [];
    let hasElement = false;
    let hasText = false;
    const textParts: string[] = [];

    while (this.i < this.len) {
      const tagType = this.detectTagType();

      if (tagType === TagType.EndTag) {
        break;
      }

      if (tagType === TagType.Text) {
        textParts.push(this.xml[this.i]);
        this.consume();
        continue;
      }

      const text = this.flushTextContent(textParts);
      if (text) {
        children.push(text);
        hasText = true;
      }

      switch (tagType) {
        case TagType.ProcessingInstruction:
          this.handleProcessingInstruction();
          break;
        case TagType.Comment:
          this.handleComment();
          break;
        case TagType.Cdata:
          children.push(this.handleCdata());
          hasElement = true;
          break;
        case TagType.Doctype:
          this.handleDoctype();
          break;
        case TagType.ChildElement: {
          const child = this.parseElement(namespaces);
          children.push({ [child.name]: child.value });
          hasElement = true;
          break;
        }
      }
    }

    this.readClosingTag();

    const text = this.flushTextContent(textParts);
    if (text) {
      children.push(text);
      hasText = true;
    }

    return this.buildElementResult(name, attrs, children, hasElement, hasText);
  }

  private buildElementResult(
    name: string,
    attrs: Record<string, unknown>,
    children: (string | Record<string, unknown>)[],
    hasElement: boolean,
    hasText: boolean,
  ): { name: string; value: unknown } {
    const hasChildren = children.length > 0;
    if (!hasChildren) {
      return { name, value: attrs };
    }

    if (hasElement && hasText) {
      attrs["#children"] = children;
      return { name, value: attrs };
    }

    if (!hasElement) {
      return this.buildTextOnlyResult(name, attrs, children);
    }

    return this.buildElementChildrenResult(name, attrs, children);
  }

  private buildTextOnlyResult(
    name: string,
    attrs: Record<string, unknown>,
    children: (string | Record<string, unknown>)[],
  ): { name: string; value: unknown } {
    const textContent = children.join("");
    if (children.length === 1 && Object.keys(attrs).length === 0) {
      return { name, value: children[0] };
    }
    if (Object.keys(attrs).length === 0) {
      return { name, value: textContent };
    }
    attrs["#text"] = textContent;
    return { name, value: attrs };
  }

  private buildElementChildrenResult(
    name: string,
    attrs: Record<string, unknown>,
    children: (string | Record<string, unknown>)[],
  ): { name: string; value: unknown } {
    const elementChildren = children.filter(
      (c): c is Record<string, unknown> => typeof c === "object" && c !== null,
    );

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

  private isNameChar(ch: number): boolean {
    return (
      (ch >= 65 && ch <= 90) ||
      (ch >= 97 && ch <= 122) ||
      (ch >= 48 && ch <= 57) ||
      ch === CHAR_COLON ||
      ch === 95 ||
      ch === 45
    );
  }

  private readName(): string {
    const start = this.i;
    while (this.i < this.len && this.isNameChar(this.peek())) {
      this.consume();
    }
    return this.xml.slice(start, this.i);
  }

  private readQuoted(quote: number): string {
    const start = this.i;
    while (this.i < this.len && this.peek() !== quote) {
      this.consume();
    }
    const val = this.xml.slice(start, this.i);
    this.consume();
    return val;
  }

  private stripPrefix(name: string, namespaces: Map<string, string>): string {
    const colonIndex = name.indexOf(":");
    if (colonIndex === -1) return name;
    const prefix = name.slice(0, colonIndex);
    return namespaces.has(prefix) ? name.slice(colonIndex + 1) : name;
  }
}
