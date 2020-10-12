/**
 * PRISMA HELPER FUNCTIONS
 */

import {
  Form,
  prisma,
  FormWhereUniqueInput,
  EcoOrganismeWhereUniqueInput,
  FormWhereInput
} from "../generated/prisma-client";
import { FullForm } from "./types";
import { FormNotFound, EcoOrganismeNotFound } from "./errors";
import { UserInputError } from "apollo-server-express";
import { FormRole } from "../generated/graphql/types";

/**
 * Returns a prisma Form with all linked objects
 * (owner, ecoOrganisme, temporaryStorage, transportSegments)
 * @param form
 */
export async function getFullForm(form: Form): Promise<FullForm> {
  const owner = await prisma.form({ id: form.id }).owner();
  const ecoOrganisme = await prisma.form({ id: form.id }).ecoOrganisme();
  const temporaryStorage = await prisma
    .form({ id: form.id })
    .temporaryStorageDetail();
  const transportSegments = await prisma
    .form({ id: form.id })
    .transportSegments();
  return {
    ...form,
    owner,
    ecoOrganisme,
    temporaryStorage,
    transportSegments
  };
}

/**
 * Retrieves a form by id or readableId or throw a FormNotFound error
 */
export async function getFormOrFormNotFound({
  id,
  readableId
}: FormWhereUniqueInput) {
  if (!id && !readableId) {
    throw new UserInputError("You should specify an id or a readableId");
  }
  const form = await prisma.form(id ? { id } : { readableId });
  if (form == null || form.isDeleted == true) {
    throw new FormNotFound(id ? id.toString() : readableId);
  }
  return form;
}

/**
 * Retrieves an eco-organisme by id or throw a EcoOrganismeNotFound error
 */
export async function getEcoOrganismeOrNotFound({
  id
}: EcoOrganismeWhereUniqueInput) {
  const eo = await prisma.ecoOrganisme({
    id
  });
  if (!eo) {
    throw new EcoOrganismeNotFound(id.toString());
  }
  return eo;
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
  const filtersByRole: { [key in FormRole]: Partial<FormWhereInput>[] } = {
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
        transportSegments_some: {
          transporterCompanySiret: siret
        }
      },
      {
        temporaryStorageDetail: {
          transporterCompanySiret: siret
        }
      }
    ],
    ["TRADER"]: [{ traderCompanySiret: siret }],
    ["ECO_ORGANISME"]: [{ ecoOrganisme: { siret: siret } }]
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
