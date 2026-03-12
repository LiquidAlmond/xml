export type XMLPrimitive = string | number | boolean | null;

export type XMLAttr = {
	[K in string as K extends `@${string}` ? K : never]: string;
};

export type XMLNamespace = {
	[K in string as K extends `$${string}` ? K : never]: string;
};

export type XMLText = {
	"#text": string;
};

export type XMLChildren = {
	"#children": XMLChild[];
};

export type XMLCData = {
	"[CDATA]": string;
};

export type XMLChild =
	| XMLPrimitive
	| XMLText
	| XMLCData
	| {
			[K: string]: XMLNode | XMLNode[] | XMLPrimitive | XMLPrimitive[] | XMLChild[] | undefined;
	  };

export type XMLNode = {
	[K: string]: XMLChild | XMLNode | XMLNode[] | XMLPrimitive | XMLPrimitive[] | XMLChild[] | undefined;
};

export type XMLReviver = (this: XMLNode, key: string, value: XMLChild) => any;

export type XMLReplacer = ((this: XMLNode, key: string, value: XMLChild) => any) | (string | number)[];

export interface XMLStatic {
	parse(text: string, reviver?: XMLReviver): XMLNode;
	stringify(value: XMLNode, replacer?: XMLReplacer | null, space?: string | number): string;
}

export declare const XML: XMLStatic;
export default XML;
