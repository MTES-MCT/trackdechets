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
import {
  countries,
  isForeignVat
} from "../../../common/constants/companySearchHelpers";
import { checkVAT } from "jsvat";
import { searchCompany } from "../../search";
import { CompanySearchResult } from "../../types";
import { Permission, checkUserPermissions } from "../../../permissions";

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

  const COMPANY_CONSTANTS: Record<FavoriteType, CompanyType[]> = {
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

  return COMPANY_CONSTANTS[favoriteType].some(matchingCompanyType =>
    company.companyTypes.includes(matchingCompanyType)
  );
}

function companyToFavorite(
  company: Company & { transporterReceipt?: TransporterReceipt } & {
    traderReceipt?: TraderReceipt;
  } & { brokerReceipt?: BrokerReceipt }
): CompanyFavorite {
  return {
    orgId: company.orgId,
    name: company.name,
    siret: company.siret,
    vatNumber: company.vatNumber,
    address: company.address,
    contact: company.contact,
    phone: company.contactPhone,
    mail: company.contactEmail,
    isRegistered: !!company,
    codePaysEtrangerEtablissement: !isForeignVat(company.vatNumber)
      ? "FR"
      : checkVAT(company.vatNumber ?? "", countries)?.country?.isoCode.short,
    transporterReceipt: company.transporterReceipt,
    companyTypes: company.companyTypes ?? []
  };
}

function companySearchResultToFavorite(
  companySearchResult: CompanySearchResult
): CompanyFavorite {
  return {
    orgId: companySearchResult.orgId,
    name: companySearchResult.name,
    siret: companySearchResult.siret,
    vatNumber: companySearchResult.vatNumber,
    address: companySearchResult.address,
    contact: companySearchResult.contact,
    phone: companySearchResult.contactPhone ?? "",
    mail: companySearchResult.contactEmail ?? "",
    isRegistered: companySearchResult.isRegistered,
    companyTypes: companySearchResult.companyTypes ?? []
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
  const emitterSirets = forms.map(f => f.emitterCompanySiret).filter(Boolean);
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

  const recipientSirets = forms
    .map(f => f.recipientCompanySiret)
    .filter(Boolean);
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
      // We over fetch to avoid a join - Only check if we have recipientsSirets.
      // In JS we will remove empty sirets and sirets which are equal to recipientCompanySiret
      recipientsSirets: {
        isEmpty: false
      }
    },
    select: { recipientsSirets: true, recipientCompanySiret: true }
  });

  const destinationSirets = forms
    .flatMap(f =>
      f.recipientsSirets.filter(siret => siret !== f.recipientCompanySiret)
    )
    .filter(Boolean);
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

  const nextDestinationSirets = [
    ...new Set(forms.map(f => f.nextDestinationCompanySiret).filter(Boolean))
  ];
  const favorites = await Promise.all(
    nextDestinationSirets.map(async siret => {
      try {
        const company = await searchCompany(siret);
        return companySearchResultToFavorite(company);
      } catch (_) {
        return null;
      }
    })
  );

  return favorites.filter(Boolean);
}

async function getRecentTransporters(defaultWhere: Prisma.FormWhereInput) {
  const transporters = await prisma.bsddTransporter.findMany({
    ...defaultArgs,
    where: {
      form: defaultWhere,
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
    }
  });
  const transporterSirets = transporters
    .map(f => f.transporterCompanySiret)
    .filter(Boolean);
  const transporterVatNumbers = transporters
    .map(f => f.transporterCompanyVatNumber)
    .filter(Boolean);

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

  const traderSirets = [
    ...new Set(forms.map(f => f.traderCompanySiret).filter(Boolean))
  ];
  const favorites = await Promise.all(
    traderSirets.map(async siret => {
      try {
        const company = await searchCompany(siret);
        const favorite = companySearchResultToFavorite(company);
        const traderReceipt = await prisma.company
          .findUnique({
            where: { orgId: favorite.orgId }
          })
          .traderReceipt();
        return { ...favorite, traderReceipt };
      } catch (_) {
        return null;
      }
    })
  );

  return favorites.filter(Boolean);
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

  const brokerSirets = [
    ...new Set(forms.map(f => f.brokerCompanySiret).filter(Boolean))
  ];
  const favorites = await Promise.all(
    brokerSirets.map(async siret => {
      try {
        const company = await searchCompany(siret);
        const favorite = companySearchResultToFavorite(company);
        const brokerReceipt = await prisma.company
          .findUnique({
            where: { orgId: favorite.orgId }
          })
          .brokerReceipt();
        return { ...favorite, brokerReceipt };
      } catch (_) {
        return null;
      }
    })
  );

  return favorites.filter(Boolean);
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
  //userId: string,
  siret: string,
  type: FavoriteType
): Promise<CompanyFavorite[]> {
  const defaultWhere: Prisma.FormWhereInput = {
    OR: [
      { emitterCompanySiret: siret },
      { ecoOrganismeSiret: siret },
      { recipientsSirets: { has: siret } },
      { traderCompanySiret: siret },
      { brokerCompanySiret: siret },
      { transportersSirets: { has: siret } }
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
  const company = await getCompanyOrCompanyNotFound({ orgId: siret });

  // retrieving company favorites is considered as a list operation on bsd beacause
  // getRecentPartners read all bsds for a given siret
  await checkUserPermissions(
    user,
    [siret].filter(Boolean),
    Permission.BsdCanList,
    `Vous n'êtes pas membre de l'entreprise portant le siret "${siret}".`
  );

  const recentPartners = company.siret
    ? await getRecentPartners(company.siret, type)
    : [];
  const favorites: CompanyFavorite[] = recentPartners.map(recentPartner => {
    return {
      ...recentPartner,
      codePaysEtrangerEtablissement: !isForeignVat(recentPartner.vatNumber)
        ? "FR"
        : checkVAT(recentPartner.vatNumber ?? "", countries)?.country?.isoCode
            .short
    };
  });

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
