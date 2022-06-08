import { FormNotFound } from "../forms/errors";
import prisma from "../prisma";

export async function getBsvhuOrNotFound(id: string) {
  const form = await prisma.bsvhu.findUnique({
    where: { id }
  });

  if (form == null || form.isDeleted == true) {
    throw new FormNotFound(id.toString());
  }

  return form;
}
