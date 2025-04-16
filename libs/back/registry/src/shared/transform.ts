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
      message: `Le SIRET "${line.reportForCompanySiret}" n'est pas inscrit sur Trackdéchets`,
      path: ["reportForCompanySiret"]
    });
    return z.NEVER;
  }

  return {
    ...line,
    reportForCompanyName: company.name ?? "",
    reportForCompanyAddress: company.street ?? company.address ?? "",
    reportForCompanyCity: company.city ?? "",
    reportForCompanyPostalCode: company.postalCode ?? ""
  };
}

export async function transformAndRefineItemReason<
  T extends ParsedLine & { id?: string | null }
>(
  item: T,
  existingItem: {
    id: string;
    isCancelled: boolean;
  } | null,
  { addIssue }: RefinementCtx
) {
  const existingId = existingItem?.id;

  // If we have an existing ID, set it
  item.id = existingId;

  // If the line alreary exists in DB and we dont have a reason, we can simply ignore it
  // Except if the line is cancelled. In that case we allow recreating it without a reason
  if (existingId && !item.reason) {
    if (existingItem?.isCancelled) {
      item.reason = "MODIFIER";
      return item;
    }
    item.reason = "IGNORER";
    return item;
  }

  if (!existingId && item.reason) {
    addIssue({
      code: z.ZodIssueCode.custom,
      message: `Le motif doit rester vide, l'identifiant unique "${item.publicId}" n'a jamais été importé pour cet établissement`,
      path: ["reason"]
    });
    return z.NEVER;
  }

  return item;
}
