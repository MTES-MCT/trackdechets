import { RefinementCtx, z } from "zod";
import { isFRVat, isVat } from "../constants/companySearchHelpers";
import { siretSchema } from "./siret";

export const intermediarySchema = z.object({
  siret: siretSchema,
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
  mail: z.string().nullish(),
  country: z.string().nullish(), // is ignored in db schema
  omiNumber: z.string().nullish(), // is ignored in db schema
  orgId: z.string().nullish() // is ignored in db schema
});

export async function intermediariesRefinement(
  intermediaries: z.infer<typeof intermediarySchema>[] | null | undefined,
  ctx: RefinementCtx
) {
  if (!intermediaries || intermediaries.length === 0) {
    return;
  }

  if (intermediaries.length > 3) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Intermédiaires: impossible d'ajouter plus de 3 intermédiaires",
      fatal: true
    });
    return z.NEVER;
  }

  const intermediaryIdentifiers = intermediaries.map(
    c => c.siret || c.vatNumber
  );
  const hasDuplicate =
    new Set(intermediaryIdentifiers).size !== intermediaryIdentifiers.length;
  if (hasDuplicate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "Intermédiaires: impossible d'ajouter le même établissement en intermédiaire plusieurs fois",
      fatal: true
    });
    return z.NEVER;
  }
}
