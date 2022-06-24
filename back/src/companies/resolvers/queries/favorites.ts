import {
  CompanyFavorite,
  FavoriteType,
  QueryResolvers
} from "../../../generated/graphql/types";
import {
  BrokerReceipt,
  Company,
  CompanyType,
  Prisma,
  TraderReceipt,
  TransporterReceipt
} from "@prisma/client";
import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../database";
import { checkIsCompanyMember } from "../../../users/permissions";
import { countries } from "../../../common/constants/companySearchHelpers";
import { checkVAT } from "jsvat";
import { searchCompany } from "../../search";
import { CompanySearchResult } from "../../types";

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

function companyToFavorite(
  company: Company & { transporterReceipt?: TransporterReceipt } & {
    traderReceipt?: TraderReceipt;
  } & { brokerReceipt?: BrokerReceipt }
): CompanyFavorite {
  return {
    name: company.name,
    siret: company.siret,
    vatNumber: company.vatNumber,
    address: company.address,
    contact: company.contact,
    phone: company.contactPhone,
    mail: company.contactEmail,
    isRegistered: !!company,
    codePaysEtrangerEtablissement: !company.vatNumber
      ? "FR"
      : checkVAT(company.vatNumber, countries)?.country?.isoCode.short,
    transporterReceipt: company.transporterReceipt
  };
}

function companySearchResultToFavorite(
  companySearchResult: CompanySearchResult
): CompanyFavorite {
  return {
    name: companySearchResult.name,
    siret: companySearchResult.siret,
    vatNumber: companySearchResult.vatNumber,
    address: companySearchResult.address,
    contact: companySearchResult.contact,
    phone: companySearchResult.contactPhone ?? "",
    mail: companySearchResult.contactEmail ?? "",
    isRegistered: companySearchResult.isRegistered
  };
}

const defaultArgs = {
  orderBy: { updatedAt: "desc" as Prisma.SortOrder },
  take: 30
};

async function getRecentEmitters(
  defaultWhere: Prisma.FormWhereInput
): Promise<CompanyFavorite[]> {
  const forms = await prisma.form.findMany({
    ...defaultArgs,
    where: {
      ...defaultWhere,
      NOT: [{ emitterCompanySiret: null }, { emitterCompanySiret: "" }]
    },
    select: { emitterCompanySiret: true }
  });
  const emitterSirets = forms.map(f => f.emitterCompanySiret);
  const companies = await prisma.company.findMany({
    where: { siret: { in: emitterSirets } }
  });
  return companies.map(c => companyToFavorite(c));
}

async function getRecentRecipients(
  defaultWhere: Prisma.FormWhereInput
): Promise<CompanyFavorite[]> {
  const forms = await prisma.form.findMany({
    ...defaultArgs,
    where: {
      ...defaultWhere,
      NOT: [{ recipientCompanySiret: null }, { recipientCompanySiret: "" }]
    },
    select: { recipientCompanySiret: true }
  });
  const recipientSirets = forms.map(f => f.recipientCompanySiret);
  const companies = await prisma.company.findMany({
    where: { siret: { in: recipientSirets } }
  });
  return companies.map(c => companyToFavorite(c));
}

async function getRecentDestinationAfterTempStorage(
  defaultWhere: Prisma.FormWhereInput
): Promise<CompanyFavorite[]> {
  const forms = await prisma.form.findMany({
    ...defaultArgs,
    where: {
      ...defaultWhere,
      forwardedIn: {
        NOT: [{ recipientCompanySiret: null }, { recipientCompanySiret: "" }]
      }
    },
    select: { forwardedIn: { select: { recipientCompanySiret: true } } }
  });
  const destinationSirets = forms.map(
    f => f.forwardedIn?.recipientCompanySiret
  );
  const companies = await prisma.company.findMany({
    where: { siret: { in: destinationSirets } }
  });
  return companies.map(c => companyToFavorite(c));
}

async function getRecentNextDestinations(
  defaultWhere: Prisma.FormWhereInput
): Promise<CompanyFavorite[]> {
  const forms = await prisma.form.findMany({
    ...defaultArgs,
    where: {
      ...defaultWhere,
      NOT: [
        { nextDestinationCompanySiret: null },
        { nextDestinationCompanySiret: "" }
      ]
    },
    select: { nextDestinationCompanySiret: true }
  });
  const nextDestinationSirets = forms.map(f => f.nextDestinationCompanySiret);
  const companies = (
    await Promise.all(
      nextDestinationSirets.map(siret => searchCompany(siret).catch(_ => null))
    )
  ).filter(c => c !== null);
  return companies.map(c => companySearchResultToFavorite(c));
}

