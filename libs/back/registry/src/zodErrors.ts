import { z } from "zod";

export const registryErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_type) {
    if (
      issue.received === z.ZodParsedType.undefined ||
      issue.received === z.ZodParsedType.null
    ) {
      return { message: "Champ requis" };
    } else if (issue.received === z.ZodParsedType.nan) {
      return { message: "Champ requis. La valeur doit être un nombre" };
    } else {
      return {
        message: `Une valeur de type "${issue.expected}" était attendue, reçu "${issue.received}"`
      };
    }
  }

  if (issue.code === z.ZodIssueCode.invalid_enum_value) {
    if (issue.options.length <= 3) {
      return {
        message: `La valeur "${
          ctx.data
        }" ne fait pas partie des valeurs autorisées. Veuillez saisir une des valeurs suivantes: ${issue.options
          .map(o => `"${o}"`)
          .join(", ")}`
      };
    }
    return {
      message: `La valeur "${ctx.data}" ne fait pas partie des valeurs autorisées. Veuillez vous référer à la documentation pour la liste des valeurs possibles`
    };
  }

  if (issue.code === z.ZodIssueCode.invalid_date) {
    return {
      message:
        "Le format de date est invalide. Exemples de formats possibles: 2000-01-01T00:00:00.000Z, 2000-01-01T00:00:00.000, 2000-01-01"
    };
  }

  if (issue.code === z.ZodIssueCode.invalid_union) {
    return {
      message: issue.unionErrors[0].issues[0].message // For unions, output the first error message
    };
  }

  return { message: ctx.defaultError };
};
