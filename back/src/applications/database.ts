import { prisma } from "@td/prisma";
import { ApplicationNotFound } from "./errors";

/**
 * Retrieves an application by id or throw an error
 */
export async function getApplicationOrApplicationNotFound({
  id
}: {
  id: string;
}) {
  const application = await prisma.application.findUnique({
    where: { id }
  });
  if (application == null) {
    throw new ApplicationNotFound(id);
  }
  return application;
}
