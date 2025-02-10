import { RefinementCtx, z } from "zod";
import { isFRVat, isVat } from "@td/constants";
import { CompanyRole, siretSchema } from "./zod/schema";

export const intermediarySchema = z.object({
  siret: siretSchema(CompanyRole.Intermediary),
  contact: z.string({
    required_error:
      "Intermédiaires : les nom et prénom de contact sont obligatoires"
  }),
  vatNumber: z
    .string()
    .nullish()
    .refine(vat => !vat || (isVat(vat) && isFRVat(vat)), {
      message: "Intermédiaires : seul les numéros de TVA en France sont valides"
    }),
  address: z.string({
    required_error:
      "Intermédiaires : l'adresse de l'établissement est obligatoire"
  }), // should be auto-completed through sirenify
  name: z.string({
    required_error:
      "Intermédiaires : la raison sociale de l'établissement est obligatoire"
  }), // should be auto-completed through sirenify
  phone: z.string().nullish(),
  mail: z.string().nullish()
});

export function intermediariesRefinement(
  intermediaries: z.infer<typeof intermediarySchema>[] | null | undefined,
  ctx: RefinementCtx
) {
  if (!intermediaries || intermediaries.length === 0) {
    return;
  }

  if (intermediaries.length > 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["intermediaries"],
      message: "Intermédiaires: impossible d'ajouter plus de 3 intermédiaires",
      fatal: true
    });
    return z.NEVER;
  }

  const intermediaryIdentifiers = intermediaries.map(
    c => c.siret || c.vatNumber
  );
  if (intermediaryIdentifiers.some(orgId => !orgId)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["intermediaries"],
      message: "Intermédiaires: Un SIRET ou numéro de TVA est obligatoire",
      fatal: true
    });
  }
  const hasDuplicate =
    new Set(intermediaryIdentifiers).size !== intermediaryIdentifiers.length;
  if (hasDuplicate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["intermediaries"],
      message:
        "Intermédiaires: impossible d'ajouter le même établissement en intermédiaire plusieurs fois",
      fatal: true
    });
    return z.NEVER;
  }
}
