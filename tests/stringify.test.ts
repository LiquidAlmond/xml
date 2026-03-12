import { describe, expect, test } from "vitest";
import { XML } from "../src/index";

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
    const result = XML.stringify({ foo: { "#children": [{ bar: {} }, "text"] } });
    expect(result).toBe("<foo><bar/>text</foo>");
  });

  test("should stringify array as repeated elements", () => {
    const result = XML.stringify({ foo: { bar: [{}, {}] } });
    expect(result).toBe("<foo><bar/><bar/></foo>");
  });

  test("should stringify CDATA in #children", () => {
    const result = XML.stringify({ foo: { "#children": [{ "[CDATA]": "raw text" }] } });
    expect(result).toBe("<foo><![CDATA[raw text]]></foo>");
  });

  test("should stringify namespace with $ prefix", () => {
    const result = XML.stringify({ foo: { $ns: "http://example.com" } });
    expect(result).toBe('<foo xmlns:ns="http://example.com"/>');
  });

  test("should format with number space", () => {
    const result = XML.stringify({ foo: { bar: "text" } }, null, 2);
    expect(result).toBe("<foo>\n  <bar>text</bar>\n</foo>");
  });

  test("should format with string space", () => {
    const result = XML.stringify({ foo: { bar: "text" } }, null, "\t");
    expect(result).toBe("<foo>\n\t<bar>text</bar>\n</foo>");
  });

  test("should use replacer function", () => {
    const result = XML.stringify({ foo: 123 }, (_k, v) => {
      if (typeof v === "number") return String(v);
      return v;
    });
    expect(result).toBe("<foo>123</foo>");
  });

  test("should use replacer array as whitelist", () => {
    const result = XML.stringify({ foo: { "@id": "1", "@class": "bar", baz: "qux" } }, ["@id"]);
    expect(result).toBe('<foo id="1"/>');
  });

  test("should escape special characters", () => {
    const result = XML.stringify({ foo: "<>&\"'" });
    expect(result).toBe("<foo>&lt;&gt;&amp;&quot;'</foo>");
  });
});
