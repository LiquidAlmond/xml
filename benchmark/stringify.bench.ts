import { bench } from "vitest";
import { XML, type XMLNode } from "../src/index";

const small = { foo: "bar" } as XMLNode;
const medium = {
  root: {
    item: [
      { "@id": "1", "#text": "Test" },
      { "@id": "2", "#text": "Test2" },
    ],
  },
} as XMLNode;
const large = { root: { items: Array(100).fill({ item: "test" }) } } as XMLNode;

bench("XML.stringify - small", () => {
  XML.stringify(small);
});

bench("XML.stringify - medium", () => {
  XML.stringify(medium);
});

bench("XML.stringify - large (100 items)", () => {
  XML.stringify(large);
});
