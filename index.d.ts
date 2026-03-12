export type XMLPrimitive = string | number | boolean | null;

export type XMLChild = XMLPrimitive | { [element: string]: XMLNode } | { "[CDATA]": string };

export interface XMLNode {
  [key: string]: XMLPrimitive | XMLNode | XMLNode[] | XMLPrimitive[] | XMLChild[] | undefined;
}

export type XMLReviver = (this: XMLNode, key: string, value: XMLChild) => XMLNode;

export type XMLReplacer =
  | ((this: XMLNode, key: string, value: XMLChild) => XMLNode)
  | (number | string)[];

export interface XMLStatic {
  parse(text: string, reviver?: XMLReviver): XMLNode;
  stringify(value: XMLNode, replacer?: XMLReplacer | null, space?: string | number): string;
}

export declare const XML: XMLStatic;
export default XML;
