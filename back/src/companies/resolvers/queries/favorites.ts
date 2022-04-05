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
    take: 50
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
        temporaryStorageDetail: { destinationCompanySiret: siret }
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

  switch (type) {
    case "TEMPORARY_STORAGE_DETAIL": {
      const forms = await prisma.form.findMany({
        ...defaultArgs,
        where: {
          ...defaultWhere,
          recipientIsTempStorage: true,
          recipientCompanySiret: { not: "" }
        }
      });
      return forms.map(form => ({
        name: form.recipientCompanyName,
        siret: form.recipientCompanySiret,
        address: form.recipientCompanyAddress,
        contact: form.recipientCompanyAddress,
        phone: form.recipientCompanyPhone,
        mail: form.recipientCompanyMail
      }));
    }
    case "DESTINATION": {
      const forms = await prisma.form.findMany({
        ...defaultArgs,
        where: {
          ...defaultWhere,
          temporaryStorageDetail: {
            destinationCompanySiret: { not: "" }
          }
        },
        select: {
          temporaryStorageDetail: {
            select: {
              destinationCompanyName: true,
              destinationCompanySiret: true,
              destinationCompanyAddress: true,
              destinationCompanyContact: true,
              destinationCompanyPhone: true,
              destinationCompanyMail: true
            }
          }
        }
      });
      return forms.map(form => ({
        name: form.temporaryStorageDetail.destinationCompanyName,
        siret: form.temporaryStorageDetail.destinationCompanySiret,
        address: form.temporaryStorageDetail.destinationCompanyAddress,
        contact: form.temporaryStorageDetail.destinationCompanyContact,
        phone: form.temporaryStorageDetail.destinationCompanyPhone,
        mail: form.temporaryStorageDetail.destinationCompanyMail
      }));
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
        }
      });

      return forms.map(form => ({
        name: form[`${lowerType}CompanyName`],
        siret: form[`${lowerType}CompanySiret`],
        address: form[`${lowerType}CompanyAddress`],
        contact: form[`${lowerType}CompanyContact`],
        phone: form[`${lowerType}CompanyPhone`],
        mail: form[`${lowerType}CompanyMail`]
      }));
    }
    default:
      return [];
  }
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
    // Remove duplicates (by company siret)
    .reduce<CompanyFavorite[]>((prev, cur) => {
      if (prev.find(el => el.siret === cur.siret) == null) {
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
    favorite => favorite.siret === company.siret
  );
  if (isMatchingType && !isAlreadyListed) {
    favorites.push({
      name: company.name,
      siret: company.siret,
      vatNumber: company.vatNumber,
      address: company.address,
      contact: user.name,
      phone: user.phone,
      mail: user.email
    });
  }

  // Return up to MAX_FAVORITES results
  favorites.splice(MAX_FAVORITES);
  return favorites;
};

export default favoritesResolver;
