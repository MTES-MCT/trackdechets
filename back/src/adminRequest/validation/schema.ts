import { z } from "zod";
import {
  foreignVatNumberSchema,
  siretSchema,
  vatNumberSchema
} from "../../common/validation/zod/schema";
import { AdminRequestValidationMethod } from "@prisma/client";
import { isDefined } from "../../common/helpers";
import { isSiret } from "@td/constants";

const idSchema = z.coerce.string().length(25, "L'id doit faire 25 caractères.");

const orgIdSuperRefine = (orgId, path, refinementContext) => {
  if (!isDefined(orgId)) return;

  try {
    siretSchema().parse(orgId);
  } catch (_) {
    try {
      vatNumberSchema.parse(orgId);
    } catch (_) {
      try {
        foreignVatNumberSchema().parse(orgId);
      } catch (_) {
        return refinementContext.addIssue({
          code: z.ZodIssueCode.custom,
          message: `L'identifiant de l'établissement ${path} doit être un SIRET ou un numéro de TVA valide.`,
          path: [path]
        });
      }
    }
  }
};

export const createAdminRequestInputSchema = z
  .object({
    companyOrgId: z.string(), // Actual check in superRefine
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
  })
  .superRefine(({ companyOrgId }, refinementContext) =>
    orgIdSuperRefine(companyOrgId, "companyOrgId", refinementContext)
  )
  .superRefine(({ companyOrgId, validationMethod }, refinementContext) => {
    if (
      !isSiret(companyOrgId) &&
      validationMethod === AdminRequestValidationMethod.SEND_MAIL
    ) {
      return refinementContext.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Le mode de vérification par courrier n'est pas autorisé pour les établissements étrangers.",
        path: ["validationMethod"]
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
    orgId: z.string().optional(), // Actual check in superRefine
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
  })
  .superRefine(({ orgId }, refinementContext) =>
    orgIdSuperRefine(orgId, "orgId", refinementContext)
  );
