import { Bsda, Prisma } from "@prisma/client";
import { FormNotFound } from "../forms/errors";
import { getReadonlyBsdaRepository } from "./repository";

export async function getBsdaOrNotFound<Include extends Prisma.BsdaInclude>(
  id: string,
  { include }: { include?: Include } = {}
) {
  const bsda = await getReadonlyBsdaRepository().findUnique<{
    include: Include;
  }>({ id }, include ? { include } : undefined);

  if (bsda == null || bsda.isDeleted) {
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
  const bsdaWithItermediaries = Prisma.validator<Prisma.BsdaArgs>()({
    include: { intermediaries: true }
  });

  const bsdaRepository = getReadonlyBsdaRepository();
  const forwardedBsda = bsda.forwardingId
    ? await bsdaRepository.findUnique(
        { id: bsda.forwardingId },
        bsdaWithItermediaries
      )
    : null;

  const groupedBsdas = await bsdaRepository
    .findRelatedEntity({ id: bsda.id })
    .grouping(bsdaWithItermediaries);

  return [forwardedBsda, ...(groupedBsdas ?? [])].filter(
    Boolean
  ) as Prisma.BsdaGetPayload<typeof bsdaWithItermediaries>[];
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
