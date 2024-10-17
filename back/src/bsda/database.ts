import { Bsda, BsdaTransporter, Prisma } from "@prisma/client";
import { FormNotFound } from "../forms/errors";
import { getReadonlyBsdaRepository } from "./repository";
import { prisma } from "@td/prisma";
import { UserInputError } from "../common/errors";
import { BsdaWithTransporters } from "./types";

export async function getBsdaOrNotFound<
  Args extends Omit<Prisma.BsdaDefaultArgs, "where">
>(id: string, args?: Args): Promise<Prisma.BsdaGetPayload<Args>> {
  const bsda = await getReadonlyBsdaRepository().findUnique({ id }, args);
  if (bsda == null || bsda.isDeleted) {
    throw new FormNotFound(id.toString());
  }
  return bsda;
}

export async function getBsdaTransporterOrNotFound({ id }: { id: string }) {
  if (!id) {
    throw new UserInputError(
      "Vous devez préciser un identifiant de transporteur"
    );
  }

  const transporter = await prisma.bsdaTransporter.findUnique({
    where: { id }
  });

  if (transporter === null) {
    throw new UserInputError(
      `Le transporteur BSDA avec l'identifiant "${id}" n'existe pas.`
    );
  }

  return transporter;
}

/**
 * Returns direct parents of a BSDA
 */
export async function getPreviousBsdas<
  Args extends Omit<Prisma.BsdaDefaultArgs, "where">
>(bsda: Pick<Bsda, "id" | "forwardingId">, args?: Args) {
  const bsdaRepository = getReadonlyBsdaRepository();
  const forwardedBsda = bsda.forwardingId
    ? await bsdaRepository.findUnique({ id: bsda.forwardingId }, args)
    : null;

  const groupedBsdas = await bsdaRepository
    .findRelatedEntity({ id: bsda.id })
    .grouping(args);

  return [forwardedBsda, ...(groupedBsdas ?? [])].filter(
    Boolean
  ) as Prisma.BsdaGetPayload<Args>[];
}

/**
 * Return all the BSDAs in the traceability history of this one
 */
export async function getBsdaHistory<
  Args extends Omit<Prisma.BsdaDefaultArgs, "where">
>(bsda: Bsda, args?: Args): Promise<Prisma.BsdaGetPayload<Args>[]> {
  async function recursiveGetBsdaHistory(
    bsdas: Bsda[],
    history: Prisma.BsdaGetPayload<Args>[]
  ) {
    const previous = await Promise.all(
      bsdas.map(bsda => getPreviousBsdas(bsda, args))
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

export async function getTransporters(
  bsda: Pick<Bsda, "id">
): Promise<BsdaTransporter[]> {
  const transporters = await prisma.bsda
    .findUnique({ where: { id: bsda.id } })
    .transporters({ orderBy: { number: "asc" } });
  return transporters ?? [];
}

export function getTransportersSync(bsda: {
  transporters: BsdaTransporter[] | null;
}): BsdaTransporter[] {
  return (bsda.transporters ?? []).sort((t1, t2) => t1.number - t2.number);
}

export async function getFirstTransporter(
  bsda: Pick<Bsda, "id">
): Promise<BsdaTransporter | null> {
  const transporters = await prisma.bsda
    .findUnique({ where: { id: bsda.id } })
    .transporters({ where: { number: 1 } });
  if (transporters && transporters.length > 0) {
    return transporters[0];
  }
  return null;
}

export function getFirstTransporterSync(bsda: {
  transporters: BsdaTransporter[] | null;
}): BsdaTransporter | null {
  const transporters = getTransportersSync(bsda);
  const firstTransporter = transporters.find(t => t.number === 1);
  return firstTransporter ?? null;
}

export function getLastTransporterSync(bsda: {
  transporters: BsdaTransporter[] | null;
}): BsdaTransporter | null {
  const transporters = getTransportersSync(bsda);
  const greatestNumber = Math.max(...transporters.map(t => t.number));
  const lastTransporter = transporters.find(t => t.number === greatestNumber);
  return lastTransporter ?? null;
}

export function getNthTransporterSync(
  bsda: BsdaWithTransporters,
  n: number
): BsdaTransporter | null {
  return (bsda.transporters ?? []).find(t => t.number === n) ?? null;
}

// Renvoie le premier transporteur qui n'a pas encore signé
export function getNextTransporterSync(bsda: {
  transporters: BsdaTransporter[] | null;
}): BsdaTransporter | null {
  const transporters = getTransportersSync(bsda);
  const nextTransporter = transporters.find(
    t => !t.transporterTransportSignatureDate
  );
  return nextTransporter ?? null;
}
