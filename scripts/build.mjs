import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const files = [
  "index.html",
  "styles.css",
  "app.js",
  "logic.js",
  "version.json",
  "manifest.webmanifest",
  "sw.js",
  "icons"
];

async function verifyEntryPage() {
  const html = await readFile(path.join(root, "index.html"), "utf8");
  const moduleEntry = /<script\s+type="module"\s+src="app\.js"\s*><\/script>/;
  const javascriptInBody = /\b(?:import\s+\{|const\s+state\s*=|function\s+render\()/;

  if (!moduleEntry.test(html)) {
    throw new Error("index.html doit charger app.js avec une balise script type=module.");
  }

  if (javascriptInBody.test(html)) {
    throw new Error("index.html semble contenir du JavaScript brut. Publication annulee.");
  }
}

await verifyEntryPage();
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of files) {
  await cp(path.join(root, file), path.join(dist, file), { recursive: true });
}

console.log("Elan pret pour Vercel dans dist/");
