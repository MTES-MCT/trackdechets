import { isSiret } from "@td/constants";
import { checkVAT, countries } from "jsvat";
import { Refinement, z } from "zod";

export function refineActorOrgId<T>({
  typeKey,
  orgIdKey,
  countryKey
}: {
  typeKey: string;
  orgIdKey: string;
  countryKey?: string;
}): Refinement<T> {
  return (item, { addIssue }) => {
    const type:
      | "ENTREPRISE_FR"
      | "ENTREPRISE_UE"
      | "ENTREPRISE_HORS_UE"
      | "ASSOCIATION"
      | "PERSONNE_PHYSIQUE"
      | "COMMUNE" = item[typeKey];
    const orgId: string = item[orgIdKey];
    const inputCountry: string | undefined = countryKey
      ? item[countryKey]
      : undefined;

    switch (type) {
      case "ENTREPRISE_FR": {
        if (!isSiret(orgId)) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le SIRET du destinataire n'est pas un SIRET valide.",
            path: [orgIdKey]
          });
        }

        if (countryKey && inputCountry && inputCountry !== "FR") {
          addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le code pays doit être FR pour une entreprise française",
            path: [countryKey]
          });
        }
        break;
      }
      case "ENTREPRISE_UE": {
        const { isValid, country } = checkVAT(orgId, countries);
        if (!isValid) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Le numéro de TVA du destinataire n'est pas valide. Il commence par 2 lettres majuscules, est suivi de chiffres et doit respecter les contraintes du pays concerné",
            path: [orgIdKey]
          });
        }

        if (
          country &&
          countryKey &&
          inputCountry &&
          country.isoCode.short !== inputCountry
        ) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Le code pays ne correspond pas au code pays de la TVA saisie",
            path: [countryKey]
          });
        }
        break;
      }
      case "ENTREPRISE_HORS_UE": {
        const isOrgIdValidOutOfUe = orgId && /[A-Z0-9]{1,25}/.test(orgId);
        if (!isOrgIdValidOutOfUe) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Le numéro d'identification du destinataire doit faire entre 1 et 25 caractères pour une entreprise hors UE. Il est composé de lettres majuscules et de chiffres.",
            path: [orgIdKey]
          });
        }
        break;
      }
      case "ASSOCIATION": {
        const isOrgIdValidAssociation = orgId && /W[0-9]{9}/.test(orgId);
        if (!isOrgIdValidAssociation) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Le numéro d'identification du destinataire doit faire 10 caractères pour une assoxiation. Il commence par un W suivi de 9 chiffres.",
            path: [orgIdKey]
          });
        }

        if (countryKey && inputCountry && inputCountry !== "FR") {
          addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le code pays doit être FR pour une association française",
            path: [countryKey]
          });
        }
        break;
      }
      default:
        throw new Error("Unhandled destination type");
    }
  };
}
