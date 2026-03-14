import { readFileSync } from "node:fs";
import { bench } from "vitest";
import { XML } from "../src/index";

const attributeHeavy = readFileSync(
  new URL("./data/01-attribute-heavy.xml", import.meta.url),
  "utf8",
);
const deeplyNested = readFileSync(new URL("./data/02-deeply-nested.xml", import.meta.url), "utf8");
const wide = readFileSync(new URL("./data/03-wide.xml", import.meta.url), "utf8");
const textHeavy = readFileSync(new URL("./data/04-text-heavy.xml", import.meta.url), "utf8");
const mixedContent = readFileSync(new URL("./data/05-mixed-content.xml", import.meta.url), "utf8");
const cdataHeavy = readFileSync(new URL("./data/06-cdata-heavy.xml", import.meta.url), "utf8");

bench("attribute-heavy", () => {
  XML.parse(attributeHeavy);
});

bench("deeply-nested", () => {
  XML.parse(deeplyNested);
});

bench("wide", () => {
  XML.parse(wide);
});

bench("text-heavy", () => {
  XML.parse(textHeavy);
});

bench("mixed-content", () => {
  XML.parse(mixedContent);
});

bench("cdata-heavy", () => {
  XML.parse(cdataHeavy);
});
