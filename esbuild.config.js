import { execSync } from "node:child_process";
import * as esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

const commonOptions = {
  bundle: true,
  sourcemap: true,
  minify: !isWatch,
  target: ["es2020"],
};

async function build() {
  const ctx = await esbuild.context({
    ...commonOptions,
    entryPoints: ["src/index.ts"],
    outdir: "dist",
    format: "esm",
    entryNames: "xml.esm",
  });

  if (isWatch) {
    await ctx.watch();
    console.log("Watching for changes...");
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

async function buildCjs() {
  const ctx = await esbuild.context({
    ...commonOptions,
    entryPoints: ["src/index.ts"],
    outdir: "dist",
    format: "cjs",
    entryNames: "xml.cjs",
    platform: "node",
  });

  if (isWatch) {
    await ctx.watch();
    console.log("Watching for changes...");
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

async function buildIife() {
  const ctx = await esbuild.context({
    ...commonOptions,
    entryPoints: ["src/index.ts"],
    outdir: "dist",
    format: "iife",
    entryNames: "xml",
    globalName: "XML",
  });

  if (isWatch) {
    await ctx.watch();
    console.log("Watching for changes...");
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

async function main() {
  await build();
  await buildCjs();
  await buildIife();
  if (!isWatch) {
    execSync("tsc --emitDeclarationOnly", { stdio: "inherit" });
  }
  console.log("Build complete!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
