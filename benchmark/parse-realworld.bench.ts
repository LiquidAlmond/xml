import { readFileSync } from "node:fs";
import { bench } from "vitest";
import { XML } from "../src/index";

const rss = readFileSync(new URL("./data/07-rss.xml", import.meta.url), "utf8");
const atom = readFileSync(new URL("./data/07-atom.xml", import.meta.url), "utf8");
const svg = readFileSync(new URL("./data/07-svg.xml", import.meta.url), "utf8");
const soap = readFileSync(new URL("./data/07-soap.xml", import.meta.url), "utf8");

bench("rss", () => {
  XML.parse(rss);
});

bench("atom", () => {
  XML.parse(atom);
});

bench("svg", () => {
  XML.parse(svg);
});

bench("soap", () => {
  XML.parse(soap);
});
