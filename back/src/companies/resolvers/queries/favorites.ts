import { camelCase } from "camel-case";
import {
  CompanyFavorite,
  FavoriteType,
  QueryResolvers
} from "../../../generated/graphql/types";
import { Company, CompanyType, Prisma } from "@prisma/client";
import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../database";
import { checkIsCompanyMember } from "../../../users/permissions";
import { countries } from "../../../common/constants/companySearchHelpers";
import { checkVAT } from "jsvat";
import { searchCompany } from "../../search";

const MAX_FAVORITES = 10;

function matchesFavoriteType(
  company: Company,
  favoriteType: FavoriteType
): boolean {
  const EMITTER: CompanyType[] = ["PRODUCER", "ECO_ORGANISME"];
  const TRANSPORTER: CompanyType[] = ["TRANSPORTER"];
  const TRADER: CompanyType[] = ["TRADER"];
  const BROKER: CompanyType[] = ["BROKER"];
  const RECIPIENT: CompanyType[] = [
    "COLLECTOR",
    "WASTEPROCESSOR",
    "WASTE_VEHICLES",
    "WASTE_CENTER"
  ];
  const WORKER: CompanyType[] = ["PRODUCER"];
  const DESTINATION = RECIPIENT;
  const NEXT_DESTINATION = RECIPIENT;
  const TEMPORARY_STORAGE_DETAIL = RECIPIENT;

  const COMPANY_TYPES: Record<FavoriteType, CompanyType[]> = {
    EMITTER,
    TRANSPORTER,
    TRADER,
    BROKER,
    RECIPIENT,
    DESTINATION,
    NEXT_DESTINATION,
    TEMPORARY_STORAGE_DETAIL,
    WORKER
  };

  return COMPANY_TYPES[favoriteType].some(matchingCompanyType =>
    company.companyTypes.includes(matchingCompanyType)
  );
}

/**
 * Return a list of companies the user (and their company) have been working with recently.
 * The list is filtered according to a given "FavoriteType": a field of the form.
 *
 * @param {string} userID ID of the user for whom to retrieve the recent partners
 * @param {string} siret SIRET of the company for which to retrieve the recent partners
 * @param {FavoriteType} type the type of partners to search for
 *
 * @returns {Promise} resolves to a list of recent partners matching the provided parameters
 */
async function getRecentPartners(
  userID: string,
  siret: string,
  type: FavoriteType
): Promise<CompanyFavorite[]> {
  const defaultArgs = {
    orderBy: { updatedAt: "desc" as Prisma.SortOrder },
    take: 30
  };
  const defaultWhere: Prisma.FormWhereInput = {
    OR: [
      { owner: { id: userID } },
      { emitterCompanySiret: siret },
      { ecoOrganismeSiret: siret },
      { recipientCompanySiret: siret },
      { traderCompanySiret: siret },
      { brokerCompanySiret: siret },
      {
        forwardedIn: { recipientCompanySiret: siret }
      },
      { transporterCompanySiret: siret },
      {
        transportSegments: {
          some: {
            transporterCompanySiret: siret
          }
        }
      }
    ],

    // ignore drafts as they are likely to be incomplete
    status: { not: "DRAFT" },

    isDeleted: false
  };

  const recentSirets: string[] = await (async () => {
    switch (type) {
      case "TEMPORARY_STORAGE_DETAIL": {
        const forms = await prisma.form.findMany({
          ...defaultArgs,
          where: {
            ...defaultWhere,
            recipientIsTempStorage: true,
            recipientCompanySiret: { not: "" }
          },
          select: { recipientCompanySiret: true }
        });
        return forms.map(form => form.recipientCompanySiret);
      }
      case "DESTINATION": {
        const forms = await prisma.form.findMany({
          ...defaultArgs,
          where: {
            ...defaultWhere,
            forwardedIn: {
              recipientCompanySiret: { not: "" }
            }
          },
          select: {
            forwardedIn: {
              select: {
                recipientCompanySiret: true
              }
            }
          }
        });
        return forms.map(form => form.forwardedIn?.recipientCompanySiret);
      }
      case "EMITTER":
      case "TRANSPORTER":
      case "RECIPIENT":
      case "TRADER":
      case "BROKER":
      case "NEXT_DESTINATION": {
        const lowerType = camelCase(type);
        const forms = await prisma.form.findMany({
          ...defaultArgs,
          where: {
            ...defaultWhere,
            [`${lowerType}CompanySiret`]: { not: "" }
          },
          select: { [`${lowerType}CompanySiret`]: true }
        });
        return forms.map(form => form[`${lowerType}CompanySiret`]);
      }
      default:
        return [];
    }
  })();

  const companies = (
    await Promise.all(
      recentSirets.map(async siret => {
        try {
          const company = await searchCompany(siret);
          return company;
        } catch {
          // catch company not found
          return null;
        }
      })
    )
  ).filter(c => c !== null); // filter company not found in SIRENE database

  return companies.map(company => ({
    name: company.name,
    siret: company.siret,
    address: company.address,
    contact: "",
    phone: company.phone ?? "",
    mail: company.email ?? ""
  }));
}

const favoritesResolver: QueryResolvers["favorites"] = async (
  parent,
  { siret, type },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ siret });
  await checkIsCompanyMember({ id: user.id }, { siret: company.siret });

  const favorites: CompanyFavorite[] = (
    await getRecentPartners(user.id, company.siret, type)
  )
    // Remove duplicates (by company siret or VAT)
    .reduce<CompanyFavorite[]>((prev, cur) => {
      if (
        prev.find(
          el =>
            el.siret === cur.siret ||
            (el.vatNumber && cur.vatNumber && el.vatNumber === cur.vatNumber)
        ) == null
      ) {
        // compute codePaysEtrangerEtablissement
        cur.codePaysEtrangerEtablissement = !cur.vatNumber
          ? "FR"
          : checkVAT(cur.vatNumber, countries)?.country?.isoCode.short;
        return prev.concat([cur]);
      }
      return prev;
    }, []);

  // return early
  if (favorites.length + 1 >= MAX_FAVORITES) {
    favorites.splice(MAX_FAVORITES);
    return favorites;
  }

  // the user's company matches the provided favorite type
  const isMatchingType = matchesFavoriteType(company, type);
  // their company is not included in the results yet
  const isAlreadyListed = favorites.find(
    favorite =>
      favorite.siret === company.siret ||
      (favorite.vatNumber &&
        company.vatNumber &&
        favorite.vatNumber === company.vatNumber)
  );
  if (isMatchingType && !isAlreadyListed) {
    favorites.push({
      name: company.name,
      siret: company.siret,
      vatNumber: company.vatNumber,
      address: company.address,
      contact: user.name,
      phone: user.phone,
      mail: user.email,
      codePaysEtrangerEtablissement: !company.vatNumber
        ? "FR"
        : checkVAT(company.vatNumber, countries)?.country?.isoCode.short
    });
  }

  // Return up to MAX_FAVORITES results
  favorites.splice(MAX_FAVORITES);
  return favorites;
};

export default favoritesResolver;
