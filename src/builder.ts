import type { XMLNode, XMLChild } from "./types";

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};

export function buildElement(name: string, value: unknown): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return `<${name}>${escapeChar(value)}</${name}>`;
  }

  if (value == null) return `<${name}/>`;

  const attrParts: string[] = [];
  const childParts: string[] = [];

  for (const key of Object.keys(value as object)) {
    const v = (value as Record<string, unknown>)[key];

    if (key.startsWith("@")) {
      attrParts.push(` ${key.slice(1)}="${escapeChar(v)}"`);
      continue;
    }

    if (key.startsWith("$")) {
      attrParts.push(` xmlns:${key.slice(1)}="${escapeChar(v)}"`);
      continue;
    }

    if (key === "#children") {
      for (const child of v as XMLChild[]) {
        if (typeof child === "string") {
          childParts.push(escapeChar(child));
        } else if (child && typeof child === "object" && "[CDATA]" in child) {
          childParts.push(`<![CDATA[${(child as { "[CDATA]": string })["[CDATA]"]}]]>`);
        } else if (child && typeof child === "object") {
          const n = Object.keys(child)[0];
          childParts.push(buildElement(n, (child as Record<string, unknown>)[n]));
        }
      }
      continue;
    }

    if (key === "#text") {
      childParts.push(escapeChar(v));
      continue;
    }

    if (Array.isArray(v)) {
      for (const item of v) {
        childParts.push(buildElement(key, item));
      }
      continue;
    }

    childParts.push(buildElement(key, v));
  }

  const attrs = attrParts.join("");
  const children = childParts.join("");

  if (!children) return `<${name}${attrs}/>`;
  return `<${name}${attrs}>${children}</${name}>`;
}

function escapeChar(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => ESCAPE_MAP[c] || c);
}
