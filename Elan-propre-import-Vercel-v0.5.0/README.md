# Élan v0.5.0 - version propre

Application mobile simple en HTML, CSS et JavaScript. Aucun framework et aucun build obligatoire.

## Tester sur l'ordinateur

Ouvrir `index.html`. Les boutons et la sauvegarde locale fonctionnent directement.

Les notifications et l'installation Android fonctionnent après publication en HTTPS, par exemple sur Vercel.

## Publier sur Vercel

1. Mettre le contenu de ce dossier dans un dépôt GitHub.
2. Importer le dépôt dans Vercel.
3. Choisir `Framework Preset: Other`.
4. Laisser `Build Command` et `Output Directory` vides.
5. Publier.

Vercel sert directement `index.html`, `styles.css` et `app.js`.

## Fichiers importants

- `index.html` : structure de l'interface seulement.
- `styles.css` : design mobile.
- `app.js` : comportement et sauvegarde locale.
- `manifest.webmanifest` et `sw.js` : installation Android.
- `vercel.json` : en-têtes utiles à Vercel.

## Version

- Version : v0.5.0
- Date : 2026-05-26
- Changement : reconstruction propre et minimale pour test Android et Vercel.
