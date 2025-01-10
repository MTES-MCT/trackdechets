import { ParsedLine } from "../options";
import { RefinementCtx, z } from "zod";
import { getCachedCompany } from "./helpers";

export async function transformReportForInfos<T extends ParsedLine>(
  line: T,
  { addIssue }: RefinementCtx
) {
  const company = await getCachedCompany(line.reportForCompanySiret);

  if (!company) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le siret "${line.reportForCompanySiret}" n'est pas inscrit sur Trackdéchets`,
      path: ["reportForCompanySiret"]
    });
    return z.NEVER;
  }

  return {
    ...line,
    reportForCompanyName: company.name,
    reportForCompanyAddress: company.address,
    reportForCompanyCity: "",
    reportForCompanyPostalCode: ""
  };
}
