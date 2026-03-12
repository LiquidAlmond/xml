import { describe, test, expect } from "vitest";
import { XML } from "../index";

describe("XML.parse", () => {
	test("should handle text node", () => {
		const input = "<foo>bar</foo>";
		const parsed = XML.parse(input);
		expect(parsed).toStrictEqual({
			"foo": "bar"
		});
	});

	test("should handle simple child nodes", () => {
		const input = "<foo><bar/></foo>";
		const parsed = XML.parse(input);
		expect(parsed).toStrictEqual({
			"foo": { "bar": {} }
		});
	});

	test("should handle attributes", () => {
		const input = "<foo id=\"1\">bar</foo>";
		const parsed = XML.parse(input);
		expect(parsed).toStrictEqual({
			"foo": {
				"@id": "1",
				"#text": "bar"
			}
		});
	})

	test("should handle self closing tags", () => {
		const input = "<foo id=\"1\"/>";
		const parsed = XML.parse(input);
		expect(parsed).toStrictEqual({
			"foo": {
				"@id": "1"
			}
		});
	})

	test("should handle multiple children", () => {
		const input = "<foo><bar/>text</foo>";
		const parsed = XML.parse(input);
		expect(parsed).toStrictEqual({
			"foo": {
				"#children": [{ "bar": {} }, "text"]
			}
		});
	})

	test("should handle multiple children with same name", () => {
		const input = "<foo><bar/><bar/></foo>";
		const parsed = XML.parse(input);
		expect(parsed).toStrictEqual({
			"foo": {
				"#children": [{ "bar": {} }, { "bar": {} }]
			}
		});
	})

	test("should handle cdata", () => {
		const input = "<foo><![CDATA[raw text]]></foo>";
		const parsed = XML.parse(input);
		expect(parsed).toStrictEqual({ foo: { "[CDATA]": "raw text" } });
	})

	test("should handle nested elements", () => {
		const input = "<foo><bar><baz/></bar></foo>";
		const parsed = XML.parse(input);
		expect(parsed).toStrictEqual({
			"foo": { "bar": { "baz": {} } }
		});
	});

	test("should handle empty element", () => {
		const input = "<foo></foo>";
		const parsed = XML.parse(input);
		expect(parsed).toStrictEqual({ "foo": {} });
	});

	test("should handle multiple attributes", () => {
		const input = '<foo id="1" class="bar">text</foo>';
		const parsed = XML.parse(input);
		expect(parsed).toStrictEqual({
			"foo": {
				"@id": "1",
				"@class": "bar",
				"#text": "text"
			}
		});
	});

	test("should handle whitespace-only text", () => {
		const input = "<foo>  bar  </foo>";
		const parsed = XML.parse(input);
		expect(parsed).toStrictEqual({ "foo": "bar" });
	});

	test("should skip XML declaration", () => {
		const input = "<?xml version=\"1.0\"?><foo>bar</foo>";
		const parsed = XML.parse(input);
		expect(parsed).toStrictEqual({ "foo": "bar" });
	});

	test("should use reviver function", () => {
		const input = "<foo>123</foo>";
		const parsed = XML.parse(input, (k, v) => {
			if (k === "foo" && typeof v === "string") return Number(v);
			return v;
		});
		expect(parsed).toStrictEqual({ "foo": 123 });
	});
});

describe("XML.stringify", () => {
	test("should stringify string value", () => {
		const result = XML.stringify({ foo: "bar" });
		expect(result).toBe("<foo>bar</foo>");
	});

	test("should stringify number value", () => {
		const result = XML.stringify({ foo: 123 });
		expect(result).toBe("<foo>123</foo>");
	});

	test("should stringify boolean value", () => {
		const result = XML.stringify({ foo: true });
		expect(result).toBe("<foo>true</foo>");
	});

	test("should stringify null as self-closing", () => {
		const result = XML.stringify({ foo: null });
		expect(result).toBe("<foo/>");
	});

	test("should stringify attributes with @ prefix", () => {
		const result = XML.stringify({ foo: { "@id": "1", "#text": "bar" } });
		expect(result).toBe('<foo id="1">bar</foo>');
	});

	test("should stringify #text key", () => {
		const result = XML.stringify({ foo: { "#text": "bar" } });
		expect(result).toBe("<foo>bar</foo>");
	});

	test("should stringify #children array", () => {
		const result = XML.stringify({ foo: { "#children": [{ "bar": {} }, "text"] } });
		expect(result).toBe("<foo><bar/>text</foo>");
	});

	test("should stringify array as repeated elements", () => {
		const result = XML.stringify({ foo: { "bar": [{}, {}] } });
		expect(result).toBe("<foo><bar/><bar/></foo>");
	});

	test("should stringify CDATA in #children", () => {
		const result = XML.stringify({ foo: { "#children": [{ "[CDATA]": "raw text" }] } });
		expect(result).toBe("<foo><![CDATA[raw text]]></foo>");
	});

	test("should stringify namespace with $ prefix", () => {
		const result = XML.stringify({ foo: { "$ns": "http://example.com" } });
		expect(result).toBe('<foo xmlns:ns="http://example.com"/>');
	});

	test("should format with number space", () => {
		const result = XML.stringify({ foo: { "bar": "text" } }, null, 2);
		expect(result).toBe("<foo>\n  <bar>text</bar>\n</foo>");
	});

	test("should format with string space", () => {
		const result = XML.stringify({ foo: { "bar": "text" } }, null, "\t");
		expect(result).toBe("<foo>\n\t<bar>text</bar>\n</foo>");
	});

	test("should use replacer function", () => {
		const result = XML.stringify({ foo: 123 }, (k, v) => {
			if (typeof v === "number") return String(v);
			return v;
		});
		expect(result).toBe("<foo>123</foo>");
	});

	test("should use replacer array as whitelist", () => {
		const result = XML.stringify({ foo: { "@id": "1", "@class": "bar", "baz": "qux" } }, ["@id"]);
		expect(result).toBe('<foo id="1"/>');
	});

	test("should escape special characters", () => {
		const result = XML.stringify({ foo: "<>&\"'" });
		expect(result).toBe("<foo>&lt;&gt;&amp;&quot;'</foo>");
	});
});

describe("XML round-trip", () => {
	test("parse → stringify → parse produces equivalent output", () => {
		const original = '<foo id="1"><bar/>text</foo>';
		const parsed = XML.parse(original);
		const stringified = XML.stringify(parsed);
		const reparsed = XML.parse(stringified);
		expect(reparsed).toStrictEqual(parsed);
	});
});