import { Bsda, Prisma } from "@prisma/client";
import { FormNotFound } from "../forms/errors";
import { getReadonlyBsdaRepository } from "./repository";

export async function getBsdaOrNotFound<Include extends Prisma.BsdaInclude>(
  id: string,
  { include }: { include?: Include } = {}
) {
  const bsda = await getReadonlyBsdaRepository().findUnique<{
    include?: Include;
  }>({ id }, { include });

  if (bsda == null || bsda.isDeleted == true) {
    throw new FormNotFound(id.toString());
  }

  return bsda;
}

/**
 * Returns direct parents of a BSDA
 */
export async function getPreviousBsdas(
  bsda: Pick<Bsda, "id" | "forwardingId">
) {
  const bsdaRepository = getReadonlyBsdaRepository();
  const forwardedBsda = bsda.forwardingId
    ? await bsdaRepository.findUnique(
        { id: bsda.forwardingId },
        { include: { intermediaries: true } }
      )
    : null;

  const groupedBsdas = await bsdaRepository
    .findRelatedEntity({ id: bsda.id })
    .grouping({ include: { intermediaries: true } });

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
