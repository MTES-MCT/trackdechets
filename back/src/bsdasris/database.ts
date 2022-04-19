import prisma from "../prisma";
import { FullDbBsdasri } from "./types";
import { BsdasriNotFound } from "./errors";
import { UserInputError } from "apollo-server-express";

/**
 * Retrieves a dasri by id or throw a BsdasriNotFound error
 */
export async function getBsdasriOrNotFound({
  id,
  includeAssociated = false
}: {
  id: string;
  includeAssociated?: boolean;
}): Promise<FullDbBsdasri> {
  if (!id) {
    throw new UserInputError("You should specify an id");
  }

  const bsdasri = await prisma.bsdasri.findUnique({
    where: { id },
    ...(includeAssociated && {
      include: {
        grouping: { select: { id: true } },
        synthesizing: { select: { id: true } }
      }
    })
  });

  if (bsdasri == null || bsdasri.isDeleted == true) {
    throw new BsdasriNotFound(id.toString());
  }
  return bsdasri;
}
