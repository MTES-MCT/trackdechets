import { ParsedLine } from "../options";
import { RefinementCtx, z } from "zod";
import { getCachedCompany } from "./helpers";

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
