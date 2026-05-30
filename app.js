import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const update = process.argv[2] || "patch";
const summary = process.argv.slice(3).join(" ").trim() || "Mise à jour de l'application.";
if (!["patch", "minor", "major"].includes(update)) {
  throw new Error("Utiliser : patch, minor ou major.");
}

const packagePath = path.join(root, "package.json");
const packageData = JSON.parse(await readFile(packagePath, "utf8"));
const parts = packageData.version.split(".").map(Number);
if (update === "major") {
  parts[0] += 1;
  parts[1] = 0;
  parts[2] = 0;
} else if (update === "minor") {
  parts[1] += 1;
  parts[2] = 0;
} else {
  parts[2] += 1;
}
const version = parts.join(".");
const date = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Toronto"
}).format(new Date());
const versionLabel = `v${version}`;

packageData.version = version;
await writeFile(packagePath, `${JSON.stringify(packageData, null, 2)}\n`);

const releasePath = path.join(root, "version.json");
const previousRelease = JSON.parse(await readFile(releasePath, "utf8"));
const release = {
  version: versionLabel,
  updated: date,
  changes: [summary],
  history: [
    { version: versionLabel, date, changes: [summary] },
    ...previousRelease.history
  ]
};
await writeFile(releasePath, `${JSON.stringify(release, null, 2)}\n`);

const indexPath = path.join(root, "index.html");
let index = await readFile(indexPath, "utf8");
index = index.replace(/Version : v[\d.]+/, `Version : ${versionLabel}`);
index = index.replace(/Dernière mise à jour : \d{4}-\d{2}-\d{2}/, `Dernière mise à jour : ${date}`);
index = index.replace(
  /<ul id="app-changes" class="version-changes">[\s\S]*?<\/ul>/,
  `<ul id="app-changes" class="version-changes">\n              <li>${summary}</li>\n            </ul>`
);
await writeFile(indexPath, index);

const swPath = path.join(root, "sw.js");
let sw = await readFile(swPath, "utf8");
sw = sw.replace(/elan-clean-v[\d.]+(?:-[a-z]+)?/, `elan-clean-v${version}`);
await writeFile(swPath, sw);

const readmePath = path.join(root, "README.md");
let readme = await readFile(readmePath, "utf8");
readme = readme.replace(/^# Élan v[\d.]+/m, `# Élan ${versionLabel}`);
readme = readme.replace(/- Version : v[\d.]+/, `- Version : ${versionLabel}`);
readme = readme.replace(/- Date : \d{4}-\d{2}-\d{2}/, `- Date : ${date}`);
readme = readme.replace(/- Changement : .*/, `- Changement : ${summary}`);
await writeFile(readmePath, readme);

const changelogPath = path.join(root, "CHANGELOG.md");
const changelog = await readFile(changelogPath, "utf8");
await writeFile(
  changelogPath,
  `# Historique Élan\n\n## ${versionLabel} - ${date}\n\n- ${summary}\n\n${changelog.replace(/^# Historique Élan\s*/u, "")}`
);

console.log(`Élan ${versionLabel} - ${date}`);
