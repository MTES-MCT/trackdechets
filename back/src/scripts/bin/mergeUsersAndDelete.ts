#!/usr/bin/env ts-node
import { prisma } from "@td/prisma";
import mergeUsers from "../prisma/mergeUsers";
import deleteUser from "../prisma/hardDeleteUser";

(async () => {
  const [userID, heirUserID] = process.argv.slice(2);

  if (!userID || !heirUserID) {
    console.log(
      [
        `Ce script permet de fusionner 2 comptes utilisateurs et d'en supprimer un.`,
        `Il accepte deux arguments :`,
        `- userID : id de l'utilisateur à supprimer, il cède tous ses objets liés à l'héritier`,
        `- heirUserID : id de l'utilisateur héritier, il obtient tous les objets liés`,
        ``,
        `Exemple :`,
        `node ./src/scripts/bin/mergeUsersAndDelete.js 1234 5678`
      ].join("\n")
    );
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userID } });
  const heir = await prisma.user.findUnique({ where: { id: heirUserID } });

  if (!user) {
    console.log(
      `L'utilisateur portant l'identifiant "${userID}" est introuvable.`
    );
    return;
  }

  if (!heir) {
    console.log(
      `L'utilisateur héritier portant l'identifiant "${heirUserID}" est introuvable.`
    );
    return;
  }

  await mergeUsers(user, heir);
  await deleteUser(user);
})();
