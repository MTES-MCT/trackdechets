import { z } from "zod";
import { siretSchema } from "../../common/validation/zod/schema";
import { AdminRequestValidationMethod } from "@prisma/client";
import { isDefined } from "../../common/helpers";

const idSchema = z.coerce.string().length(25, "L'id doit faire 25 caractères.");

export const createAdminRequestInputSchema = z
  .object({
    companyOrgId: siretSchema(), // TODO: orgIdSchema?
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
          "L'ajout d'un courriel d'un collaborateur est requis pour cette méthode de validation.",
        path: ["collaboratorEmail"]
      });
    }
  });

export const queryAdminRequestsArgsSchema = z.object({
  skip: z.number().nonnegative().default(0).nullish(),
  first: z.number().min(1).max(50).default(10).nullish()
});

export const adminRequestIdSchema = z.object({
  adminRequestId: idSchema
});

export const acceptAdminRequestInputSchema = z
  .object({
    adminRequestId: idSchema.optional(),
    orgId: siretSchema().optional(), // TODO: orgIdSchema?
    code: z.string().length(8).optional()
  })
  .superRefine(({ adminRequestId, orgId, code }, refinementContext) => {
    const allParamsAreProvided =
      isDefined(adminRequestId) && (isDefined(orgId) || isDefined(code));
    const codeParamsAreIncomplete =
      (isDefined(orgId) && !isDefined(code)) ||
      (!isDefined(orgId) && isDefined(code));

    if (allParamsAreProvided || codeParamsAreIncomplete) {
      return refinementContext.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Vous devez soit fournir l'adminRequestId, soit le tuple orgId / code.",
        path: ["adminRequestId"]
      });
    }
  });
