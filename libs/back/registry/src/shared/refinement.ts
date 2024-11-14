import { isSiret } from "@td/constants";
import { checkVAT, countries } from "jsvat";
import { Refinement, z } from "zod";

export function refineActorOrgId<T>({
  typeKey,
  orgIdKey
}: {
  typeKey: string;
  orgIdKey: string;
}): Refinement<T> {
  return (item, { addIssue }) => {
    const type:
      | "ENTREPRISE_FR"
      | "ENTREPRISE_UE"
      | "ENTREPRISE_HORS_UE"
      | "ASSOCIATION"
      | "PERSONNE_PHYSIQUE"
      | "COMMUNES" = item[typeKey];
    const orgId: string = item[orgIdKey];

    switch (type) {
      case "ENTREPRISE_FR": {
        if (!isSiret(orgId)) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message: "Le SIRET du destinataire n'est pas un SIRET valide.",
            path: [orgIdKey]
          });
        }
        break;
      }
      case "ENTREPRISE_UE": {
        const { isValid } = checkVAT(orgId, countries);
        if (!isValid) {
          addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Le numéro d'identification du destinataire doit faire entre 3 et 27 caractères pour une entreprise Européenne. Il commence par 2 lettres majuscules et est suivi de chiffres.",
            path: [orgIdKey]
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
        break;
      }
      default:
        throw new Error("Unhandled destination type");
    }
  };
}
