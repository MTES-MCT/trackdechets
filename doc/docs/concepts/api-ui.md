---
title: Lien entre l'API et l'interface web Trackdéchets
---

En plus de l'API Trackdéchets, nous mettons également à disposition [une interface graphique](https://app.trackdechets.beta.gouv.fr) qui permet plusieurs choses :

- Création de nouveaux utilisateurs
- Enregistrement d'établissements et gestion des droits
- Édition et suivi des bordereaux
- Export de registre

L'interface graphique Trackdéchets utilise la même API que l'API publique documentée sur ce site à quelques exceptions près:

- L'accès à certaines fonctionnalités comme la création de compte, la modification de mots de passe, la gestion des droits, etc, est restreinte à une utilisation via l'interface graphique Trackdéchets uniquement.
- À l'inverse, des fonctionnalités avancées de l'API peuvent ne pas être exploitées dans l'interface graphique.

:::info
L'interface graphique Trackdéchets n'a pas vocation à se substituer à des solutions logicielles existantes mais plutôt à fournir un point d'accès basique pour la consultation et l'édition de bordereaux numériques. Elle permet notamemnt d'assurer l'accès à la plateforme aux acteurs de la chaîne de traçabilité qui ne sont pas équipés de solutions logicielles.
:::