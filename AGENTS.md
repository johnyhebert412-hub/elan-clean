# Elan - livraison

Après une modification visible ou un changement de comportement dans Elan :

1. Incrementer la version avec `node scripts/version.mjs patch "Resume court"` pour une correction, `minor` pour une nouvelle fonctionnalite, ou `major` pour un changement majeur.
2. Executer les tests et le build.
3. Creer le ZIP final avec `powershell -ExecutionPolicy Bypass -File scripts/package-release.ps1`.

Ne pas incrementer la version pour une lecture, un test sans modification ou la simple regeneration du ZIP.

## Stabilite avant rapidite

Avant toute modification de fonctionnalite :

1. Analyser la structure actuelle et les fichiers concernes.
2. Reperer le code duplique, desorganise ou fragile.
3. Si la section concernee est instable, la nettoyer et la restructurer avant d'ajouter la nouvelle fonction.
4. Supprimer le vieux code devenu inutile apres la refactorisation.

Toujours conserver ces regles techniques :

- Garder `index.html` propre, sans gros bloc JavaScript injecte dans le HTML.
- Garder le JavaScript dans des fichiers separes et maintenir les imports ES modules valides.
- Eviter les correctifs isoles lorsqu'ils compliquent davantage une section deja fragile.
- Verifier les tests, le build et la compatibilite Vercel avant une livraison.
- Ne pas inclure de fichiers de test local ou temporaires dans le paquet publie.

Priorite du projet : stabilite et maintenabilite avant vitesse de modification.
