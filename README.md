# Elan - pilote Android

Elan est une premiere application de coaching quotidien pour tester des micro-objectifs, un score d'effort et des recompenses avant d'en faire un produit public.

## Ce que le pilote permet

- Choisir un etat du moment puis recevoir une mission de 1 a 4 minutes.
- Choisir soi-meme une categorie: cuisine, dechets, linge, espace, soin de base ou retour au calme.
- Cumuler un score quotidien et debloquer des recompenses.
- Conserver les donnees seulement sur l'appareil.
- Installer l'application depuis Chrome Android une fois publiee sur une adresse securisee.
- Activer et tester des notifications.

## Limite importante des rappels

Les rappels de ce prototype sont controles par l'application. Ils fonctionnent pendant qu'elle est ouverte ou encore active en arriere-plan. Pour recevoir des notifications fiables lorsque l'application est completement fermee, il faudra ajouter une infrastructure de notifications push ou emballer l'application en application Android native.

## Tester localement

Servir ce dossier avec un serveur web local, puis ouvrir l'adresse affichee dans un navigateur. Les notifications et l'installation exigent un contexte securise (`https` ou `localhost`).

## Deployer sur Vercel

Elan est une application frontend legere en HTML, CSS et JavaScript, sans React ni Vite.

- La commande de build est `npm run build`.
- Le dossier publie par Vercel est `dist`.
- `vercel.json` conserve le manifeste, le service worker et le retour SPA vers `index.html`.
- `.vercelignore` ecarte les anciennes archives de test du deploiement.

Pour un deploiement automatique, importer le depot GitHub dans Vercel. La configuration du projet est deja fournie dans les fichiers du depot.

## Direction pour le test reel

La prochaine etape est de publier cette version sur un lien prive `https` afin de l'installer sur Android, puis d'observer pendant une a deux semaines:

- les objectifs termines, remplaces ou ignores;
- les scores utiles ou demotivants;
- les domaines manquants;
- les heures et formulations de notification qui aident vraiment.
