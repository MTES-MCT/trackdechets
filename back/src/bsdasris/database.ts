import { FullDbBsdasri } from "./types";
import { BsdasriNotFound } from "./errors";
import { getReadonlyBsdasriRepository } from "./repository";
import { UserInputError } from "../common/errors";
import { Prisma } from "@td/prisma";

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
  const bsdasri = await getReadonlyBsdasriRepository().findUnique(
    { id },
    includeAssociated
      ? {
          include: {
            grouping: { select: { id: true } },
            synthesizing: { select: { id: true } }
          }
        }
      : {}
  );

  if (bsdasri == null || bsdasri.isDeleted == true) {
    throw new BsdasriNotFound(id.toString());
  }
  return bsdasri;
}

export async function getFullBsdasriOrNotFound<
  Args extends Omit<Prisma.BsdasriDefaultArgs, "where">
>(id: string, args?: Args): Promise<Prisma.BsdasriGetPayload<Args>> {
  if (!id) {
    throw new UserInputError("You should specify an id");
  }
  const bsdasri = await getReadonlyBsdasriRepository().findUnique({ id }, args);

  if (bsdasri == null || bsdasri.isDeleted == true) {
    throw new BsdasriNotFound(id.toString());
  }
  return bsdasri;
}
