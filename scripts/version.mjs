import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const update = process.argv[2];
if (update !== "patch") {
  throw new Error("Utiliser : npm run release:patch");
}

const packagePath = path.join(root, "package.json");
const packageData = JSON.parse(await readFile(packagePath, "utf8"));
const parts = packageData.version.split(".").map(Number);
parts[2] += 1;
const version = parts.join(".");
const date = new Date().toISOString().slice(0, 10);

packageData.version = version;
await writeFile(packagePath, `${JSON.stringify(packageData, null, 2)}\n`);

const indexPath = path.join(root, "index.html");
let index = await readFile(indexPath, "utf8");
index = index.replace(/Version : v[\d.]+/, `Version : v${version}`);
index = index.replace(/Mise à jour : \d{4}-\d{2}-\d{2}/, `Mise à jour : ${date}`);
await writeFile(indexPath, index);

const swPath = path.join(root, "sw.js");
let sw = await readFile(swPath, "utf8");
sw = sw.replace(/elan-clean-v[\d.]+/, `elan-clean-v${version}`);
await writeFile(swPath, sw);

console.log(`Élan v${version} - ${date}`);
