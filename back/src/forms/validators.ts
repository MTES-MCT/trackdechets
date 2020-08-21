import { prisma, EcoOrganisme } from "../generated/prisma-client";
import { EcoOrganismeNotFound } from "./errors";

export async function validateEcorganisme(ecoOrganisme: {
  id: string;
}): Promise<EcoOrganisme> {
  const eo = await prisma.ecoOrganisme({
    id: ecoOrganisme.id
  });
  if (!eo) {
    throw new EcoOrganismeNotFound(ecoOrganisme.id);
  }
  return eo;
}
