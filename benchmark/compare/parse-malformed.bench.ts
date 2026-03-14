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

describe.skip("malformed-unclosed", () => {
  const unclosed = readFileSync("./benchmark/data/08-malformed-unclosed.xml", "utf8");

  bench("@liquiddev/xml", () => {
    XML.parse(unclosed);
  });

  bench("fast-xml-parser", () => {
    parser.parse(unclosed);
  });

  bench("@xmldom/xmldom", () => {
    domParser.parseFromString(unclosed, "text/xml");
  });
});

describe.skip("malformed-no-declaration", () => {
  const noDeclaration = readFileSync("./benchmark/data/08-malformed-no-declaration.xml", "utf8");
  bench("@liquiddev/xml", () => {
    XML.parse(noDeclaration);
  });

  bench("fast-xml-parser", () => {
    parser.parse(noDeclaration);
  });

  bench("@xmldom/xmldom", () => {
    domParser.parseFromString(noDeclaration, "text/xml");
  });
});

describe.skip("malformed-invalid-char", () => {
  const invalidChar = readFileSync("./benchmark/data/08-malformed-invalid-char.xml", "utf8");

  bench("@liquiddev/xml", () => {
    XML.parse(invalidChar);
  });

  bench("fast-xml-parser", () => {
    parser.parse(invalidChar);
  });

  bench("@xmldom/xmldom", () => {
    domParser.parseFromString(invalidChar, "text/xml");
  });
});

describe.skip("malformed-mismatch", () => {
  const mismatch = readFileSync("./benchmark/data/08-malformed-mismatch.xml", "utf8");

  bench("@liquiddev/xml - malformed-mismatch", () => {
    XML.parse(mismatch);
  });

  bench("fast-xml-parser - malformed-mismatch", () => {
    parser.parse(mismatch);
  });

  bench("@xmldom/xmldom - malformed-mismatch", () => {
    domParser.parseFromString(mismatch, "text/xml");
  });
});
