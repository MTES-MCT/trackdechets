import { Bsda } from "@prisma/client";
import { FormNotFound } from "../forms/errors";
import prisma from "../prisma";

export async function getBsdaOrNotFound(id: string) {
  const form = await prisma.bsda.findUnique({
    where: { id }
  });

  if (form == null || form.isDeleted == true) {
    throw new FormNotFound(id.toString());
  }

  return form;
}

/**
 * Returns direct parents of a BSDA
 */
export async function getPreviousBsdas(bsda: Bsda) {
  const forwardedBsda = bsda.forwardingId
    ? await prisma.bsda.findUnique({ where: { id: bsda.forwardingId } })
    : null;

  const groupedBsdas = await prisma.bsda
    .findUnique({ where: { id: bsda.id } })
    .grouping();

  return [forwardedBsda, ...groupedBsdas].filter(Boolean);
}

/**
 * Return all the BSDAs in the traceability history of this one
 */
export async function getBsdaHistory(bsda: Bsda): Promise<Bsda[]> {
  async function recursiveGetBsdaHistory(bsdas: Bsda[], history: Bsda[]) {
    const previous = await Promise.all(
      bsdas.map(bsda => getPreviousBsdas(bsda))
    );
    const previousFlattened = previous.reduce((ps, curr) => {
      return [...ps, ...curr];
    });
    if (previousFlattened.length === 0) {
      return history;
    }
    return recursiveGetBsdaHistory(previousFlattened, [
      ...previousFlattened,
      ...history
    ]);
  }

  return recursiveGetBsdaHistory([bsda], []);
}
