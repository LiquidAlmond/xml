import { describe, expect, test } from "vitest";
import { XML, type XMLNode } from "../src/index";

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

  test("should skip comments", () => {
    const input = "<foo><!--comment-->bar</foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({ foo: "bar" } as XMLNode);
  });

  test("should skip comments at end of mixed content", () => {
    const input = "<foo>bar<!--comment--></foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({ foo: "bar" } as XMLNode);
  });

  test("should skip comments in middle of mixed content", () => {
    const input = "<foo>bar<!--comment-->fizz</foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({ foo: { "#children": ["bar", "fizz"] } } as XMLNode);
  });

  test("should skip multiple comments", () => {
    const input = "<foo><!--comment1--><!--comment2--><bar/></foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({ foo: { bar: {} } } as XMLNode);
  });

  test("should throw on unclosed comment", () => {
    const input = "<foo><!--unclosed";
    expect(() => XML.parse(input)).toThrow("Unclosed comment");
  });

  test("should include position in error message", () => {
    const input = "<foo bar=baz></foo>";
    expect(() => XML.parse(input)).toThrow(/line \d+, column \d+/);
  });

  test("should skip processing instructions", () => {
    const input = '<?xml-stylesheet type="text/xsl" href="style.xsl"?><foo>bar</foo>';
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({ foo: "bar" } as XMLNode);
  });

  test("should skip processing instructions in children", () => {
    const input = "<foo><?target content?><bar/></foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({ foo: { bar: {} } } as XMLNode);
  });

  test("should throw on unclosed processing instruction", () => {
    const input = "<foo><?unclosed";
    expect(() => XML.parse(input)).toThrow("Unclosed processing instruction");
  });

  test("should skip DOCTYPE", () => {
    const input = "<!DOCTYPE foo><foo>bar</foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({ foo: "bar" } as XMLNode);
  });

  test("should skip DOCTYPE with public identifier", () => {
    const input = '<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"><foo>bar</foo>';
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({ foo: "bar" } as XMLNode);
  });

  test("should skip DOCTYPE in children", () => {
    const input = "<foo><!DOCTYPE bar><bar/></foo>";
    const parsed = XML.parse(input);
    expect(parsed).toStrictEqual({ foo: { bar: {} } } as XMLNode);
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
