import { prisma } from "@td/prisma";
import { ttlCache } from "./ttlCache";
import { Prisma } from "@prisma/client";

const _companyWithTransporterReceipt =
  Prisma.validator<Prisma.CompanyDefaultArgs>()({
    include: { transporterReceipt: true }
  });
type CompanyWithTransporterReceipt = Prisma.CompanyGetPayload<
  typeof _companyWithTransporterReceipt
>;

export async function getCachedCompany(siret: string) {
  const cachedValue = ttlCache.get<CompanyWithTransporterReceipt>(siret);
  if (cachedValue) {
    return cachedValue;
  }

  const company = await prisma.company.findUnique({
    where: { orgId: siret },
    include: {
      transporterReceipt: true
    }
  });

  if (!company) {
    return null;
  }

  ttlCache.set(siret, company);
  return company;
}
