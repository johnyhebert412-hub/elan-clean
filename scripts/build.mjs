import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "sw.js",
  "vercel.json"
];
const requiredIcons = ["icon-192.png", "icon-512.png", "icon.svg"];

async function ensureIcons() {
  const iconsDir = path.join(root, "icons");
  if (!existsSync(iconsDir)) {
    await mkdir(iconsDir, { recursive: true });
  }

  for (const icon of requiredIcons) {
    const inIcons = path.join(iconsDir, icon);
    const atRoot = path.join(root, icon);
    if (!existsSync(inIcons) && existsSync(atRoot)) {
      await copyFile(atRoot, inIcons);
    }
    if (!existsSync(inIcons)) {
      throw new Error(`Icône requise absente : icons/${icon}`);
    }
  }
}

async function validateEntry() {
  const html = await readFile(path.join(root, "index.html"), "utf8");
  if (!html.includes('<script defer src="app.js"></script>')) {
    throw new Error("index.html doit charger app.js depuis un fichier séparé.");
  }
  if (html.includes("const STORAGE_KEY") || html.includes("function render")) {
    throw new Error("index.html contient du JavaScript qui doit rester dans app.js.");
  }
}

async function build() {
  for (const file of requiredFiles) {
    if (!existsSync(path.join(root, file))) {
      throw new Error(`Fichier requis absent : ${file}`);
    }
  }
  await ensureIcons();
  await validateEntry();
  console.log("Élan v0.5.1 vérifié. Projet prêt pour Vercel.");
}

try {
  await build();
} catch (error) {
  console.error("Vérification Élan échouée :", error.message);
  process.exitCode = 1;
}
