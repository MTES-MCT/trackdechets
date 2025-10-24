import { BsvhuTransporter, Prisma } from "@td/prisma";
import { FormNotFound } from "../forms/errors";
import { getReadonlyBsvhuRepository } from "./repository";
import { UserInputError } from "../common/errors";
import { prisma } from "@td/prisma";
import { BsvhuWithTransporters } from "./types";
import { PrismaTransaction } from "../common/repository/types";

export async function getBsvhuOrNotFound<
  Args extends Omit<Prisma.BsvhuDefaultArgs, "where">
>(id: string, args?: Args): Promise<Prisma.BsvhuGetPayload<Args>> {
  const bsvhu = await getReadonlyBsvhuRepository().findUnique({ id }, args);
  if (bsvhu == null || !!bsvhu.isDeleted) {
    throw new FormNotFound(id.toString());
  }
  return bsvhu;
}

export async function getBsvhuTransporterOrNotFound({ id }: { id: string }) {
  if (!id) {
    throw new UserInputError(
      "Vous devez préciser un identifiant de transporteur"
    );
  }

  const transporter = await prisma.bsvhuTransporter.findUnique({
    where: { id }
  });

  if (transporter === null) {
    throw new UserInputError(
      `Le transporteur BSVHU avec l'identifiant "${id}" n'existe pas.`
    );
  }

  return transporter;
}

/**
 * Permet de mettre à jour le champ dénormalisé `transportersOrgIds`
 */
export async function updateTransporterOrgIds(
  bsvhu: BsvhuWithTransporters,
  transaction: PrismaTransaction
) {
  const transporters = getTransportersSync(bsvhu);
  await transaction.bsvhu.update({
    where: { id: bsvhu.id },
    data: {
      transportersOrgIds: transporters
        .flatMap(t => [
          t.transporterCompanySiret,
          t.transporterCompanyVatNumber
        ])
        .filter(Boolean)
    }
  });
}

export async function getTransporters(
  bsvhu: Pick<BsvhuWithTransporters, "id">
): Promise<BsvhuTransporter[]> {
  const transporters = await prisma.bsvhuTransporter.findMany({
    orderBy: { number: "asc" },
    where: { bsvhuId: bsvhu.id }
  });
  return transporters ?? [];
}

export function getTransportersSync<
  T extends Pick<BsvhuTransporter, "number">
>(bsvhu: { transporters: T[] | null }): T[] {
  return (bsvhu.transporters ?? []).sort((t1, t2) => t1.number - t2.number);
}

export async function getFirstTransporter(
  bsvhu: Pick<BsvhuWithTransporters, "id">
): Promise<BsvhuTransporter | null> {
  const transporters = await prisma.bsvhuTransporter.findMany({
    where: { number: 1, bsvhuId: bsvhu.id }
  });
  if (transporters && transporters.length > 0) {
    return transporters[0];
  }
  return null;
}

export function getFirstTransporterSync<
  T extends Pick<BsvhuTransporter, "number">
>(bsvhu: { transporters: T[] | null }): T | null {
  const transporters = getTransportersSync(bsvhu);
  const firstTransporter = transporters.find(t => t.number === 1);
  return firstTransporter ?? null;
}

export function getLastTransporterSync(bsvhu: {
  transporters: BsvhuTransporter[] | null;
}): BsvhuTransporter | null {
  const transporters = getTransportersSync(bsvhu);
  const greatestNumber = Math.max(...transporters.map(t => t.number));
  const lastTransporter = transporters.find(t => t.number === greatestNumber);
  return lastTransporter ?? null;
}

export function getNthTransporterSync(
  bsvhu: BsvhuWithTransporters,
  n: number
): BsvhuTransporter | null {
  return (bsvhu.transporters ?? []).find(t => t.number === n) ?? null;
}

// Renvoie le premier transporteur qui n'a pas encore signé
export function getNextTransporterSync(bsvhu: {
  transporters: BsvhuTransporter[] | null;
}): BsvhuTransporter | null {
  const transporters = getTransportersSync(bsvhu);
  const nextTransporter = transporters.find(
    t => !t.transporterTransportSignatureDate
  );
  return nextTransporter ?? null;
}
