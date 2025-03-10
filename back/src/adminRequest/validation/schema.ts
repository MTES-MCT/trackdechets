import { z } from "zod";
import { siretSchema } from "../../common/validation/zod/schema";
import { AdminRequestValidationMethod } from "@prisma/client";
import { isDefined } from "../../common/helpers";

export const createAdminRequestInputSchema = z
  .object({
    companyOrgId: siretSchema(),
    collaboratorEmail: z.string().email().optional(),
    validationMethod: z.enum([
      AdminRequestValidationMethod.REQUEST_ADMIN_APPROVAL,
      AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL,
      AdminRequestValidationMethod.SEND_MAIL
    ])
  })
  .superRefine(({ validationMethod, collaboratorEmail }, refinementContext) => {
    if (
      validationMethod ===
        AdminRequestValidationMethod.REQUEST_COLLABORATOR_APPROVAL &&
      !isDefined(collaboratorEmail)
    ) {
      return refinementContext.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "L'adresse email d'un collaborateur est requise pour cette méthode de validation.",
        path: ["collaboratorEmail"]
      });
    }
  });

export const queryAdminRequestsArgsSchema = z.object({
  skip: z.number().nonnegative().nullish(),
  first: z.number().min(1).max(50).nullish()
});
