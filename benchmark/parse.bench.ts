import { readFileSync } from "node:fs";
import { bench } from "vitest";
import { XML } from "../src/index";

const small = readFileSync(new URL("../.fixtures/small.xml", import.meta.url), "utf8");
const medium = readFileSync(new URL("../.fixtures/medium.xml", import.meta.url), "utf8");
const large = readFileSync(new URL("../.fixtures/large.xml", import.meta.url), "utf8");
const huge = readFileSync(new URL("../.fixtures/huge.xml", import.meta.url), "utf8");

bench("small", () => {
  XML.parse(small);
});

bench("medium", () => {
  XML.parse(medium);
});

bench.skip("large", () => {
  XML.parse(large);
});

bench.skip("huge", () => {
  XML.parse(huge);
});
