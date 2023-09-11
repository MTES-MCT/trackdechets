import { checkVAT } from "jsvat";
import prisma from "../prisma";
import redundantCachedSearchSirene from "./sirene/searchCompany";
import decoratedSearchCompanies from "./sirene/searchCompanies";
import { CompanySearchResult } from "./types";
import { searchVat } from "./vat";
import { convertUrls } from "./database";
import {
  isSiret,
  isVat,
  isFRVat,
  TEST_COMPANY_PREFIX,
  countries,
  cleanClue,
  isForeignVat
} from "../common/constants/companySearchHelpers";
import { SireneSearchResult } from "./sirene/types";
import { CompanyVatSearchResult } from "./vat/vies/types";
import { AnonymousCompanyError } from "./sirene/errors";
import { removeEmptyKeys } from "../common/converter";
import { UserInputError } from "../common/errors";
import { SearchOptions } from "./sirene/trackdechets/types";

interface SearchCompaniesDeps {
  injectedSearchCompany: (clue: string) => Promise<CompanySearchResult>;
  injectedSearchCompanies: (
    clue: string,
    department?: string | null,
    options?: Partial<SearchOptions>,
    requestOptions?
  ) => Promise<SireneSearchResult[] | null>;
}

const SIRET_OR_VAT_ERROR =
  "Il est obligatoire de rechercher soit avec un SIRET de 14 caractères soit avec un numéro de TVA intracommunautaire valide";

/**
 * Search database and merge with company info from search engines
 */
