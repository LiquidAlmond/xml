import type { XMLNode, XMLChild } from "./types";

export function walk(
  holder: Record<string, unknown>,
  key: string,
  reviver: (this: any, key: string, value: any) => any,
): unknown {
  const value = holder[key];

  if (value && typeof value === "object") {
    for (const k of Object.keys(value)) {
      const v = walk(value as Record<string, unknown>, k, reviver);
      if (v === undefined) delete (value as Record<string, unknown>)[k];
      else (value as Record<string, unknown>)[k] = v;
    }
  }

  const result = reviver.call(holder as XMLNode, key, value as XMLChild);
  if (result === undefined && key !== "") {
    delete holder[key];
    return undefined;
  }
  return result;
}

export function applyReplacerFunction(
  value: unknown,
  replacer: (this: any, key: string, value: any) => any,
): unknown {
  function walk(holder: Record<string, unknown>, key: string): unknown {
    const val = holder[key];

    if (val && typeof val === "object") {
      for (const k of Object.keys(val)) {
        const v = walk(val as Record<string, unknown>, k);
        if (v === undefined) delete (val as Record<string, unknown>)[k];
        else (val as Record<string, unknown>)[k] = v;
      }
    }

    return replacer.call(holder, key, val);
  }

  return walk({ "": value } as Record<string, unknown>, "");
}

export function applyReplacerArray(value: unknown, whitelist: (string | number)[]): unknown {
  function filter(obj: unknown, isRoot = false): unknown {
    if (!obj || typeof obj !== "object") return obj;

    const result: Record<string, unknown> = {};
    for (const key of Object.keys(obj as object)) {
      if (whitelist.includes(key) || isRoot) {
        result[key] = filter((obj as Record<string, unknown>)[key], false);
      }
    }
    return result;
  }

  return filter(value, true);
}
