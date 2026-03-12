const XML = {
  parse(xml, reviver) {
    const parser = new Parser(xml);
    const result = parser.parse();

    if (typeof reviver === "function") {
      return walk({ "": result }, "", reviver)[""];
    }

    return result;
  },

  stringify(value, replacer, space) {
    if (typeof replacer === "function") {
      value = applyReplacerFunction(value, replacer);
    } else if (Array.isArray(replacer)) {
      value = applyReplacerArray(value, replacer);
    }

    const rootName = Object.keys(value)[0];
    let xml = buildElement(rootName, value[rootName]);

    if (space) xml = format(xml, space);

    return xml;
  },
};

class Parser {
  constructor(xml) {
    this.xml = xml;
    this.i = 0;
  }

  parse() {
    this.skipDeclaration();
    const node = this.parseElement();
    return { [node.name]: node.value };
  }

  skipDeclaration() {
    if (this.xml.startsWith("<?")) {
      const end = this.xml.indexOf("?>", this.i);
      this.i = end + 2;
    }
  }

  parseElement() {
    this.expect("<");
    const name = this.readName();

    const attrs = {};
    while (true) {
      this.skipWhitespace();
      if (this.peek() === "/" || this.peek() === ">") break;
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

    const children = [];
    const elements = {};

    while (!this.startsWith("</")) {
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
        const val = child.value;

        if (!elements[child.name]) elements[child.name] = [];
        elements[child.name].push(val);

        children.push({ [child.name]: val });
        continue;
      }

      const text = this.readText();
      if (text.trim()) children.push(text);
    }

    this.expect("</");
    this.readName();
    this.expect(">");

    const obj = { ...attrs };

    if (children.length === 1 && typeof children[0] === "string" && Object.keys(obj).length === 0) {
      return { name, value: children[0] };
    }

    if (children.length > 1) {
      obj["#children"] = children;
    } else if (children.length === 1 && children[0]["[CDATA]"]) {
      Object.assign(obj, children[0]);
    } else if (children.length === 1) {
      obj["#text"] = children[0];
    }

    return { name, value: obj };
  }

  readName() {
    const start = this.i;
    while (/[A-Za-z0-9:_-]/.test(this.peek())) this.i++;
    return this.xml.slice(start, this.i);
  }

  readQuoted() {
    const q = this.peek();
    this.i++;
    const start = this.i;
    while (this.peek() !== q) this.i++;
    const val = this.xml.slice(start, this.i);
    this.i++;
    return val;
  }

  readText() {
    const start = this.i;
    while (this.peek() !== "<") this.i++;
    return this.xml.slice(start, this.i);
  }

  expect(s) {
    if (!this.startsWith(s)) throw new Error("Invalid XML");
    this.i += s.length;
  }

  peek() {
    return this.xml[this.i];
  }

  startsWith(s) {
    return this.xml.startsWith(s, this.i);
  }

  skipWhitespace() {
    while (/\s/.test(this.peek())) this.i++;
  }
}

function buildElement(name, value) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return `<${name}>${escapeChar(value)}</${name}>`;
  }

  if (value == null) return `<${name}/>`;

  let attrs = "";
  let children = "";

  for (const key of Object.keys(value)) {
    const v = value[key];

    if (key.startsWith("@")) {
      attrs += ` ${key.slice(1)}="${escapeChar(v)}"`;
      continue;
    }

    if (key.startsWith("$")) {
      attrs += ` xmlns:${key.slice(1)}="${escapeChar(v)}"`;
      continue;
    }

    if (key === "#children") {
      for (const child of v) {
        if (typeof child === "string") {
          children += escapeChar(child);
        } else if (child["[CDATA]"] !== undefined) {
          children += `<![CDATA[${child["[CDATA]"]}]]>`;
        } else {
          const n = Object.keys(child)[0];
          children += buildElement(n, child[n]);
        }
      }
      continue;
    }

    if (Array.isArray(v)) {
      for (const item of v) {
        children += buildElement(key, item);
      }
      continue;
    }

    children += buildElement(key, v);
  }

  if (!children) return `<${name}${attrs}/>`;
  return `<${name}${attrs}>${children}</${name}>`;
}

function escapeChar(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function walk(holder, key, reviver) {
  const value = holder[key];

  if (value && typeof value === "object") {
    for (const k of Object.keys(value)) {
      const v = walk(value, k, reviver);
      if (v === undefined) delete value[k];
      else value[k] = v;
    }
  }

  return reviver.call(holder, key, value);
}

function applyReplacerFunction(value, replacer) {
  function walk(holder, key) {
    const val = holder[key];

    if (val && typeof val === "object") {
      for (const k of Object.keys(val)) {
        const v = walk(val, k);
        if (v === undefined) delete val[k];
        else val[k] = v;
      }
    }

    return replacer.call(holder, key, val);
  }

  return walk({ "": value }, "");
}

function applyReplacerArray(value, whitelist) {
  function filter(obj) {
    if (!obj || typeof obj !== "object") return obj;

    const result = {};
    for (const key of Object.keys(obj)) {
      if (whitelist.includes(key)) {
        result[key] = filter(obj[key]);
      }
    }
    return result;
  }

  return filter(value);
}

function format(xml, space) {
  const indent = typeof space === "number" ? " ".repeat(space) : space;
  const lines = xml.replace(/>\s*</g, ">\n<").split("\n");

  let level = 0;
  return lines
    .map((line) => {
      if (line.startsWith("</")) level--;
      const out = indent.repeat(level) + line;
      if (line.match(/^<[^!?/].*[^/]>$/)) level++;
      return out;
    })
    .join("\n");
}

export { XML };
