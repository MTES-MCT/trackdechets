#!/usr/bin/env ts-node
import prompts from "prompts";
import { prisma } from "@td/prisma";
import deleteUser from "../prisma/hardDeleteUser";

(async () => {
  const [userID] = process.argv.slice(2);

  if (!userID) {
    console.log(
      [
        `Ce script permet de supprimer 1 compte utilisateur et ses objets liés.`,
        `Il accepte un seul argument :`,
        `- userID : id de l'utilisateur à supprimer`,
        `Avant d'enclencher la suppression, des vérifications sont faites pour s'assurer de ne pas supprimer des informations importantes.`,
        `Il est par exemple impossible de supprimer un utilisateur qui est seul administrateur d'une entreprise.`,
        ``,
        `Exemple :`,
        `node ./src/scripts/bin/hardDeleteUser.js 1234`
      ].join("\n")
    );
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userID } });

  if (!user) {
    console.log(
      `L'utilisateur portant l'identifiant "${userID}" est introuvable.`
    );
    return;
  }
  const { value } = await prompts({
    type: "confirm",
    name: "value",
    message: `Can you confirm to hard delete this user id=${user.id} email=${user.email}?`,
    initial: false
  });
  if (!value) {
    process.exit(0);
  }
  await deleteUser(user);
  process.exit(0);
})();
