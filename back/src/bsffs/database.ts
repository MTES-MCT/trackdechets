import { Bsff } from ".prisma/client";
import { UserInputError } from "apollo-server-express";
import prisma from "../prisma";

export async function getBsffOrNotFound(id: string): Promise<Bsff> {
  const bsff = await prisma.bsff.findFirst({
    where: { id, isDeleted: false }
  });

  if (bsff == null) {
    throw new UserInputError(
      `Le bordereau de fluides frigorigènes n°${id} n'existe pas.`
    );
  }

  return bsff;
}
