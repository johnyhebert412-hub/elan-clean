import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const kind = process.argv[2] || "patch";
const summary = process.argv.slice(3).join(" ").trim();
const allowedKinds = new Set(["patch", "minor", "major"]);

if (!allowedKinds.has(kind) || !summary) {
  console.error("Usage: npm run release:patch -- \"Résumé de la modification\"");
  process.exit(1);
}

const versionPath = path.join(root, "version.json");
const swPath = path.join(root, "sw.js");
const changelogPath = path.join(root, "CHANGELOG.md");
const release = JSON.parse(await readFile(versionPath, "utf8"));
const numbers = release.version.replace(/^v/, "").split(".").map(Number);

if (kind === "major") {
  numbers[0] += 1;
  numbers[1] = 0;
  numbers[2] = 0;
} else if (kind === "minor") {
  numbers[1] += 1;
  numbers[2] = 0;
} else {
  numbers[2] += 1;
}

const version = `v${numbers.join(".")}`;
const updated = new Date().toISOString().slice(0, 10);
const historyEntry = { version, date: updated, changes: [summary] };
const nextRelease = {
  version,
  updated,
  changes: [summary],
  history: [historyEntry, ...(release.history || [])]
};

await writeFile(versionPath, `${JSON.stringify(nextRelease, null, 2)}\n`, "utf8");

const changelog = [
  "# Historique Elan",
  "",
  ...nextRelease.history.flatMap(entry => [
    `## ${entry.version} - ${entry.date}`,
    "",
    ...entry.changes.map(change => `- ${change}`),
    ""
  ])
].join("\n");
await writeFile(changelogPath, `${changelog}\n`, "utf8");

const serviceWorker = await readFile(swPath, "utf8");
const updatedWorker = serviceWorker.replace(
  /const CACHE = "elan-pilote-[^"]+";/,
  `const CACHE = "elan-pilote-${version}";`
);
await writeFile(swPath, updatedWorker, "utf8");

console.log(`Elan ${version} - ${updated}`);
