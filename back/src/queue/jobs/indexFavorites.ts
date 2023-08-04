import fs from "fs";
import path from "path";
import { Job } from "bull";
import { CompanyType, Prisma } from "@prisma/client";
import prisma from "../../prisma";
import {
  countries,
  isForeignVat
} from "../../common/constants/companySearchHelpers";
import { checkVAT } from "jsvat";
import { searchCompany } from "../../companies/search";
import { CompanySearchResult } from "../../companies/types";
import { CompanyNotFound } from "../../companies/errors";
import { Client } from "@elastic/elasticsearch";
import { FavoriteType } from "../../generated/graphql/types";

/**
 * TODO add support for all BSD types
 */

/**
 * ElasticSearch Favorites index
 */
export const indexConfig = {
  // Do not change this alias name unless you know you will break the production when releasing the next version
  alias: process.env.ELASTICSEARCH_FAVORITES_ENDPOINT || "favorites",
  url: process.env.ELASTICSEARCH_FAVORITES_ENDPOINT || "http://localhost:9200/"
};

/**
 * es.cert is the private CA key from the ElasticSearch hosting
 * if absent, either the CA is public, either url uses http
 */
const certPath = path.join(__dirname, "es.cert");
export const client = new Client({
  node: indexConfig.url,
  ssl: fs.existsSync(certPath)
    ? { ca: fs.readFileSync(certPath, "utf-8") }
    : undefined
});

export interface FavoritesInput {
  orgId: string;
  type: FavoriteType;
}

const MAX_FAVORITES = 10;

function matchesFavoriteType(
  companyTypes: CompanyType[],
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
    companyTypes.includes(matchingCompanyType)
  );
}
const defaultArgs = {
  orderBy: { updatedAt: "desc" as Prisma.SortOrder },
  take: 30
};

async function getRecentEmitters(
  defaultWhere: Prisma.FormWhereInput
): Promise<CompanySearchResult[]> {
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
    where: { siret: { in: emitterSirets } },
    select: { orgId: true }
  });
  return Promise.all(companies.map(({ orgId }) => searchCompany(orgId)));
}

async function getRecentRecipients(
  defaultWhere: Prisma.FormWhereInput
): Promise<CompanySearchResult[]> {
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
    where: { siret: { in: recipientSirets } },
    select: { orgId: true }
  });
  return Promise.all(companies.map(({ orgId }) => searchCompany(orgId)));
}

async function getRecentDestinationAfterTempStorage(
  defaultWhere: Prisma.FormWhereInput
): Promise<CompanySearchResult[]> {
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
    where: { siret: { in: destinationSirets } },
    select: { orgId: true }
  });
  return Promise.all(companies.map(({ orgId }) => searchCompany(orgId)));
}

async function getRecentNextDestinations(
  defaultWhere: Prisma.FormWhereInput
): Promise<CompanySearchResult[]> {
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
        return searchCompany(siret);
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
  return Promise.all(companies.map(({ orgId }) => searchCompany(orgId)));
}

async function getRecentTraders(
  defaultWhere: Prisma.FormWhereInput
): Promise<CompanySearchResult[]> {
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
        const favorite = await searchCompany(siret);
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
): Promise<CompanySearchResult[]> {
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
        const favorite = await searchCompany(siret);
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
 * @param {string} siret SIRET of the company for which to retrieve the recent partners
 * @param {FavoriteType} type the type of partners to search for
 *
 * @returns {Promise} resolves to a list of recent partners matching the provided parameters
 */
async function getRecentPartners(
  orgId: string,
  type: FavoriteType
): Promise<CompanySearchResult[]> {
  const defaultWhere: Prisma.FormWhereInput = {
    OR: [
      { emitterCompanySiret: orgId },
      { ecoOrganismeSiret: orgId },
      { recipientsSirets: { has: orgId } },
      { traderCompanySiret: orgId },
      { brokerCompanySiret: orgId },
      { transportersSirets: { has: orgId } }
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

const favoritesConstrutor = async ({
  orgId,
  type
}: FavoritesInput): Promise<CompanySearchResult[]> => {
  const company = await prisma.company.findUnique({
    where: { orgId },
    select: { orgId: true, companyTypes: true, vatNumber: true }
  });
  if (company == null) {
    throw new CompanyNotFound();
  }
  const companySearch = await searchCompany(company.orgId);
  const recentPartners = company.orgId
    ? await getRecentPartners(company.orgId, type)
    : [];

  const favorites: CompanySearchResult[] = recentPartners.map(recentPartner => {
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
  const isMatchingType = matchesFavoriteType(company.companyTypes, type);
  // their company is not included in the results yet
  const isAlreadyListed = favorites.find(
    favorite =>
      favorite.siret === companySearch.siret ||
      (favorite.vatNumber &&
        company.vatNumber &&
        favorite.vatNumber === company.vatNumber)
  );
  if (isMatchingType && !isAlreadyListed) {
    favorites.push(company);
  }

  // Return up to MAX_FAVORITES results
  favorites.splice(MAX_FAVORITES);
  return favorites;
};

export function getIndexFavoritesId({ orgId, type }: FavoritesInput) {
  return `${orgId}-${type}`;
}

export interface FavoriteIndexBody {
  favorites: CompanySearchResult[];
  orgId: string;
  type: FavoriteType;
}

/**
 * Create/update a favorite in Elastic Search.
 */
function indexFavorites(
  favorites: CompanySearchResult[],
  { orgId, type }: FavoritesInput
) {
  return client.index(
    {
      index: indexConfig.alias,
      id: getIndexFavoritesId({ orgId, type }),
      body: {
        favorites,
        orgId,
        type
      } as FavoriteIndexBody
    },
    {
      // do not throw version conflict errors
      ignore: [409]
    }
  );
}

export const processFavoritesJob = async (job: Job<FavoritesInput>) => {
  const { orgId, type } = job.data;

  try {
    // Index the document in Elasticsearch
    return indexFavorites(await favoritesConstrutor({ orgId, type }), {
      orgId,
      type
    });
  } catch (error) {
    console.error(error);
    throw new Error(
      "An error occurred while indexing the favorite in Elasticsearch"
    );
  }
};
