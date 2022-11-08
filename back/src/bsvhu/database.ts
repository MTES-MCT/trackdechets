import { FormNotFound } from "../forms/errors";
import { getReadonlyBsvhuRepository } from "./repository";

export async function getBsvhuOrNotFound(id: string) {
  const bsvhu = await getReadonlyBsvhuRepository().findUnique({ id });
  if (bsvhu == null || !!bsvhu.isDeleted) {
    throw new FormNotFound(id.toString());
  }

  return bsvhu;
}
