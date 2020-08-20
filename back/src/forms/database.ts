/**
 * Prisma helpers function
 */

import { Form, prisma } from "../generated/prisma-client";

/**
 * Returns a prisma Form with all linked objects
 * (owner, ecoOrganisme, temporaryStorage, transportSegments)
 * @param form
 */
export async function getFullForm(form: Form) {
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
