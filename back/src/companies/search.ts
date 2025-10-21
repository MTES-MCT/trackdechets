import { checkVAT } from "jsvat";
import { prisma } from "@td/prisma";
import redundantCachedSearchSirene from "./sirene/searchCompany";
import decoratedSearchCompanies from "./sirene/searchCompanies";
import { searchVat } from "./vat";
import {
  isSiret,
  isVat,
  isFRVat,
  TEST_COMPANY_PREFIX,
  countries,
  cleanClue,
  isForeignVat,
  isAnonymousCompany
} from "@td/constants";
import { SireneSearchResult } from "./sirene/types";
import { CompanyVatSearchResult } from "./vat/vies/types";
import { removeEmptyKeys } from "../common/converter";
import { UserInputError } from "../common/errors";
import { SearchOptions } from "./sirene/trackdechets/types";
import { Company } from "@prisma/client";
import type { CompanySearchResult } from "@td/codegen-back";
import { ViesClientError } from "./vat/vies/client";

interface SearchCompaniesDeps {
  injectedSearchCompany: (clue: string) => Promise<CompanySearchResult>;
  injectedSearchCompanies: (
    clue: string,
    department?: string | null,
    allowClosedCompanies?: boolean | null,
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
  wasteProcessorTypes: trackdechetsCompanyInfo?.wasteProcessorTypes ?? [],
  collectorTypes: trackdechetsCompanyInfo?.collectorTypes ?? [],
  wasteVehiclesTypes: trackdechetsCompanyInfo?.wasteVehiclesTypes ?? [],
  contact: trackdechetsCompanyInfo?.contact,
  contactEmail: trackdechetsCompanyInfo?.contactEmail,
  contactPhone: trackdechetsCompanyInfo?.contactPhone,
  website: trackdechetsCompanyInfo?.website,
  ecoOrganismeAgreements:
    trackdechetsCompanyInfo?.ecoOrganismeAgreements?.map(a => new URL(a)) ?? [],
  ecoOrganismePartnersIds:
    trackdechetsCompanyInfo?.ecoOrganismePartnersIds ?? [],
  allowBsdasriTakeOverWithoutSignature:
    trackdechetsCompanyInfo?.allowBsdasriTakeOverWithoutSignature,
  // specific data for CompanySearchResult
  isRegistered: trackdechetsCompanyInfo != null,
  trackdechetsId: trackdechetsCompanyInfo?.id,
  isDormant: trackdechetsCompanyInfo?.isDormantSince != null,
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
  collectorTypes: true,
  wasteProcessorTypes: true,
  wasteVehiclesTypes: true,
  contact: true,
  contactEmail: true,
  contactPhone: true,
  website: true,
  ecoOrganismeAgreements: true,
  allowBsdasriTakeOverWithoutSignature: true,
  isDormantSince: true
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
  const cleanedClue = cleanClue(clue);
  const isTestCompanyClue = cleanedClue.startsWith(TEST_COMPANY_PREFIX);

  const validClue = isSiret(cleanedClue) || isVat(cleanedClue);
  if (!validClue) {
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
  if (anonymousCompany) {
    let codePaysEtrangerEtablissement = "FR";
    if (isForeignVat(cleanedClue)) {
      const { country } = checkVAT(cleanedClue, countries);
      if (country) {
        codePaysEtrangerEtablissement = country.isoCode.short;
      }
    }

    const companyInfo: SireneSearchResult = {
      ...removeEmptyKeys(anonymousCompany),
      statutDiffusionEtablissement: isTestCompanyClue ? "O" : "P",
      etatAdministratif: anonymousCompany.etatAdministratif,
      naf: anonymousCompany.codeNaf,
      codePaysEtrangerEtablissement,
      ...(isTestCompanyClue && {
        codeCommune: "00000",
        addressCity: "Ville de test",
        addressPostalCode: "00000",
        addressVoie: "Adresse de test"
      })
    };
    return findCompanyAndMergeInfos(cleanedClue, companyInfo);
  }

  // If it's a test company but not registered as an anonymous company, fail fast
  if (isTestCompanyClue) {
    throw new UserInputError("Aucun établissement trouvé avec ce SIRET", {
      invalidArgs: ["siret", "clue"]
    });
  }

  if (isSiret(cleanedClue)) {
    const companyInfo = await searchSireneOrNotFound(cleanedClue);
    return findCompanyAndMergeInfos(cleanedClue, companyInfo);
  }

  // Search by VAT number first in our db, in order to optimize response times
  if (isVat(cleanedClue)) {
    const company = await findCompanyAndMergeInfos(cleanedClue, null);
    if (company.isRegistered === true) {
      // shortcut to return the result directly from database without hitting VIES
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
    const companyInfo = await searchByVatNumber(cleanedClue);
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
  async (
    clue: string,
    department?: string | null,
    allowForeignCompanies?: boolean | null,
    allowClosedCompanies: boolean | null = true
  ): Promise<CompanySearchResult[]> => {
    // For a SIRET or VAT number, we dont fuzzy search.
    // We also accept a coma separated list of SIRET or VAT numbers
    const identifiersClues = clue.split(",").map(cleanClue);
    if (
      identifiersClues.every(
        cleanClue => isSiret(cleanClue) || isVat(cleanClue)
      )
    ) {
      const searchResults = await Promise.all(
        identifiersClues
          .filter(
            cleanClue => allowForeignCompanies || !isForeignVat(cleanClue)
          )
          .map(cleanClue =>
            injectedSearchCompany(cleanClue).catch(err => {
              if (err instanceof ViesClientError) {
                throw err;
              }
              return null;
            })
          )
      );

      return searchResults
        .filter(Boolean)
        .filter(
          company => allowClosedCompanies || company.etatAdministratif === "A"
        );
    }

    // /!\ Fuzzy searching can only return French companies
    const inseeResults = await injectedSearchCompanies(
      clue,
      department,
      allowClosedCompanies
    );
    if (!inseeResults) {
      return [];
    }
    const orgIds = inseeResults.map(r => r.siret as string);
    const companiesInDb = await prisma.company.findMany({
      where: {
        orgId: { in: orgIds }
      },
      select: companySelectedFields
    });

    return inseeResults.map(searchResult => {
      const tdCompany = companiesInDb.find(
        company => company.orgId === searchResult.siret
      );
      if (tdCompany) {
        return mergeCompanyToCompanySearchResult(
          searchResult.siret!,
          tdCompany,
          searchResult
        );
      }

      return {
        ...searchResult,
        orgId: searchResult.siret!,
        isRegistered: false,
        isDormant: false,
        ecoOrganismePartnersIds: []
      };
    });
  };

/**
 * Search Sirene and handle anonymous companies
 */
export async function searchSireneOrNotFound(
  siret: string
): Promise<SireneSearchResult | null> {
  try {
    const searchResult = await redundantCachedSearchSirene(siret);

    if (isAnonymousCompany(searchResult)) {
      return {
        etatAdministratif: searchResult?.etatAdministratif,
        siret,
        statutDiffusionEtablissement: "P"
      } as SireneSearchResult;
    }

    return searchResult;
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
        statutDiffusionEtablissement: "P",
        etatAdministratif: "A",
        naf: anonymousCompany.codeNaf,
        codePaysEtrangerEtablissement: "FR"
      };
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
async function searchByVatNumber(
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
  if (viesResult?.name === "") delete viesResult.name;
  if (viesResult?.address === "") delete viesResult.address;
  return viesResult;
}

/**
 * Narrow search for companies via VIES EU VAT service
 * @param vatNumber
 * @returns
 */
export async function searchByVatNumberOrNotFoundFailFast(
  vatNumber: string
): Promise<PartialCompanyVatSearchResult | null> {
  // make sure we do not wait more thant 1s here to avoid bottlenecks
  const raceWith = new Promise<null>(resolve =>
    setTimeout(resolve, 1000, null)
  );

  return await Promise.race([searchByVatNumber(vatNumber), raceWith]);
}

export const searchCompanies = makeSearchCompanies({
  injectedSearchCompany: searchCompany,
  injectedSearchCompanies: decoratedSearchCompanies
});
