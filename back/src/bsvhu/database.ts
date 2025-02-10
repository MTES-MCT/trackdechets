import { Prisma } from "@prisma/client";
import { FormNotFound } from "../forms/errors";
import { getReadonlyBsvhuRepository } from "./repository";

export async function getBsvhuOrNotFound<
  Args extends Omit<Prisma.BsvhuDefaultArgs, "where">
>(id: string, args?: Args): Promise<Prisma.BsvhuGetPayload<Args>> {
  const bsvhu = await getReadonlyBsvhuRepository().findUnique({ id }, args);
  if (bsvhu == null || !!bsvhu.isDeleted) {
    throw new FormNotFound(id.toString());
  }
  return bsvhu;
}
