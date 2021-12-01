---
title: Validation des données
---

La validation des données entrantes passe principalement par les restrictions du schéma GraphQL. Vous pouvez donc vous référer à la documentation du type d'un champ pour savoir ce qui est attendu.

Si vous ne trouvez pas de mention spéciale concernant un champ, vous pouvez partir du principe que la documentation de son type est complète. Par exemple un champ `String` est une chaîne de caractères sans contraintes particulières. Si ce champ avait une taille limite, il en serait fait mention.

Le nom d'un champ est également un indicateur de ce qui est attendu, par exemple un champ `email: String` s'attend à une adresse email valide, `url: String` à une URL valide, `siret: String` à une suite de 14 chiffres.

Consultez la page [Erreurs](./errors.md) pour apprendre plus sur le format des erreurs dans le cas d'un problème de validation.

## Champs requis

Les champs requis sont marqués d'un point d'exclamation avec GraphQL : `!`. Il y a une exception pour les bordereaux qui peuvent être complété au fil du temps. Dans ce cas, la majorité des champs seront marqués comme optionnels, pour permettre de créer un bordereau partiel et de le compléter. Ceci étant dit, certains champs doivent être renseignés avant certaines signatures. Dans ce cas, vous retrouverez la liste de ces champs sur la mutation de signature qui vous intéresse.

Par exemple, pour connaître les champs requis avant de pouvoir signer un BSDD, vous pouvez vous référer à la documentation de la mutation [`markAsSealed`](./api-reference/bsdd/mutations.md#markassealed).
