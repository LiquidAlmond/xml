import type { XMLNode, XMLStatic, XMLReviver, XMLReplacer } from "./types";
import { Parser } from "./parser";
import { buildElement } from "./builder";
import { format } from "./format";
import { walk, applyReplacerFunction, applyReplacerArray } from "./utils";

export const XML: XMLStatic = {
  parse(xml: string, reviver?: XMLReviver): XMLNode {
    const parser = new Parser(xml);
    const result = parser.parse();

    if (typeof reviver === "function") {
      return walk({ "": result }, "", reviver) as XMLNode;
    }

    return result;
  },

  stringify(value: XMLNode, replacer?: XMLReplacer | null, space?: string | number): string {
    if (typeof replacer === "function") {
      value = applyReplacerFunction(value, replacer) as XMLNode;
    } else if (Array.isArray(replacer)) {
      value = applyReplacerArray(value, replacer) as XMLNode;
    }

    const rootName = Object.keys(value)[0];
    let xml = buildElement(rootName, value[rootName]);

    if (space) xml = format(xml, space);

    return xml;
  },
};

export type {
  XMLNode,
  XMLPrimitive,
  XMLChild,
  XMLAttr,
  XMLNamespace,
  XMLText,
  XMLChildren,
  XMLCData,
  XMLReviver,
  XMLReplacer,
  XMLStatic,
} from "./types";
export { XML as default };
