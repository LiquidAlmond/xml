# @liquiddev/xml

[![npm version](https://img.shields.io/npm/v/@liquiddev/xml)](https://www.npmjs.com/package/@liquiddev/xml)
[![npm bundle size](https://img.shields.io/bundlejs/size/@liquiddev/xml)](https://bundlejs.com/?q=@liquiddev/xml)

XML parser and stringifier with a JSON-compatible API.

## Features

- **Familiar API** - Same `parse`/`stringify` interface as JSON
- **Typed** - Full TypeScript support included
- **Namespace support** - Handle XML namespaces with ease
- **CDATA support** - Preserve raw CDATA sections
- **Formatting** - Pretty-print with custom indentation
- **Reviver/Replacer** - Transform data during parsing and stringifying

## Quick Start

```typescript
import XML from "@liquiddev/xml";

// Parse XML to object
const obj = XML.parse("<foo>bar</foo>");
// { foo: "bar" }

// Stringify object to XML
const xml = XML.stringify({ foo: "bar" });
// "<foo>bar</foo>"
```

## JSON to XML

If you know JSON, you know this library:

| JSON | XML |
|------|-----|
| `JSON.parse(text)` | `XML.parse(text)` |
| `JSON.stringify(value)` | `XML.stringify(value)` |
| `{ "key": "value" }` | `<key>value</key>` |
| `null` | `<key/>` (self-closing) |
| `{ "@attr": "x" }` | `<key attr="x"/>` |
| `{ "@id": "1", "#text": "x" }` | `<key id="1">x</key>` |

## Installation

```bash
npm install @liquiddev/xml
```

## API

The API mirrors JavaScript's built-in `JSON` object:

```typescript
import XML from "@liquiddev/xml";
```

### `XML.parse(text, reviver?)`

Parses an XML string into a JavaScript object.

```typescript
const obj = XML.parse("<foo>bar</foo>");
// { foo: "bar" }
```

### `XML.stringify(value, replacer?, space?)`

Converts a JavaScript object to an XML string.

```typescript
const xml = XML.stringify({ foo: "bar" });
// "<foo>bar</foo>"
```

## Data Structure

### Elements

Element names become object keys:

```typescript
XML.parse("<foo><bar>baz</bar></foo>");
// { foo: { bar: "baz" } }
```

### Attributes

Attributes use the `@` prefix:

```typescript
XML.parse('<foo id="1"></foo>');
// { foo: { "@id": "1" } }

XML.stringify({ foo: { "@id": "1" } });
// '<foo id="1"/>'
```

### Text Content

Text content when attributes present is stored as `#text`:

```typescript
XML.parse('<foo id="1">hello</foo>');
// { foo: { "@id": "1", "#text": "hello" } }
```

### Multiple Children

Multiple children with the same name become arrays:

```typescript
XML.parse("<foo><bar/><bar/></foo>");
// { foo: { bar: [{}, {}] } }
```

Mixed content uses the `#children` array to maintain ordering:

```typescript
XML.parse("<foo><bar/>text</foo>");
// { foo: { "#children": [{ bar: {} }, "text"] } }
```

### CDATA

CDATA sections are represented with `[CDATA]`:

```typescript
XML.parse("<foo><![CDATA[raw text]]></foo>");
// { foo: { "[CDATA]": "raw text" } }
```

### Namespaces

Namespaces use the `$` prefix:

```typescript
XML.parse('<foo xmlns:ns="http://example.com"><ns:bar>text</ns:bar></foo>');
// { foo: { $ns: "http://example.com", "ns:bar": "text" } }

// Default namespace
XML.parse('<foo xmlns="http://example.com"><bar>text</bar></foo>');
// { foo: { $default: "http://example.com", bar: "text" } }
```

### Raw XML

Use `XML.rawXML()` to embed unescaped XML:

```typescript
const obj = {
  foo: XML.rawXML("<bar>raw</bar>"),
};
XML.stringify(obj);
// "<foo><bar>raw</bar></foo>"
```

## Reviver & Replacer

Like `JSON.parse` and `JSON.stringify`, you can pass reviver and replacer functions:

```typescript
// Parse with reviver
const obj = XML.parse("<foo>123</foo>", (key, value) => {
  if (key === "foo" && typeof value === "string") return Number(value);
  return value;
});
// { foo: 123 }

// Stringify with replacer
const xml = XML.stringify({ foo: 123 }, (key, value) => {
  if (typeof value === "number") return String(value);
  return value;
});
// "<foo>123</foo>"

// Replacer array acts as a whitelist for properties to include
const xml = XML.stringify({ foo: { a: 1, b: 2 } }, ["a"]);
// "<foo><a>1</a></foo>"
```

## Formatting

The `space` parameter adds indentation:

```typescript
XML.stringify({ foo: { bar: "text" } }, null, 2);
// <foo>
//   <bar>text</bar>
// </foo>

XML.stringify({ foo: { bar: "text" } }, null, "\t");
// <foo>
// 	<bar>text</bar>
// </foo>
```

## TypeScript

Types are included:

```typescript
import XML, { type XMLNode, type XMLAttr } from "@liquiddev/xml";

const obj: XMLNode = XML.parse("<foo>bar</foo>");
```

## License

MIT
