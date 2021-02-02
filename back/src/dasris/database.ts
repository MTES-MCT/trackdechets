import prisma from "../prisma";

import { DasriNotFound } from "./errors";
import { UserInputError } from "apollo-server-express";
import { Prisma, Dasri } from "@prisma/client";

import { DasriRole } from "../generated/graphql/types";
import { FullDasri } from "./types";
/**
 * Retrieves a dasri by id or readableId or throw a DasriNotFound error
 */
export async function getDasriOrDasriNotFound({
  id,
  readableId
}: Prisma.DasriWhereUniqueInput) {
  if (!id && !readableId) {
    throw new UserInputError("You should specify an id or a readableId");
  }

  const dasri = await prisma.dasri.findUnique({
    where: id ? { id } : { readableId }
  });

  if (dasri == null || dasri.isDeleted == true) {
    throw new DasriNotFound(id ? id.toString() : readableId);
  }
  return dasri;
}

/**
 * Get a filter to retrieve dasris the passed siret has rights on
 * Optional parameter roles allows to filter on specific roles
 * For example getDasrisRightFilter(company, [TRANSPORTER]) will return a filter
 * only for the forms in which the company appears as a transporter
 * @param siret the siret to filter on
 * @param roles optional [FormRole] to refine filter
 */
export function getDasrisRightFilter(siret: string, roles?: DasriRole[]) {
  const filtersByRole: {
    [key in DasriRole]: Partial<Prisma.DasriWhereInput>[];
  } = {
    ["RECIPIENT"]: [{ recipientCompanySiret: siret }],
    ["EMITTER"]: [{ emitterCompanySiret: siret }],
    ["TRANSPORTER"]: [{ transporterCompanySiret: siret }]
  };

  return {
    OR: Object.keys(filtersByRole)
      .filter((role: DasriRole) =>
        roles?.length > 0 ? roles.includes(role) : true
      )
      .map(role => filtersByRole[role])
      .flat()
  };
}

/**
 * Returns a prisma Dasri object with its owner
 * @param dasri
 */
export async function getFullDasri(dasri: Dasri): Promise<FullDasri> {
  const owner = await prisma.form
    .findUnique({ where: { id: dasri.id } })
    .owner();

  return {
    ...dasri,
    owner
  };
}
