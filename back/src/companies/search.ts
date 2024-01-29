import { checkVAT } from "jsvat";
import { prisma } from "@td/prisma";
import redundantCachedSearchSirene from "./sirene/searchCompany";
import decoratedSearchCompanies from "./sirene/searchCompanies";
import { CompanySearchResult } from "./types";
import { searchVat } from "./vat";
import {
  isSiret,
  isVat,
  isFRVat,
  TEST_COMPANY_PREFIX,
  countries,
  cleanClue,
  isForeignVat
} from "@td/constants";
import { SireneSearchResult } from "./sirene/types";
import { CompanyVatSearchResult } from "./vat/vies/types";
import { AnonymousCompanyError } from "./sirene/errors";
import { removeEmptyKeys } from "../common/converter";
import { UserInputError } from "../common/errors";
import { SearchOptions } from "./sirene/trackdechets/types";
import { Company } from "@prisma/client";
import { StatutDiffusionEtablissement } from "../generated/graphql/types";
import { ViesClientError } from "./vat/vies/client";

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

export const mergeCompanyToCompanySearchResult = (
  orgId: string,
  trackdechetsCompanyInfo: Partial<Company> | null,
  companyInfo: SireneSearchResult | CompanyVatSearchResult | null
): CompanySearchResult => ({
  orgId,
  // expose only some of db Company
  siret: trackdechetsCompanyInfo?.siret,
  name: trackdechetsCompanyInfo?.name,
  address: trackdechetsCompanyInfo?.address,
  vatNumber: trackdechetsCompanyInfo?.vatNumber,
  companyTypes: trackdechetsCompanyInfo?.companyTypes ?? [],
  contact: trackdechetsCompanyInfo?.contact,
  contactEmail: trackdechetsCompanyInfo?.contactEmail,
  contactPhone: trackdechetsCompanyInfo?.contactPhone,
  website: trackdechetsCompanyInfo?.website,
  ecoOrganismeAgreements:
    trackdechetsCompanyInfo?.ecoOrganismeAgreements?.map(a => new URL(a)) ?? [],
  allowBsdasriTakeOverWithoutSignature:
    trackdechetsCompanyInfo?.allowBsdasriTakeOverWithoutSignature,
  // specific data for CompanySearchResult
  isRegistered: trackdechetsCompanyInfo != null,
  trackdechetsId: trackdechetsCompanyInfo?.id,
  // override database infos with Sirene or VAT search
  ...companyInfo
});

const companySelectedFields = {
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
};

/**
 * Search database and merge with company info from search engines
 */
async function findCompanyAndMergeInfos(
  orgId: string,
  companyInfo: SireneSearchResult | CompanyVatSearchResult | null
): Promise<CompanySearchResult> {
  const where = {
    where: { orgId }
  };

  const trackdechetsCompanyInfo = await prisma.company.findUnique({
    ...where,
    select: companySelectedFields
  });
  return mergeCompanyToCompanySearchResult(
    orgId,
    trackdechetsCompanyInfo,
    companyInfo
  );
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
        : ("P" as StatutDiffusionEtablissement),
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
    const company = await findCompanyAndMergeInfos(cleanedClue, null);
    if (company.isRegistered === true) {
      // shorcut to return the result directly from database without hitting VIES
      const { country } = checkVAT(cleanedClue, countries);
      if (country) {
        return {
          codePaysEtrangerEtablissement: country.isoCode.short,
          statutDiffusionEtablissement: "O",
          etatAdministratif: "A",
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
          );
        })
        .catch(err => {
          if (err instanceof ViesClientError) {
            throw err;
          } else {
            return [];
          }
        });
    }
    // fuzzy searching only for French companies
    return injectedSearchCompanies(clue, department).then(
      async resultsInsee => {
        if (!resultsInsee) {
          return [];
        }
        const orgIds = resultsInsee.map(r => r.siret as string);
        // Initialize an object with all orgIds set to null
        const companies = orgIds.reduce((acc, id) => {
          acc[id] = null;
          return acc;
        }, {} as { [key: number]: any | null });
        // Find all existing Companies in DB
        const companiesInDb = await prisma.company.findMany({
          where: {
            orgId: { in: orgIds }
          },
          select: companySelectedFields
        });
        // Populate the object with the fetched organizations
        companiesInDb.forEach(org => {
          companies[org.orgId] = org;
        });

        return resultsInsee.map(companyInsee => ({
          ...(companies[companyInsee.siret!]
            ? mergeCompanyToCompanySearchResult(
                companyInsee.siret!,
                companies[companyInsee.siret!],
                companyInsee
              )
            : {
                ...companyInsee,
                orgId: companyInsee.siret!,
                isRegistered: false
              })
        }));
      }
    );
  };

/**
 * Search Sirene and handle anonymous companies
 */
export async function searchSireneOrNotFound(
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
        statutDiffusionEtablissement: "P" as StatutDiffusionEtablissement,
        etatAdministratif: "A",
        naf: anonymousCompany.codeNaf,
        codePaysEtrangerEtablissement: "FR"
      };
    } else if (err instanceof AnonymousCompanyError) {
      // And it's finally an anonymous that is not found in AnonymousCompany
      return {
        etatAdministratif: "A",
        siret,
        statutDiffusionEtablissement: "P" as StatutDiffusionEtablissement
      } as SireneSearchResult;
    }

    throw err;
  }
}

export interface PartialCompanyVatSearchResult
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

/**
 * Narrow search for companies via VIES EU VAT service
 * @param vatNumber
 * @returns
 */
export async function searchVatFrOnlyOrNotFoundFailFast(
  vatNumber: string
): Promise<PartialCompanyVatSearchResult | null> {
  // make sure we do not wait more thant 1s here to avoid bottlenecks
  const raceWith = new Promise<null>(resolve =>
    setTimeout(resolve, 1000, null)
  );

  return await Promise.race([searchVatFrOnlyOrNotFound(vatNumber), raceWith]);
}

export const searchCompanies = makeSearchCompanies({
  injectedSearchCompany: searchCompany,
  injectedSearchCompanies: decoratedSearchCompanies
});
