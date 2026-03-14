import { existsSync, mkdirSync, writeFileSync } from "node:fs";

const fxpRepoUrl = "https://raw.githubusercontent.com/NaturalIntelligence/fast-xml-parser/master";

const files = {
  small: `${fxpRepoUrl}/spec/assets/mini-sample.xml`,
  medium: `${fxpRepoUrl}/spec/assets/sample.xml`,
  large: `${fxpRepoUrl}/spec/assets/midsize.xml`,
  huge: `${fxpRepoUrl}/spec/assets/large.xml`,
};

async function main() {
  mkdirSync("./.fixtures", { recursive: true });

  for (const [size, url] of Object.entries(files)) {
    const filePath = `./.fixtures/${size}.xml`;
    if (existsSync(filePath)) {
      continue;
    }
    await fetch(url)
      .then((res) => res.text())
      .then((xml) => writeFileSync(filePath, xml));
  }
}

main();
