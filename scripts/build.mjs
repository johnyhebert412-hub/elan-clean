import { existsSync } from "node:fs";
import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const requiredFiles = [
  "index.html",
  "styles.css",
  "app.js",
  "logic.js",
  "manifest.webmanifest",
  "sw.js"
];
const iconFiles = ["icon-192.png", "icon-512.png", "icon.svg"];

async function prepareIcons() {
  const icons = path.join(root, "icons");

  if (!existsSync(icons)) {
    await mkdir(icons, { recursive: true });
    console.warn("Dossier icons absent : dossier cree pour le build.");
  }

  for (const icon of iconFiles) {
    const expectedFile = path.join(icons, icon);
    const rootFile = path.join(root, icon);
    if (!existsSync(expectedFile) && existsSync(rootFile)) {
      await cp(rootFile, expectedFile);
      console.warn(`Icone replacee dans icons/: ${icon}`);
    }
  }
}

async function copyRequiredFile(file) {
  const source = path.join(root, file);
  if (!existsSync(source)) {
    throw new Error(`Fichier requis absent pour Vercel : ${file}`);
  }
  await cp(source, path.join(dist, file), { recursive: true });
}

async function build() {
  await prepareIcons();
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });

  for (const file of requiredFiles) {
    await copyRequiredFile(file);
  }

  const icons = path.join(root, "icons");
  if (existsSync(icons)) {
    await cp(icons, path.join(dist, "icons"), { recursive: true });
  }

  console.log("Elan pret pour Vercel dans dist/");
}

try {
  await build();
} catch (error) {
  console.error("Build Elan impossible :", error.message);
  process.exitCode = 1;
}
