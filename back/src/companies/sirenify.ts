import { AuthType } from "../auth";
import { UserInputError } from "../common/errors";
import { searchCompany } from "../companies/search";
import {
  CompanySearchResult,
  CompanyInput,
  StatutDiffusionEtablissement
} from "@td/codegen-back";
import { logger } from "@td/logger";
import { escapeRegExp } from "../utils";
import { SireneSearchResult } from "./sirene/types";
import { searchCompany as searchCompanyTD } from "./sirene/trackdechets/client";

/**
 * List of emails or regular expressions of email of API
 * users who need extra time to adapt to this feature
 */
const SIRENIFY_BYPASS_USER_EMAILS =
  process.env.SIRENIFY_BYPASS_USER_EMAILS?.split(",").map(
    r => new RegExp(escapeRegExp(r))
  ) ?? [];

/**
 * Given a GraphQL BSD input type T,
 * defines a getter and a setter for a nested company input
 */
type CompanyInputAccessor<T> = {
  getter: () => CompanyInput | null | undefined;
  setter: (input: T, companyInput: CompanyInput) => T;
};

export function canBypassSirenify(user: Express.User) {
  return (
    user.auth === AuthType.Session || // data sent from TD UI is considered to be sane
    SIRENIFY_BYPASS_USER_EMAILS.some(r => user.email?.match(r)) // by pass some users
  );
}

/**
 * Generic sirenify function type. It takes a BSD input type T
 * and sets `name` and `address` data  from SIRENE database when a
 * correspondance is found on the n°SIRET, overriding user provided data.
 */
type SirenifyFn<T> = (input: T, user: Express.User) => Promise<T>;

/**
 * Build a concrete implementation of a sirenify function
 */
export default function buildSirenify<T>(
  companyInputAccessors: (input: T) => CompanyInputAccessor<T>[]
): SirenifyFn<T> {
  return async (input, user) => {
    if (user?.auth === AuthType.Session) {
      // data sent from TD UI is considered to be sane
      return input;
    }

    // by pass some users
    for (const r of SIRENIFY_BYPASS_USER_EMAILS) {
      if (user && user.email?.match(r)) {
        return input;
      }
    }

    const accessors = companyInputAccessors(input);

    // retrieves the different companyInput included in the input
    const companyInputs = accessors.map(({ getter }) => getter());

    // check if we found a corresponding companySearchResult based on siret
    const companySearchResults = await Promise.all(
      companyInputs.map(companyInput =>
        companyInput && companyInput.siret
          ? searchCompanyFailFast(companyInput.siret)
          : null
      )
    );

    // make a copy to avoid mutating initial data
    let sirenifiedInput = { ...input };

    companySearchResults.forEach((companySearchResult, idx) => {
      if (companySearchResult) {
        if (companySearchResult.etatAdministratif === "F") {
          throw new UserInputError(
            `L'établissement ${companySearchResult.siret} est fermé selon le répertoire SIRENE`
          );
        }

        if (companySearchResult.isDormant) {
          throw new UserInputError(
            `L'établissement ${companySearchResult.siret} est en sommeil sur Trackdéchets. Il n'est pas possible de le mentionner dans un BSD.`
          );
        }

        if (
          companySearchResult.statutDiffusionEtablissement === "O" ||
          // auto-complète aussi nom et adresse si l'établissement est non diffusible
          // mais inscrit sur Trackdéchets
          companySearchResult.isRegistered
        ) {
          const { setter, getter } = accessors[idx];

          sirenifiedInput = setter(sirenifiedInput, {
            ...getter(), // overwrite user provided data
            name: companySearchResult.name,
            address: companySearchResult.address
          });
        }
      }
    });

    return sirenifiedInput;
  };
}

export type NextCompanyInputAccessor<T> = {
  siret: string | null | undefined;
  skip: boolean;
  setterIfNotFound?: (input: T) => void;
  setter: (
    input: T,
    data: {
      name: string | null | undefined;
      address: string | null | undefined;
      street: string | null | undefined;
      city: string | null | undefined;
      postalCode: string | null | undefined;
    }
  ) => void;
};

export function nextBuildSirenify<T>(
  companyInputAccessors: (
    input: T,
    sealedFields: string[]
  ) => NextCompanyInputAccessor<T>[]
): (input: T, sealedFields: string[]) => Promise<T> {
  return async (input, sealedFields) => {
    const accessors = companyInputAccessors(input, sealedFields);

    // check if we found a corresponding companySearchResult based on siret
    const companySearchResults = await Promise.all(
      accessors.map(({ siret, skip }) => {
        if (skip || !siret) {
          return null;
        }
        return searchCompanyFailFast(siret);
      })
    );

    // make a copy to avoid mutating initial data
    const sirenifiedInput = { ...input };

    for (const [idx, companySearchResult] of companySearchResults.entries()) {
      const { setter, setterIfNotFound } = accessors[idx];
      if (!companySearchResult) {
        if (setterIfNotFound) {
          setterIfNotFound(sirenifiedInput);
        }
        continue;
      }
      const company = companySearchResult as CompanySearchResult;
      if (
        company.statutDiffusionEtablissement ===
        ("P" as StatutDiffusionEtablissement)
      ) {
        continue;
      }
      if (company.etatAdministratif === "F") {
        throw new UserInputError(
          `L'établissement ${company.siret} est fermé selon le répertoire SIRENE`
        );
      }

      if (company.isDormant) {
        throw new UserInputError(
          `L'établissement ${company.siret} est en sommeil sur Trackdéchets. Il n'est pas possible de le mentionner dans un BSD.`
        );
      }

      setter(sirenifiedInput, {
        name: company.name,
        address: company.address,
        city: company.addressCity,
        postalCode: company.addressPostalCode,
        street: company.addressVoie
      });
    }

    return sirenifiedInput;
  };
}

export async function searchCompanyFailFast(
  siret: string
): Promise<CompanySearchResult | null> {
  // make sure we do not wait more thant 1s here to avoid bottlenecks
  const raceWith = new Promise<null>(resolve =>
    setTimeout(resolve, 1000, null)
  );

  try {
    const companySeachResult = await Promise.race([
      searchCompany(siret),
      raceWith
    ]);
    return companySeachResult;
  } catch (e) {
    logger.info(`Sirenify failed for siret ${siret}. Reason : ${e.message}`);
    return null;
  }
}

/**
 * Narrow search for Trackdéchets Sirene index
 * @param siret
 * @param _source_includes
 * @returns
 */
export async function searchTDSireneFailFast(
  siret: string
): Promise<SireneSearchResult | null> {
  // make sure we do not wait more thant 1s here to avoid bottlenecks
  const raceWith = new Promise<null>(resolve =>
    setTimeout(resolve, 1000, null)
  );

  return await Promise.race([searchCompanyTD(siret), raceWith]);
}
