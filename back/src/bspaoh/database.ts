import prisma from "../prisma";
import { Bspaoh, BspaohTransporter } from "@prisma/client";
import { BspaohNotFound } from "./errors";
import { UserInputError } from "../common/errors";
import { PrismaBspaohWithTransporters } from "./types";

export async function getBspaohOrNotFound({
  id
}: {
  id: string;
}): Promise<PrismaBspaohWithTransporters> {
  if (!id) {
    throw new UserInputError("You should specify an id");
  }
  const bspaoh = await prisma.bspaoh.findUnique({
    where: {
      id
    },
    include: { transporters: true }
  });

  if (bspaoh == null || bspaoh.isDeleted) {
    throw new BspaohNotFound(id.toString());
  }
  return bspaoh;
}

export async function getTransporters(
  bspaoh: Pick<Bspaoh, "id">
): Promise<BspaohTransporter[]> {
  const transporters = await prisma.bspaoh
    .findUnique({ where: { id: bspaoh.id } })
    .transporters({ orderBy: { number: "asc" } });
  return transporters ?? [];
}
export async function getBspaohFirstTransporter(
  bspaoh: Pick<Bspaoh, "id">
): Promise<BspaohTransporter | null> {
  const transporters = await getTransporters(bspaoh);
  const firstTransporter = transporters.find(t => t.number === 1);
  return firstTransporter ?? null;
}
