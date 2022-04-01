import prisma from "../prisma";
import decoratedSearchCompany from "./sirene/searchCompany";
import decoratedSearchCompanies from "./sirene/searchCompanies";
import { UserInputError } from "apollo-server-express";
import { CompanySearchResult } from "./types";
import { searchVat } from "./vat";
import { convertUrls } from "./database";
import {
  isSiret,
  isVat,
  isFRVat
} from "../common/constants/companySearchHelpers";
import { SireneSearchResult } from "./sirene/types";
import { CompanyVatSearchResult } from "./vat/vies/types";

const SIRET_OR_VAT_ERROR =
  "Il est obligatoire de rechercher soit avec un SIRET de 14 caractères soit avec un numéro de TVA intracommunautaire valide";

/**
 * Search one company by SIRET or VAT number
 */
export async function searchCompany(
  clue: string
): Promise<CompanySearchResult> {
  // remove whitespaces
  const cleanClue = clue.replace(/\s/g, "").toUpperCase();
  if (!cleanClue) {
    throw new UserInputError(SIRET_OR_VAT_ERROR, {
      invalidArgs: ["clue"]
    });
  }

  const companyInfo = await getCompanyInfo(cleanClue);

  // retrieves trackdechets public CompanyInfo
  // it might be null if the company is not registered in TD
  const where = {
    ...(isSiret(cleanClue) && { where: { siret: cleanClue } }),
    ...(isVat(cleanClue) && { where: { vatNumber: cleanClue } })
  };
  const trackdechetsCompanyInfo = await prisma.company.findUnique({
    ...where,
    select: {
      id: true,
      siret: true,
      vatNumber: true,
      companyTypes: true,
      contactEmail: true,
      contactPhone: true,
      website: true,
      ecoOrganismeAgreements: true,
      allowBsdasriTakeOverWithoutSignature: true
    }
  });

  return {
    // ensure compatibility with CompanyPublic
    ecoOrganismeAgreements: [],
    isRegistered: trackdechetsCompanyInfo != null,
    companyTypes: trackdechetsCompanyInfo?.companyTypes ?? [],
    ...companyInfo,
    ...convertUrls(trackdechetsCompanyInfo)
  };
}

interface SearchCompaniesDeps {
  searchCompany: (clue: string) => Promise<CompanySearchResult>;
}

export const makeSearchCompanies =
  ({ searchCompany }: SearchCompaniesDeps) =>
  (clue: string, department?: string) => {
    // clue can be formatted like a SIRET or a VAT number
    // but we don't want to search  for VAT numbers
    if (isSiret(clue)) {
      return searchCompany(clue)
        .then(c =>
          // Exclude closed companies
          [c].filter(c => c.etatAdministratif && c.etatAdministratif === "A")
        )
        .catch(_ => []);
    }
    return decoratedSearchCompanies(clue, department);
  };

// use dependency injection here to easily mock `searchCompany`
// in index.test.ts
export const searchCompanies = makeSearchCompanies({ searchCompany });

function getCompanyInfo(
  clue: string
): Promise<SireneSearchResult | CompanyVatSearchResult> {
  if (isSiret(clue)) return getSiretCompanyInfo(clue);
  if (isVat(clue)) return getVatCompanyInfo(clue);

  throw new UserInputError(SIRET_OR_VAT_ERROR, {
    invalidArgs: ["clue"]
  });
}

async function getSiretCompanyInfo(siret: string): Promise<SireneSearchResult> {
  try {
    return await decoratedSearchCompany(siret);
  } catch (err) {
    // The SIRET was not found in public data
    // Try searching the companies with restricted access
    const anonymousCompany = await prisma.anonymousCompany.findUnique({
      where: { siret }
    });
    if (anonymousCompany) {
      return {
        ...anonymousCompany,
        etatAdministratif: "A",
        naf: anonymousCompany.codeNaf
      };
    }
    throw err;
  }
}

function getVatCompanyInfo(vatNumber: string): Promise<CompanyVatSearchResult> {
  if (isFRVat(vatNumber)) {
    throw new UserInputError(
      "Une entreprise française doit être identifiée par son SIRET et pas par sa TVA intracommunautaire",
      {
        invalidArgs: ["clue"]
      }
    );
  }

  return searchVat(vatNumber);
}
