#!/usr/bin/env ts-node
import { prisma } from "../../generated/prisma-client";
import deleteUser from "../prisma/deleteUser";

(async () => {
  const userID = process.argv[3];

  const user = userID ? await prisma.user({ id: userID }) : null;

  if (!user) {
    console.log(
      `L'utilisateur portant l'identifiant "${userID}" est introuvable.`
    );
    return;
  }

  await deleteUser(user);
})();
