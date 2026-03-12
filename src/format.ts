export function format(xml: string, space: string | number): string {
  const indent = typeof space === "number" ? " ".repeat(space) : space;
  const lines = xml.replace(/>\s*</g, ">\n<").split("\n");

  let level = 0;
  return lines
    .map((line) => {
      if (line.startsWith("</")) level--;
      const out = indent.repeat(level) + line;
      if (!line.startsWith("</") && !line.startsWith("<!") && line.match(/^<[^!][^/>]*>$/)) level++;
      return out;
    })
    .join("\n");
}
