import { prisma } from "@td/prisma";
import { ParsedLine } from "../options";
import { ttlCache } from "./ttlCache";
import { Company } from "@prisma/client";
import { RefinementCtx, z } from "zod";

export async function transformReportForInfos(
  line: ParsedLine,
  { addIssue }: RefinementCtx
) {
  const company = await getCachedCompany(line.reportForSiret);

  if (!company) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le siret "${line.reportForSiret}" n'est pas inscrit sur Trackdéchets`,
      path: ["reportForSiret"]
    });
    return z.NEVER;
  }

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

  const company = await prisma.company.findUnique({
    where: { orgId: siret }
  });

  if (!company) {
    return null;
  }

  ttlCache.set(siret, company);
  return company;
}