async function findCompanyAndMergeInfos(
  cleanClue: string,
  companyInfo: SireneSearchResult | CompanyVatSearchResult | null
): Promise<CompanySearchResult> {
  const where = {
    where: { orgId: cleanClue }
  };
  const trackdechetsCompanyInfo = await prisma.company.findUnique({
    ...where,
    select: {
      id: true,
      orgId: true,
      siret: true,
      name: true,
      address: true,
      vatNumber: true,
      companyTypes: true,
      contact: true,
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
    trackdechetsId: trackdechetsCompanyInfo?.id,
    companyTypes: trackdechetsCompanyInfo?.companyTypes ?? [],
    orgId: cleanClue,
    ...(trackdechetsCompanyInfo != null && {
      ...convertUrls(trackdechetsCompanyInfo)
    }),
    // override database infos with Sirene or VAT search
    ...companyInfo
  };
}

/**
 * Common Company search unique by orgId
 * Search by SIRET or VAT number
 * Supports Test SIRET and AnonymousCompany
 */
export async function searchCompany(
  clue: string
): Promise<CompanySearchResult> {
  // remove non alphanumeric
  const cleanedClue = cleanClue(clue);
  const allowTestCompany = process.env.ALLOW_TEST_COMPANY === "true";
  const isTestCompany =
    allowTestCompany && cleanedClue.startsWith(TEST_COMPANY_PREFIX);

  // fail fast for bad input
  if (
    !cleanedClue ||
    (!isSiret(cleanedClue, allowTestCompany) &&
      !isVat(cleanedClue) &&
      !isTestCompany)
  ) {
    throw new UserInputError(SIRET_OR_VAT_ERROR, {
      invalidArgs: ["siret", "clue"]
    });
  }
  // search for test or anonymous companies first
  const anonymousCompany = await prisma.anonymousCompany.findUnique({
    where: {
      orgId: cleanedClue
    }
  });
  // Anonymous Company search by-pass SIRENE or VAT search
  if (anonymousCompany) {
    const companyInfo: SireneSearchResult = {
      ...removeEmptyKeys(anonymousCompany),
      statutDiffusionEtablissement: cleanedClue.startsWith(TEST_COMPANY_PREFIX)
        ? "O"
        : "N",
      etatAdministratif: "A",
      naf: anonymousCompany.codeNaf,
      codePaysEtrangerEtablissement: "FR"
    };
    return findCompanyAndMergeInfos(cleanedClue, companyInfo);
  } else if (isTestCompany) {
    // 404 if we are in a test environment with a test siret starting with 00000
    throw new UserInputError("Aucun établissement trouvé avec ce SIRET", {
      invalidArgs: ["siret", "clue"]
    });
  }
  // Search public company databases
  if (isSiret(cleanedClue)) {
    const companyInfo = await searchSireneOrNotFound(cleanedClue);
    return findCompanyAndMergeInfos(cleanedClue, companyInfo);
  }

  // Search by VAT number first in our db, inder to to optimize response times
  if (isVat(cleanedClue)) {
    const company = await findCompanyAndMergeInfos(cleanedClue, {});
    if (company.isRegistered === true) {
      // shorcut to return the result directly from database without hitting VIES
      const { country } = checkVAT(cleanedClue, countries);
      if (country) {
        return {
          codePaysEtrangerEtablissement: country.isoCode.short,
          statutDiffusionEtablissement: "O",
          etatAdministratif: "A",
          vatNumber: cleanedClue,
          ...company
        };
      }
    }
    const companyInfo = await searchVatFrOnlyOrNotFound(cleanedClue);
    return {
      ...company,
      ...companyInfo
    };
  }

  throw new UserInputError("Aucun établissement trouvé", {
    invalidArgs: ["siret", "clue"]
  });
}

// used for dependency injection in tests to easily mock `searchCompany`
export const makeSearchCompanies =
  ({ injectedSearchCompany, injectedSearchCompanies }: SearchCompaniesDeps) =>
  (
    clue: string,
    department?: string | null,
    allowForeignCompanies?: boolean | null
  ): Promise<CompanySearchResult[]> => {
    const cleanedClue = cleanClue(clue);
    // clue can be formatted like a SIRET or a VAT number
    if (isSiret(cleanedClue) || isVat(cleanedClue)) {
      if (isForeignVat(cleanedClue) && allowForeignCompanies === false) {
        return Promise.resolve([]);
      }
      return injectedSearchCompany(cleanedClue)
        .then(c => {
          return (
            [c]
              // Exclude closed companies
              .filter(c => c.etatAdministratif && c.etatAdministratif === "A")
              // Exclude anonymous company not registered in TD
              .filter(
                c => c.statutDiffusionEtablissement !== "N" || c.isRegistered
              )
          );
        })
        .catch(_ => []);
    }
    // fuzzy searching only for French companies
    return injectedSearchCompanies(clue, department).then(async results => {
      if (!results) {
        return [];
      }

      return results.map(company => ({
        ...company,
        orgId: company.siret!
      }));
    });
  };

/**
 * Search Sirene and handle anonymous companies
 */
async function searchSireneOrNotFound(
  siret: string
): Promise<SireneSearchResult | null> {
  try {
    return await redundantCachedSearchSirene(siret);
  } catch (err) {
    // The SIRET was not found in public data
    // Try searching the anonymous companies
    const anonymousCompany = await prisma.anonymousCompany.findUnique({
      where: { siret }
    });
    if (anonymousCompany) {
      return {
        ...removeEmptyKeys(anonymousCompany),
        // required to avoid leaking anonymous data to the public
        statutDiffusionEtablissement: "N",
        etatAdministratif: "A",
        naf: anonymousCompany.codeNaf,
        codePaysEtrangerEtablissement: "FR"
      };
    } else if (err instanceof AnonymousCompanyError) {
      // And it's finally an anonymous that is not found in AnonymousCompany
      return {
        etatAdministratif: "A",
        siret,
        statutDiffusionEtablissement: "N"
      } as SireneSearchResult;
    }

    throw err;
  }
}

interface PartialCompanyVatSearchResult
  extends Pick<
    CompanyVatSearchResult,
    | "vatNumber"
    | "codePaysEtrangerEtablissement"
    | "statutDiffusionEtablissement"
    | "etatAdministratif"
  > {
  name?: string;
  address?: string;
}

/**
 * Search VAT with the VIES client eventually strpping empty/anonymous name and addresses
 */
async function searchVatFrOnlyOrNotFound(
  vatNumber: string
): Promise<PartialCompanyVatSearchResult | null> {
  if (isFRVat(vatNumber)) {
    throw new UserInputError(
      "Une entreprise française doit être identifiée par son SIRET et pas par sa TVA intracommunautaire",
      {
        invalidArgs: ["clue"]
      }
    );
  }
  // throws UserInputError if not found
  const viesResult: PartialCompanyVatSearchResult | null = await searchVat(
    vatNumber
  );
  // delete name and adresse if === ""
  // in order to avoid db name and adresse to be replaced with empty string from the VIES api
  if (viesResult && viesResult.name === "") delete viesResult.name;
  if (viesResult && viesResult.address === "") delete viesResult.address;
  return viesResult;
}

export const searchCompanies = makeSearchCompanies({
  injectedSearchCompany: searchCompany,
  injectedSearchCompanies: decoratedSearchCompanies
});
