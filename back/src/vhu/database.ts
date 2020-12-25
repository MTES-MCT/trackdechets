import { FormNotFound } from "src/forms/errors";
import prisma from "src/prisma";

export async function getFormOrFormNotFound(id: string) {
  const form = await prisma.vhuForm.findUnique({
    where: { id }
  });

  if (form == null || form.isDeleted == true) {
    throw new FormNotFound(id.toString());
  }

  return form;
}
