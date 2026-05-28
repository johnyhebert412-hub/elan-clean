# Élan - livraison

Après toute modification visible ou changement de comportement :

1. Incrémenter la version avec `node scripts/version.mjs patch "Résumé"` pour une correction, `minor` pour une nouvelle fonction, ou `major` pour une grande étape.
2. Exécuter `node scripts/build.mjs`.
3. Créer le ZIP final avec `powershell -ExecutionPolicy Bypass -File scripts/package-release.ps1`.

Le script de version met à jour `package.json`, `version.json`, `CHANGELOG.md`, la version affichée dans Paramètres et le cache PWA.
