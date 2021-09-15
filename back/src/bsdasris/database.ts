import prisma from "../prisma";

import { BsdasriNotFound } from "./errors";
import { UserInputError } from "apollo-server-express";

/**
 * Retrieves a dasri by id or throw a BsdasriNotFound error
 */
export async function getBsdasriOrNotFound({
  id,
  includeGrouped = false
}: {
  id: string;
  includeGrouped?: boolean;
}) {
  if (!id) {
    throw new UserInputError("You should specify an id");
  }

  const bsdasri = await prisma.bsdasri.findUnique({
    where: { id },
    ...(includeGrouped && {
      include: { grouping: { select: { id: true } } }
    })
  });

  if (bsdasri == null || bsdasri.isDeleted == true) {
    throw new BsdasriNotFound(id.toString());
  }
  return bsdasri;
}
