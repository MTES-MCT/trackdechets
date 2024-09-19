import { prisma } from "@td/prisma";
import { ParsedLine } from "../options";
import { ttlCache } from "./ttlCache";
import { Company } from "@prisma/client";

export async function transformReportForInfos(line: ParsedLine) {
  const company = await getCachedCompany(line.reportForSiret);

  return {
    ...line,
    reportForName: company.name,
    reportForAddress: company.address,
    reportForCity: "",
    reportForPostalCode: ""
  };
}

async function getCachedCompany(siret: string) {
  const cachedValue = ttlCache.get<Company>(siret);
  if (cachedValue) {
    return cachedValue;
  }

  const company = await prisma.company.findUniqueOrThrow({
    where: { orgId: siret }
  });

  ttlCache.set(siret, company);
  return company;
}
