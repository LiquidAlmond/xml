import { describe, expect, test } from "vitest";
import { XML, type XMLNode, type XMLRawXML } from "../src/index";

describe("XML.rawXML", () => {
  test("should create raw XML object with __rawXML property", () => {
    const raw = XML.rawXML("<span>content</span>");
    expect((raw as XMLRawXML).__rawXML).toBe("<span>content</span>");
  });

  test("isRawXML should return true for rawXML result", () => {
    const raw = XML.rawXML("<span>content</span>");
    expect(XML.isRawXML(raw)).toBe(true);
  });

  test("isRawXML should return false for strings", () => {
    expect(XML.isRawXML("string")).toBe(false);
  });

  test("isRawXML should return false for numbers", () => {
    expect(XML.isRawXML(123)).toBe(false);
  });

  test("isRawXML should return false for objects without __rawXML", () => {
    expect(XML.isRawXML({ foo: "bar" })).toBe(false);
  });

  test("isRawXML should return false for null", () => {
    expect(XML.isRawXML(null)).toBe(false);
  });

  test("isRawXML should return false for undefined", () => {
    expect(XML.isRawXML(undefined)).toBe(false);
  });

  test("rawXML should throw on non-string argument", () => {
    expect(() => XML.rawXML(123 as unknown as string)).toThrow(TypeError);
    expect(() => XML.rawXML({} as unknown as string)).toThrow(TypeError);
  });

  test("stringify should include raw XML unescaped", () => {
    const raw = XML.rawXML('<span class="foo">content</span>');
    const result = XML.stringify({ container: raw } as XMLNode);
    expect(result).toBe('<container><span class="foo">content</span></container>');
  });

  test("stringify should include raw XML in #text", () => {
    const raw = XML.rawXML("<raw/>");
    const result = XML.stringify({ container: { "#text": raw } } as XMLNode);
    expect(result).toBe("<container><raw/></container>");
  });

  test("stringify should include raw XML in #children", () => {
    const raw = XML.rawXML("<inner/>");
    const result = XML.stringify({ container: { "#children": [raw] } } as XMLNode);
    expect(result).toBe("<container><inner/></container>");
  });

  test("stringify should include raw XML in arrays", () => {
    const raw = XML.rawXML("<item/>");
    const result = XML.stringify({ container: { items: [raw, raw] } } as XMLNode);
    expect(result).toBe("<container><items><item/></items><items><item/></items></container>");
  });

  test("raw XML should not escape special characters", () => {
    const raw = XML.rawXML("<text>&<>'\"</text>");
    const result = XML.stringify({ container: raw } as XMLNode);
    expect(result).toBe("<container><text>&<>'\"</text></container>");
  });
});
