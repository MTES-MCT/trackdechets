import { RefinementCtx } from "zod";
import { ParsedZodCompany } from "./schema";

export const setCompanyOrgId = (
  company: ParsedZodCompany,
  ctx: RefinementCtx
) => {
  const orgId = company.siret ?? company.vatNumber;
  if (!orgId) {
    ctx.addIssue({
      code: "custom",
      message: "Un SIRET ou n°TVA (hors France) doit être précisé"
    });
  }
  return { ...company, orgId: orgId! };
};
