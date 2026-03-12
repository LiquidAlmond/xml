import { describe, expect, test } from "vitest";
import { XML } from "../src/index";

describe("XML round-trip", () => {
  test("parse → stringify → parse produces equivalent output", () => {
    const original = '<foo id="1"><bar/>text</foo>';
    const parsed = XML.parse(original);
    const stringified = XML.stringify(parsed);
    const reparsed = XML.parse(stringified);
    expect(reparsed).toStrictEqual(parsed);
  });
});
