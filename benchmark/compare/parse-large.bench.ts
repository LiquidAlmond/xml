import { readFileSync } from "node:fs";
import { DOMParser } from "@xmldom/xmldom";
import { XMLParser } from "fast-xml-parser";
import { bench } from "vitest";
import { XML } from "../../src/index";

const fxpOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  textNodeName: "#text",
};

const parser = new XMLParser(fxpOptions);
const domParser = new DOMParser();

const input = readFileSync("./.fixtures/large.xml", "utf8");

bench.skip("@liquid/xml parse - large", () => {
  XML.parse(input);
});

bench.skip("fast-xml-parser parse - large", () => {
  parser.parse(input);
});

bench.skip("@xmldom/xmldom parse - large", () => {
  domParser.parseFromString(input, "text/xml");
});