async function getRecentTransporters(defaultWhere: Prisma.FormWhereInput) {
  const forms = await prisma.form.findMany({
    ...defaultArgs,
    where: {
      ...defaultWhere,
      OR: [
        {
          NOT: [
            { transporterCompanySiret: null },
            { transporterCompanySiret: "" }
          ]
        },
        {
          NOT: [
            { transporterCompanyVatNumber: null },
            { transporterCompanyVatNumber: "" }
          ]
        }
      ]
    },
    select: {
      transporterCompanySiret: true,
      transporterCompanyVatNumber: true,
      transporterReceipt: true
    }
  });
  const transporterSirets = forms
    .map(f => f.transporterCompanySiret)
    .filter(s => !["", null].includes(s));
  const transporterVatNumbers = forms
    .map(f => f.transporterCompanyVatNumber)
    .filter(s => !["", null].includes(s));

  const companies = await prisma.company.findMany({
    where: {
      OR: [
        { siret: { in: transporterSirets } },
        { vatNumber: { in: transporterVatNumbers } }
      ]
    }
  });
  return companies.map(c => companyToFavorite(c));
}

async function getRecentTraders(
  defaultWhere: Prisma.FormWhereInput
): Promise<CompanyFavorite[]> {
  const forms = await prisma.form.findMany({
    ...defaultArgs,
    where: {
      ...defaultWhere,
      NOT: [{ traderCompanySiret: null }, { traderCompanySiret: "" }]
    },
    select: { traderCompanySiret: true }
  });
  const traderSirets = forms.map(f => f.traderCompanySiret);
  const companies = (
    await Promise.all(
      traderSirets.map(siret => searchCompany(siret).catch(_ => null))
    )
  ).filter(c => c !== null);
  return Promise.all(
    companies.map(async c => {
      const favorite = companySearchResultToFavorite(c);
      const traderReceipt = await prisma.company
        .findUnique({
          where: { siret: favorite.siret }
        })
        .traderReceipt();
      return { ...favorite, traderReceipt };
    })
  );
}

async function getRecentBrokers(
  defaultWhere: Prisma.FormWhereInput
): Promise<CompanyFavorite[]> {
  const forms = await prisma.form.findMany({
    ...defaultArgs,
    where: {
      ...defaultWhere,
      NOT: [{ brokerCompanySiret: null }, { brokerCompanySiret: "" }]
    },
    select: { brokerCompanySiret: true }
  });
  const brokerSirets = forms.map(f => f.brokerCompanySiret);
  const companies = (
    await Promise.all(
      brokerSirets.map(siret => searchCompany(siret).catch(_ => null))
    )
  ).filter(c => c !== null);

  return Promise.all(
    companies.map(async c => {
      const favorite = companySearchResultToFavorite(c);
      const brokerReceipt = await prisma.company
        .findUnique({
          where: { siret: favorite.siret }
        })
        .brokerReceipt();
      return { ...favorite, brokerReceipt };
    })
  );
}

/**
 * Return a list of companies the user (and their company) have been working with recently.
 * The list is filtered according to a given "FavoriteType": a field of the form.
 *
 * For emitter, transporter, and destination after temporary storage, we only return companies registered in TD
 * For brokers, traders, and next destinations we only returns companies present in SIRENE database
 *
 * @param {string} userID ID of the user for whom to retrieve the recent partners
 * @param {string} siret SIRET of the company for which to retrieve the recent partners
 * @param {FavoriteType} type the type of partners to search for
 *
 * @returns {Promise} resolves to a list of recent partners matching the provided parameters
 */
async function getRecentPartners(
  userId: string,
  siret: string,
  type: FavoriteType
): Promise<CompanyFavorite[]> {
  const defaultWhere: Prisma.FormWhereInput = {
    OR: [
      { owner: { id: userId } },
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

  switch (type) {
    case "EMITTER":
      return getRecentEmitters(defaultWhere);
    case "RECIPIENT":
      return getRecentRecipients(defaultWhere);
    case "TEMPORARY_STORAGE_DETAIL":
      // do not differenciate between recipient and temp storage
      // because the front never set type = TEMPORARY_STORAGE_DETAIL
      return getRecentRecipients(defaultWhere);
    case "TRANSPORTER":
      return getRecentTransporters(defaultWhere);
    case "DESTINATION":
      return getRecentDestinationAfterTempStorage(defaultWhere);
    case "NEXT_DESTINATION":
      return getRecentNextDestinations(defaultWhere);
    case "BROKER":
      return getRecentBrokers(defaultWhere);
    case "TRADER":
      return getRecentTraders(defaultWhere);
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
    favorites.push(companyToFavorite(company));
  }

  // Return up to MAX_FAVORITES results
  favorites.splice(MAX_FAVORITES);
  return favorites;
};

export default favoritesResolver;
