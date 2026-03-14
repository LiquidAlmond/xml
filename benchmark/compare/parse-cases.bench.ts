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

describe("attribute-heavy", () => {
  const attributeHeavy = readFileSync("./benchmark/data/01-attribute-heavy.xml", "utf8");

  bench("@liquiddev/xml", () => {
    XML.parse(attributeHeavy);
  });

  bench("fast-xml-parser", () => {
    parser.parse(attributeHeavy);
  });

  bench("@xmldom/xmldom", () => {
    domParser.parseFromString(attributeHeavy, "text/xml");
  });
});

describe("deeply-nested", () => {
  const deeplyNested = readFileSync("./benchmark/data/02-deeply-nested.xml", "utf8");

  bench("@liquiddev/xml", () => {
    XML.parse(deeplyNested);
  });

  bench("fast-xml-parser", () => {
    parser.parse(deeplyNested);
  });

  bench("@xmldom/xmldom", () => {
    domParser.parseFromString(deeplyNested, "text/xml");
  });
});

describe("wide", () => {
  const wide = readFileSync("./benchmark/data/03-wide.xml", "utf8");

  bench("@liquiddev/xml", () => {
    XML.parse(wide);
  });

  bench("fast-xml-parser", () => {
    parser.parse(wide);
  });

  bench("@xmldom/xmldom", () => {
    domParser.parseFromString(wide, "text/xml");
  });
});

describe("text-heavy", () => {
  const textHeavy = readFileSync("./benchmark/data/04-text-heavy.xml", "utf8");

  bench("@liquiddev/xml", () => {
    XML.parse(textHeavy);
  });

  bench("fast-xml-parser", () => {
    parser.parse(textHeavy);
  });

  bench("@xmldom/xmldom", () => {
    domParser.parseFromString(textHeavy, "text/xml");
  });
});

describe("mixed-content", () => {
  const mixedContent = readFileSync("./benchmark/data/05-mixed-content.xml", "utf8");

  bench("@liquiddev/xml", () => {
    XML.parse(mixedContent);
  });

  bench("fast-xml-parser", () => {
    parser.parse(mixedContent);
  });

  bench("@xmldom/xmldom", () => {
    domParser.parseFromString(mixedContent, "text/xml");
  });
});

describe("cdata-heavy", () => {
  const cdataHeavy = readFileSync("./benchmark/data/06-cdata-heavy.xml", "utf8");

  bench("@liquiddev/xml", () => {
    XML.parse(cdataHeavy);
  });

  bench("fast-xml-parser", () => {
    parser.parse(cdataHeavy);
  });

  bench("@xmldom/xmldom", () => {
    domParser.parseFromString(cdataHeavy, "text/xml");
  });
});
