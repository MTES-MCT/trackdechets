# Gerico

NB: Fonctionalités en beta

Les utilisateurs ont la possibilité de télécharger des fiches d'établissment en pdf.

### Principes techniques

L'application Gerico (fiche établissment) dispose d'une api rest nantie de 3 endpoints:

- /<secret-slug>/api/v1/create: POST {orgId, year} création d'une fiche établissment dont la génration se fera en asynchrone
- /<secret-slug>/api/v1/sheet/<sheetId> : GET récupère le statut de la fiche
- /<secret-slug>/api/v1/pdf/<sheetId> : GET télécharge le pdf de la fiche

Gerico envoie un webhook sur le back de Trackdechets (POST, {sheetId, status}) pour le notifier de la fin de la génération de la fiche

### Beta

La fonctionalité sera ouverte progressivement pour permettre d'ajuster les capacités de l'infrastructure.

### Limitations

La fonctionalité est réservée aux utilisateurs UI disposant de l'accès à la fonctionalité.
L'utilisateur doit être membre de l'établissement concerné.
Seules les années N et N-1 sont accessibles.
Une seule fiche est générable par jour et par établisesment.
Chaque établissement est autorisé par un featureFlag.

### Base de données

Le modèle CompanyDigest centralise les données persistés necessaires à cette fonctionalité.
Le modèle Compay reçoit une nouvelle colonne featureFlags (string[]) dans lequel la présence de la chaine `COMPANY_DIGEST` détermine l'accès à la fonctionalité.
CompanyDigest comporte user pour suivre l'utilisateur à l'origine de la demande

### Webhook

Le router présent back/src/routers/gericoWebhookRouter.ts gère les webhooks envoyés par gérico.
Les webhooks sont authentifiés par un header contenant un token hardcodé en variable d'environnement

### Api Trackdéchets

L'api TD reçoit 1 mutation et 2 queries privées.

### Api Gerico

Les requêtes sont authentifiées par un token renseigné en variable d'env

### Recette et developpement

Il n'existe à ce jour qu'une seule instance de Gerico, aussi le webhook ne sera adressé que vers une seule instance de Trackdéchets. En recette, penser à utiliser des entreprises existantes en production, les entreprises fictives où non inscrites en production ne fonctionneront pas

### Variables d'environnement

GERICO_API_URL=http://fiche.beta.gouv/secret/api/v1
GERICO_API_KEY=xyz
GERICO_WEBHOOK_SLUG=secret-slug
GERICO_WEBHOOK_TOKEN=abcd
