#!/usr/bin/env ts-node
import { prisma } from "../../generated/prisma-client";
import mergeUsers from "../prisma/mergeUsers";
import deleteUser from "../prisma/deleteUser";

(async () => {
  const userID = process.argv[3];
  const heirUserID = process.argv[4];

  const user = userID ? await prisma.user({ id: userID }) : null;
  const heir = heirUserID ? await prisma.user({ id: heirUserID }) : null;

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
