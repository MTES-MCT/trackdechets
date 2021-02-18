import prisma from "../../prisma";
import { CompanySearchResult } from "./types";

/**
 * "Certaines entreprises demandent à ne pas figurer sur les listes de diffusion publique
 * en vertu de l'article A123-96 du code du commerce. On parle d‘entreprise non diffusable.
 * Dans ce cas les API SIRENE ne diffusent pas les informations de cette entreprise dans
 * les résultats de recherche. Pour des raisons de sécurité, certaines associations et les
 * organismes relevant du Ministère de la Défense ne sont pas diffusibles non plus."
 *
 * This function looks into the table AnonymousCompany where we store anonymous SIRENE records
 * @param siret
 */
export async function searchAnonymousCompany(
  siret: string
): Promise<CompanySearchResult> {
  const company = await prisma.anonymousCompany.findUnique({
    where: { siret }
  });
  if (company) {
    return {
      ...company,
      etatAdministratif: "A",
      naf: company.codeNaf,
      addressVoie: "",
      addressCity: "",
      addressPostalCode: ""
    };
  }
  return null;
}
