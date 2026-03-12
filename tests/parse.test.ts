import { describe, test, expect } from "vitest";
import { XML, XMLNode } from "../src/index";

describe("XML.parse", () => {
  test("should handle text node", () => {
    const input = "<foo>bar</foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({
      foo: "bar",
    } as XMLNode);
  });

  test("should handle simple child nodes", () => {
    const input = "<foo><bar/></foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({
      foo: { bar: {} },
    } as XMLNode);
  });

  test("should handle attributes", () => {
    const input = '<foo id="1">bar</foo>';
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({
      foo: {
        "@id": "1",
        "#text": "bar",
      },
    } as XMLNode);
  });

  test("should handle self closing tags", () => {
    const input = '<foo id="1"/>';
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({
      foo: {
        "@id": "1",
      },
    } as XMLNode);
  });

  test("should handle multiple children", () => {
    const input = "<foo><bar/>text</foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({
      foo: {
        "#children": [{ bar: {} }, "text"],
      },
    } as XMLNode);
  });

  test("should handle multiple children with same name", () => {
    const input = "<foo><bar/><bar/></foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({
      foo: {
        "#children": [{ bar: {} }, { bar: {} }],
      },
    } as XMLNode);
  });

  test("should handle cdata", () => {
    const input = "<foo><![CDATA[raw text]]></foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({ foo: { "[CDATA]": "raw text" } } as XMLNode);
  });

  test("should handle nested elements", () => {
    const input = "<foo><bar><baz/></bar></foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({
      foo: { bar: { baz: {} } },
    } as XMLNode);
  });

  test("should handle empty element", () => {
    const input = "<foo></foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({ foo: {} } as XMLNode);
  });

  test("should handle multiple attributes", () => {
    const input = '<foo id="1" class="bar">text</foo>';
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({
      foo: {
        "@id": "1",
        "@class": "bar",
        "#text": "text",
      },
    } as XMLNode);
  });

  test("should handle whitespace-only text", () => {
    const input = "<foo>  bar  </foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({ foo: "bar" } as XMLNode);
  });

  test("should skip XML declaration", () => {
    const input = '<?xml version="1.0"?><foo>bar</foo>';
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({ foo: "bar" } as XMLNode);
  });

  test("should use reviver function", () => {
    const input = "<foo>123</foo>";
    const parsed = XML.parse(input, (k, v) => {
      if (k === "foo" && typeof v === "string") return Number(v);
      return v;
    });
    expect(parsed).toStrictEqual({ foo: 123 } as XMLNode);
  });
});
