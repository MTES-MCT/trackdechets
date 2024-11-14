import { prisma } from "@td/prisma";
import { ttlCache } from "./ttlCache";
import { Company } from "@prisma/client";

export async function getCachedCompany(siret: string) {
  const cachedValue = ttlCache.get<Company>(siret);
  if (cachedValue) {
    return cachedValue;
  }

  const company = await prisma.company.findUnique({
    where: { orgId: siret }
  });

  if (!company) {
    return null;
  }

  ttlCache.set(siret, company);
  return company;
}
