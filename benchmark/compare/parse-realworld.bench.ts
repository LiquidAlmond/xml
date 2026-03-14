import { readFileSync } from "node:fs";
import { DOMParser } from "@xmldom/xmldom";
import { XMLParser } from "fast-xml-parser";
import { bench, describe } from "vitest";
import { XML } from "../../src/index";

const fxpOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: "@",
  textNodeName: "#text",
};

const parser = new XMLParser(fxpOptions);
const domParser = new DOMParser();

describe("rss", () => {
  const rss = readFileSync("./benchmark/data/07-rss.xml", "utf8");

  bench("@liquiddev/xml", () => {
    XML.parse(rss);
  });

  bench("fast-xml-parser", () => {
    parser.parse(rss);
  });

  bench("@xmldom/xmldom", () => {
    domParser.parseFromString(rss, "text/xml");
  });
});

describe("atom", () => {
  const atom = readFileSync("./benchmark/data/07-atom.xml", "utf8");

  bench("@liquiddev/xml", () => {
    XML.parse(atom);
  });

  bench("fast-xml-parser", () => {
    parser.parse(atom);
  });

  bench.skip("@xmldom/xmldom", () => {
    domParser.parseFromString(atom, "text/xml");
  });
});

describe("svg", () => {
  const svg = readFileSync("./benchmark/data/07-svg.xml", "utf8");

  bench("@liquiddev/xml", () => {
    XML.parse(svg);
  });

  bench("fast-xml-parser", () => {
    parser.parse(svg);
  });

  bench("@xmldom/xmldom", () => {
    domParser.parseFromString(svg, "text/xml");
  });
});

describe("soap", () => {
  const soap = readFileSync("./benchmark/data/07-soap.xml", "utf8");

  bench("@liquiddev/xml", () => {
    XML.parse(soap);
  });

  bench("fast-xml-parser", () => {
    parser.parse(soap);
  });

  bench("@xmldom/xmldom", () => {
    domParser.parseFromString(soap, "text/xml");
  });
});
