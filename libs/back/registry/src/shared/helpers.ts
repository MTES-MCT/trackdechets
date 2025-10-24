import { prisma } from "@td/prisma";
import { ttlCache } from "./ttlCache";
import { Prisma } from "@td/prisma";

const _companyWithTransporterReceipt = {
  include: { transporterReceipt: true }
} satisfies Prisma.CompanyDefaultArgs;
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
