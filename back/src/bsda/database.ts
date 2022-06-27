import { Bsda } from "@prisma/client";
import { FormNotFound } from "../forms/errors";
import { getReadonlyBsdaRepository } from "./repository";

export async function getBsdaOrNotFound(id: string) {
  const form = await getReadonlyBsdaRepository().findUnique({ id });

  if (form == null || form.isDeleted == true) {
    throw new FormNotFound(id.toString());
  }

  return form;
}

/**
 * Returns direct parents of a BSDA
 */
export async function getPreviousBsdas(bsda: Bsda) {
  const bsdaRepository = getReadonlyBsdaRepository();
  const forwardedBsda = bsda.forwardingId
    ? await bsdaRepository.findUnique({ id: bsda.forwardingId })
    : null;

  const groupedBsdas = await bsdaRepository
    .findRelatedEntity({ id: bsda.id })
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
