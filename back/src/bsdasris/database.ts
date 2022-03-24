import prisma from "../prisma";
import { FullDbBsdasri } from "./types";
import { BsdasriNotFound } from "./errors";
import { UserInputError } from "apollo-server-express";

/**
 * Retrieves a dasri by id or throw a BsdasriNotFound error
 */
export async function getBsdasriOrNotFound({
  id,
  includeGrouped = false,
  includeSynthesized = false
}: {
  id: string;
  includeGrouped?: boolean;
  includeSynthesized?: boolean;
}): Promise<FullDbBsdasri> {
  if (!id) {
    throw new UserInputError("You should specify an id");
  }

  const include = includeGrouped || includeSynthesized;
  const bsdasri = await prisma.bsdasri.findUnique({
    where: { id },
    ...(include && {
      include: {
        grouping: { select: { id: true } },
        synthesizing: { select: { id: true } }
      }
    })
  });
  // ...((includeGrouped || includeSynthesized) ? i: {}) //fix me

  if (bsdasri == null || bsdasri.isDeleted == true) {
    throw new BsdasriNotFound(id.toString());
  }
  return bsdasri;
}
