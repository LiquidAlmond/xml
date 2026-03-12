const XML = {
	parse(xml, reviver) {
		const parser = new Parser(xml);
		const result = parser.parse();

		if (typeof reviver === "function") {
			return walk({ "": result }, "", reviver);
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

const NAME_REGEX = /[A-Za-z0-9:_-]/;
const WS_REGEX = /\s/;
const ESCAPE_MAP = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
};

class Parser {
	constructor(xml) {
		this.xml = xml;
		this.i = 0;
		this.len = xml.length;
	}

	parse() {
		this.skipDeclaration();
		const node = this.parseElement();
		return { [node.name]: node.value };
	}

	skipDeclaration() {
		if (this.xml.charCodeAt(this.i) === 60 && this.xml.charCodeAt(this.i + 1) === 63) {
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

		const children = [];

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
			return { name, value: singleChild };
		} else if (singleChild && typeof singleChild === "string") {
			attrs["#text"] = singleChild;
			return { name, value: attrs };
		} else if (hasChildren) {
			attrs["#children"] = children;
			return { name, value: attrs };
		}

		return { name, value: attrs };
	}

	readName() {
		const start = this.i;
		while (this.i < this.len && NAME_REGEX.test(this.xml[this.i])) this.i++;
		return this.xml.slice(start, this.i);
	}

	readQuoted() {
		const q = this.xml.charCodeAt(this.i++);
		const start = this.i;
		while (this.i < this.len && this.xml.charCodeAt(this.i) !== q) this.i++;
		const val = this.xml.slice(start, this.i);
		this.i++;
		return val;
	}

	readText() {
		const start = this.i;
		while (this.i < this.len && this.xml.charCodeAt(this.i) !== 60) this.i++;
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
		while (this.i < this.len && WS_REGEX.test(this.xml[this.i])) this.i++;
	}
}

function buildElement(name, value) {
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return `<${name}>${escapeChar(value)}</${name}>`;
	}

	if (value == null) return `<${name}/>`;

	const attrParts = [];
	const childParts = [];

	for (const key of Object.keys(value)) {
		const v = value[key];

		if (key.startsWith("@")) {
			attrParts.push(` ${key.slice(1)}="${escapeChar(v)}"`);
			continue;
		}

		if (key.startsWith("$")) {
			attrParts.push(` xmlns:${key.slice(1)}="${escapeChar(v)}"`);
			continue;
		}

		if (key === "#children") {
			for (const child of v) {
				if (typeof child === "string") {
					childParts.push(escapeChar(child));
				} else if (child["[CDATA]"] !== undefined) {
					childParts.push(`<![CDATA[${child["[CDATA]"]}]]>`);
				} else {
					const n = Object.keys(child)[0];
					childParts.push(buildElement(n, child[n]));
				}
			}
			continue;
		}

		if (key === "#text") {
			childParts.push(escapeChar(v));
			continue;
		}

		if (Array.isArray(v)) {
			for (const item of v) {
				childParts.push(buildElement(key, item));
			}
			continue;
		}

		childParts.push(buildElement(key, v));
	}

	const attrs = attrParts.join("");
	const children = childParts.join("");

	if (!children) return `<${name}${attrs}/>`;
	return `<${name}${attrs}>${children}</${name}>`;
}

function escapeChar(s) {
	return String(s).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c] || c);
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

  const result = reviver.call(holder, key, value);
  if (result === undefined && key !== "") {
    delete holder[key];
    return undefined;
  }
  return result;
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
  function filter(obj, isRoot = false) {
    if (!obj || typeof obj !== "object") return obj;

    const result = {};
    for (const key of Object.keys(obj)) {
      if (whitelist.includes(key) || isRoot) {
        result[key] = filter(obj[key], false);
      }
    }
    return result;
  }

  return filter(value, true);
}

function format(xml, space) {
  const indent = typeof space === "number" ? " ".repeat(space) : space;
  const lines = xml.replace(/>\s*</g, ">\n<").split("\n");

  let level = 0;
  return lines
    .map((line) => {
      if (line.startsWith("</")) level--;
      const out = indent.repeat(level) + line;
      if (!line.startsWith("</") && !line.startsWith("<!") && line.match(/^<[^!][^/>]*>$/)) level++;
      return out;
    })
    .join("\n");
}

export { XML };
