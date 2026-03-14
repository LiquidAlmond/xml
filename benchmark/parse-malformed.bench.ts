import { readFileSync } from "node:fs";
import { bench } from "vitest";
import { XML } from "../src/index";

const unclosed = readFileSync(new URL("./data/08-malformed-unclosed.xml", import.meta.url), "utf8");
const noDeclaration = readFileSync(
  new URL("./data/08-malformed-no-declaration.xml", import.meta.url),
  "utf8",
);
const invalidChar = readFileSync(
  new URL("./data/08-malformed-invalid-char.xml", import.meta.url),
  "utf8",
);
const mismatch = readFileSync(new URL("./data/08-malformed-mismatch.xml", import.meta.url), "utf8");

bench("malformed-unclosed", () => {
  XML.parse(unclosed);
});

bench("malformed-no-declaration", () => {
  XML.parse(noDeclaration);
});

bench("malformed-invalid-char", () => {
  XML.parse(invalidChar);
});

bench("malformed-mismatch", () => {
  XML.parse(mismatch);
});
