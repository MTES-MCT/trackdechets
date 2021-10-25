/**
 * PRISMA HELPER FUNCTIONS
 */

import { Form, Prisma } from "@prisma/client";
import { UserInputError } from "apollo-server-express";
import prisma from "../prisma";
import { FormRole } from "../generated/graphql/types";
import { FormNotFound } from "./errors";
import { FullForm } from "./types";

/**
 * Returns a prisma Form with all linked objects
 * (owner, ecoOrganisme, temporaryStorage, transportSegments)
 * @param form
 */
export async function getFullForm(form: Form): Promise<FullForm> {
  const temporaryStorageDetail = await prisma.form
    .findUnique({ where: { id: form.id } })
    .temporaryStorageDetail();
  const transportSegments = await prisma.form
    .findUnique({ where: { id: form.id } })
    .transportSegments();
  return {
    ...form,
    temporaryStorageDetail,
    transportSegments
  };
}

/**
 * Retrieves a form by id or readableId or throw a FormNotFound error
 */
export async function getFormOrFormNotFound({
  id,
  readableId
}: Prisma.FormWhereUniqueInput) {
  if (!id && !readableId) {
    throw new UserInputError("You should specify an id or a readableId");
  }
  const form = await prisma.form.findUnique({
    where: id ? { id } : { readableId }
  });
  if (form == null || form.isDeleted == true) {
    throw new FormNotFound(id ? id.toString() : readableId);
  }
  return form;
}

/**
 * Get a filter to retrieve forms the passed siret has rights on
 * Optional parameter roles allows to filter on specific roles
 * For example getFormsRightFilter(company, [TRANSPORTER]) will return a filter
 * only for the forms in which the company appears as a transporter
 * @param siret the siret to filter on
 * @param roles optional [FormRole] to refine filter
 */
export function getFormsRightFilter(siret: string, roles?: FormRole[]) {
  const filtersByRole: {
    [key in FormRole]: Partial<Prisma.FormWhereInput>[];
  } = {
    ["RECIPIENT"]: [
      { recipientCompanySiret: siret },
      {
        temporaryStorageDetail: {
          destinationCompanySiret: siret
        }
      }
    ],
    ["EMITTER"]: [{ emitterCompanySiret: siret }],
    ["TRANSPORTER"]: [
      { transporterCompanySiret: siret },
      {
        transportSegments: {
          some: {
            transporterCompanySiret: siret
          }
        }
      },
      {
        temporaryStorageDetail: {
          transporterCompanySiret: siret
        }
      }
    ],
    ["TRADER"]: [{ traderCompanySiret: siret }],
    ["BROKER"]: [{ brokerCompanySiret: siret }],
    ["ECO_ORGANISME"]: [{ ecoOrganismeSiret: siret }]
  };

  return {
    OR: Object.keys(filtersByRole)
      .filter((role: FormRole) =>
        roles?.length > 0 ? roles.includes(role) : true
      )
      .map(role => filtersByRole[role])
      .flat()
  };
}

export async function getFinalDestinationSiret(form: Form) {
  return form.temporaryStorageDetailId
    ? (
        await prisma.form
          .findUnique({ where: { id: form.id } })
          .temporaryStorageDetail()
      )?.destinationCompanySiret
    : form.recipientCompanySiret;
}
