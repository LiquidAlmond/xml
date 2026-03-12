import { buildElement } from "./builder";
import { format } from "./format";
import { Parser } from "./parser";
import type { XMLNode, XMLReplacer, XMLReviver, XMLStatic } from "./types";
import { applyReplacerArray, applyReplacerFunction, walk } from "./utils";

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
  XMLAttr,
  XMLCData,
  XMLChild,
  XMLChildren,
  XMLNamespace,
  XMLNode,
  XMLPrimitive,
  XMLReplacer,
  XMLReviver,
  XMLStatic,
  XMLText,
} from "./types";
export { XML as default };
