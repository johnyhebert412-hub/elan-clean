import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const files = [
  "index.html",
  "styles.css",
  "app.js",
  "logic.js",
  "manifest.webmanifest",
  "sw.js",
  "icons"
];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of files) {
  await cp(path.join(root, file), path.join(dist, file), { recursive: true });
}

console.log("Elan pret pour Vercel dans dist/");
