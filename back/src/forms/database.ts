/**
 * Prisma helpers function
 */

import { Form, prisma, FormWhereUniqueInput } from "../generated/prisma-client";
import { FullForm } from "./types";
import { FormNotFound } from "./errors";

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
 * Retrives a form by id or readableId or throw a FormNotFound error
 */
export async function getFormOrFormNotFound({
  id,
  readableId
}: FormWhereUniqueInput) {
  if (!id && !readableId) {
    throw new Error("You should specify an id or a readableId");
  }
  const form = await prisma.form(id ? { id } : { readableId });
  if (form == null || form.isDeleted == true) {
    throw new FormNotFound(id ? id.toString() : readableId);
  }
  return form;
}
