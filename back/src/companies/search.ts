import prisma from "../prisma";
import decoratedSearchCompany from "./sirene/searchCompany";
import decoratedSearchCompanies from "./sirene/searchCompanies";
import { UserInputError } from "apollo-server-express";
import { CompanySearchResult } from "./types";
import { searchVat } from "./vat";
import { convertUrls, getInstallation } from "./database";
import {
  isSiret,
  isVat,
  isFRVat
} from "../common/constants/companySearchHelpers";

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
  // Pre-validate VAT without querying searchVat(VIES)
  const isValidVat = isVat(cleanClue);
  const isValidSiret = isSiret(cleanClue);

  if (!isValidSiret && !isValidVat) {
    throw new UserInputError(SIRET_OR_VAT_ERROR, {
      invalidArgs: ["clue"]
    });
  }

  let companyInfo: Partial<CompanySearchResult> = {};
  if (isValidSiret) {
    try {
      companyInfo = {
        ...companyInfo,
        ...(await decoratedSearchCompany(cleanClue))
      };
    } catch (err) {
      // The SIRET was not found in public data
      // Try searching the companies with restricted access
      const anonymousCompany = await prisma.anonymousCompany.findUnique({
        where: { siret: clue }
      });
      if (anonymousCompany) {
        return {
          ...anonymousCompany,
          etatAdministratif: "A",
          naf: anonymousCompany.codeNaf,
          addressVoie: "",
          addressCity: "",
          addressPostalCode: "",
          isRegistered: true
        };
      }
      throw err;
    }
  } else if (isValidVat) {
    if (isFRVat(cleanClue)) {
      throw new UserInputError(
        "Une entreprise française doit être identifiée par son SIRET et pas par sa TVA intracommunautaire",
        {
          invalidArgs: ["clue"]
        }
      );
    }
    // retrieve info from VIES API or throws an error
    companyInfo = {
      ...companyInfo,
      ...(await searchVat(cleanClue))
    };
  }
  // retrieves trackdechets public CompanyInfo
  // it might be null if the company is not registered in TD
  const where = {
    ...(isValidSiret && { where: { siret: cleanClue } }),
    ...(isValidVat && { where: { vatNumber: cleanClue } })
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

  const isRegistered = !!trackdechetsCompanyInfo;
  const companyIcpeInfo = {
    installation: await getInstallation(cleanClue)
  };

  if (!companyInfo.siret && isValidSiret) {
    throw new UserInputError("Cet établissement n'existe pas", {
      invalidArgs: ["clue"]
    });
  }

  if (!companyInfo.vatNumber && isValidVat) {
    throw new UserInputError(
      "Ce numéro de TVA intracommunautaire n'existe pas. Veuillez nous contacter à l'adresse hello@trackdechets.beta.gouv.fr avec un justificatif légal du pays d'origine.",
      {
        invalidArgs: ["clue"]
      }
    );
  }

  return {
    // ensure compatibility with CompanyPublic
    ecoOrganismeAgreements: [],
    ...companyIcpeInfo,
    ...companyInfo,
    ...convertUrls({
      ...trackdechetsCompanyInfo,
      // ensure compatibility with CompanyPublic
      companyTypes: isRegistered ? trackdechetsCompanyInfo.companyTypes : []
    }),
    isRegistered
  } as CompanySearchResult;
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
