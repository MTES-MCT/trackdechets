import { Prisma } from ".prisma/client";
import prisma from "../prisma";
import { ApplicationNotFound } from "./errors";

/**
 * Retrieves an application by id or throw an error
 */
export async function getApplicationOrApplicationNotFound({
  id
}: Required<Prisma.ApplicationWhereUniqueInput>) {
  const application = await prisma.application.findUnique({
    where: { id }
  });
  if (application == null) {
    throw new ApplicationNotFound(id);
  }
  return application;
}
