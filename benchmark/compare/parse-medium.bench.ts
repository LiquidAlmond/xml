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

const input = readFileSync("./.fixtures/medium.xml", "utf8");

bench("@liquiddev/xml parse - medium", () => {
  XML.parse(input);
});

bench("fast-xml-parser parse - medium", () => {
  parser.parse(input);
});

bench("@xmldom/xmldom parse - medium", () => {
  domParser.parseFromString(input, "text/xml");
});
