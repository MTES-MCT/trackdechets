import prisma from "../prisma";

import { BsdasriNotFound } from "./errors";
import { UserInputError } from "apollo-server-express";
import { Bsdasri } from "@prisma/client";

import { FullBsdasri } from "./types";

/**
 * Retrieves a dasri by id or throw a BsdasriNotFound error
 */
export async function getBsdasriOrNotFound({
  id,
  includeRegrouped = false,
  includeSynthesized = false
}: {
  id: string;
  includeRegrouped?: boolean;
  includeSynthesized?: boolean;
}) {
  if (!id) {
    throw new UserInputError("You should specify an id");
  }
  const regroupedParams = includeRegrouped
    ? { regroupedBsdasris: { select: { id: true } } }
    : {};
  const synthesizedParams = includeSynthesized
    ? { synthesizedBsdasris: { select: { id: true } } }
    : {};

  const bsdasri = await prisma.bsdasri.findUnique({
    where: { id },
    ...(includeRegrouped || includeSynthesized
      ? {
          include: {
            ...regroupedParams,
            ...synthesizedParams
          }
        }
      : {})
  });

  if (bsdasri == null || bsdasri.isDeleted == true) {
    throw new BsdasriNotFound(id.toString());
  }
  return bsdasri;
}

/**
 * Returns a prisma Dasri object with its owner
 * @param bsdasri
 */
export async function getFullBsdasri(bsdasri: Bsdasri): Promise<FullBsdasri> {
  const owner = await prisma.form
    .findUnique({ where: { id: bsdasri.id } })
    .owner();

  return {
    ...bsdasri,
    owner
  };
}
