---
title: Limitations
---

Pour des raisons de sécurité, le nombre de requêtes par adresse IP est limitée à 1000 par minute. Passé cette limite, les requêtes aboutiront avec un statut 429 (Too Many Requests). À noter que toutes les réponses émises par l'API contiennent les headers suivants :

- X-RateLimit-Limit : nombre maximum de requêtes possible dans la fenêtre de 1 minute.
- X-RateLimit-Remaining : nombre de requêtes restantes dans la fenêtre de 1 minute.
- X-RateLimit-Reset : timestamp (en secondes) de la date à laquelle une nouvelle fenêtre débute.
