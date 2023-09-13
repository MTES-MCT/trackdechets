import fs from "fs";
import path from "path";
import { Job } from "bull";
import { SearchResponse } from "@elastic/elasticsearch/api/types";
import { Search } from "@elastic/elasticsearch/api/requestParams";
import { ApiResponse, Client } from "@elastic/elasticsearch";
import { CompanyType } from "@prisma/client";
import prisma from "../../prisma";
import { searchCompany } from "../../companies/search";
import { CompanySearchResult } from "../../companies/types";
import { FavoriteType } from "../../generated/graphql/types";
import { getTransporterCompanyOrgId } from "../../common/constants/companySearchHelpers";
import { getCompanyOrCompanyNotFound } from "../../companies/database";
import { BsdElastic, index } from "../../common/elastic";

export interface FavoriteIndexBody {
  favorites: CompanySearchResult[];
  orgId: string;
  type: FavoriteType;
}

/**
 * ElasticSearch Favorites index
 */
export const indexConfig = {
  // Do not change this alias name unless you know what you do
  alias: process.env.ELASTIC_SEARCH_FAVORITES_ALIAS || "favorites",
  url: process.env.ELASTIC_SEARCH_URL || "http://elasticsearch:9200/"
};

/**
 * es.cert is the private CA key from the ElasticSearch hosting
 * if absent, either the CA is public, either url uses http
 */
const certPath = path.join(__dirname, "es.cert");

let ssl;

if (fs.existsSync(certPath)) {
  ssl = { ca: fs.readFileSync(certPath, "utf-8") };
} else if (process.env.ELASTICSEARCH_FAVORITES_CACERT) {
  ssl = { ca: process.env.ELASTICSEARCH_FAVORITES_CACERT };
}

// bypass ssl verif
if (!!ssl && process.env.ELASTICSEARCH_FAVORITES_IGNORE_SSL === "true") {
  ssl.rejectUnauthorized = false;
}

/**
 * ElasticSearch `favorites` index client
 */
export const client = new Client({
  node: indexConfig.url,
  ssl
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

/**
 * ElasticSearch `bsds` query builder
 */
const buildBsdsQueryBody = (orgId: string, field: string): Search => ({
  index: index.alias,
  body: {
    size: MAX_FAVORITES,
    query: {
      bool: {
        must: [
          {
            term: { sirets: orgId }
          },
          {
            exists: {
              field
            }
          }
        ],
        must_not: [
          { term: { status: "DRAFT" } },
          {
            term: {
              [field]: ""
            }
          }
        ]
      }
    }
  }
});

async function getRecentEmitters(
  orgId: string
): Promise<CompanySearchResult[]> {
  const queryBody = buildBsdsQueryBody(orgId, "emitterCompanySiret");
  const { body }: ApiResponse<SearchResponse<BsdElastic>> = await client.search(
    queryBody
  );
  const hits = body.hits.hits.slice(0, MAX_FAVORITES);
  const emitterSirets = [
    ...new Set(hits.map(f => f._source?.emitterCompanySiret).filter(Boolean))
  ];
  const favorites = await Promise.all(
    emitterSirets.map(searchRegisteredCompany)
  );

  return favorites.filter(Boolean);
}

const searchRegisteredCompany = async siret => {
  try {
    const company = await searchCompany(siret);
    if (company.isRegistered) return company;
    else return null;
  } catch (_) {
    return null;
  }
};

async function getRecentRecipients(
  orgId: string
): Promise<CompanySearchResult[]> {
  const queryBody = buildBsdsQueryBody(orgId, "destinationCompanySiret");
  const { body }: ApiResponse<SearchResponse<BsdElastic>> = await client.search(
    queryBody
  );
  const hits = body.hits.hits.slice(0, MAX_FAVORITES);
  const destinationSirets = [
    ...new Set(
      hits.map(f => f._source?.destinationCompanySiret).filter(Boolean)
    )
  ];
  const favorites = await Promise.all(
    destinationSirets.map(searchRegisteredCompany)
  );

  return favorites.filter(Boolean);
}

async function getRecentNextDestinations(orgId: string) {
  const queryBody = buildBsdsQueryBody(orgId, "nextDestinationCompanySiret");
  const { body }: ApiResponse<SearchResponse<BsdElastic>> = await client.search(
    queryBody
  );
  const hits = body.hits.hits.slice(0, MAX_FAVORITES);
  const nextDestinationSirets = [
    ...new Set(
      hits.map(f => f._source?.nextDestinationCompanySiret).filter(Boolean)
    )
  ];

  const favorites = await Promise.all(
    nextDestinationSirets.map(searchRegisteredCompany)
  );

  return favorites.filter(Boolean);
}

/**
 * Only retrieve the first Transporter if many exists
 */
async function getRecentTransporters(orgId: string) {
  const queryBody = {
    query: {
      bool: {
        must: [
          {
            term: { sirets: orgId }
          },
          {
            exists: {
              field: "transporterCompanySiret"
            }
          }
        ],
        must_not: [
          { term: { status: "DRAFT" } },
          {
            term: {
              transporterCompanySiret: ""
            }
          }
        ]
      }
    }
  };
  const queryVatBody = {
    query: {
      bool: {
        must: [
          {
            term: { sirets: orgId }
          },
          {
            exists: {
              field: "transporterCompanyVatNumber"
            }
          }
        ],
        must_not: [
          { term: { status: "DRAFT" } },
          {
            term: {
              transporterCompanyVatNumber: ""
            }
          }
        ]
      }
    }
  };
  const { body } = await client.msearch({
    body: [
      { index: index.alias },
      queryBody,
      { index: index.alias },
      queryVatBody
    ]
  });
  const hits = body.responses[0].hits.hits.slice(0, MAX_FAVORITES);
  const vatHits = body.responses[1].hits.hits.slice(0, MAX_FAVORITES);
  const transporterOrgIds = [
    ...new Set(
      hits
        .map(f => (f._source ? getTransporterCompanyOrgId(f._source) : null))
        .filter(Boolean)
    ),
    ...new Set(
      vatHits
        .map(f => (f._source ? getTransporterCompanyOrgId(f._source) : null))
        .filter(Boolean)
    )
  ];

  const favorites = await Promise.all(
    transporterOrgIds.map(searchRegisteredCompany)
  );

  return favorites.filter(Boolean);
}

async function getRecentTraders(orgId: string): Promise<CompanySearchResult[]> {
  const queryBody = buildBsdsQueryBody(orgId, "traderCompanySiret");
  const { body }: ApiResponse<SearchResponse<BsdElastic>> = await client.search(
    queryBody
  );
  const hits = body.hits.hits.slice(0, MAX_FAVORITES);
  const traderSirets = [
    ...new Set(hits.map(f => f._source?.traderCompanySiret).filter(Boolean))
  ];
  const favorites = await Promise.all(
    traderSirets.map(async siret => {
      try {
        const favorite = await searchCompany(siret);
        const company = await prisma.company.findUnique({
          where: { orgId: favorite.orgId },
          include: { traderReceipt: true }
        });

        if (!company) return null;
        return { ...favorite, traderReceipt: company.traderReceipt };
      } catch (_) {
        return null;
      }
    })
  );

  return favorites.filter(Boolean);
}

async function getRecentBrokers(orgId: string): Promise<CompanySearchResult[]> {
  const queryBody = buildBsdsQueryBody(orgId, "brokerCompanySiret");
  const { body }: ApiResponse<SearchResponse<BsdElastic>> = await client.search(
    queryBody
  );
  const hits = body.hits.hits.slice(0, MAX_FAVORITES);
  const brokerSirets = [
    ...new Set(hits.map(f => f._source?.brokerCompanySiret).filter(Boolean))
  ];

  const favorites = await Promise.all(
    brokerSirets.map(async siret => {
      try {
        const favorite = await searchCompany(siret);
        const company = await prisma.company.findUnique({
          where: { orgId: favorite.orgId },
          include: { brokerReceipt: true }
        });
        if (!company) return null;
        return { ...favorite, brokerReceipt: company.brokerReceipt };
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
  switch (type) {
    case "EMITTER":
      return getRecentEmitters(orgId);
    case "TRANSPORTER":
      return getRecentTransporters(orgId);
    case "TEMPORARY_STORAGE_DETAIL":
    case "RECIPIENT":
    case "DESTINATION":
      return getRecentRecipients(orgId);
    case "NEXT_DESTINATION":
      return getRecentNextDestinations(orgId);
    case "BROKER":
      return getRecentBrokers(orgId);
    case "TRADER":
      return getRecentTraders(orgId);
    default:
      return [];
  }
}

export const favoritesConstrutor = async ({
  orgId,
  type
}: FavoritesInput): Promise<CompanySearchResult[]> => {
  const company = await getCompanyOrCompanyNotFound({ orgId });
  const favorites = company.orgId
    ? await getRecentPartners(company.orgId, type)
    : [];

  // return early
  if (favorites.length + 1 >= MAX_FAVORITES) {
    favorites.splice(MAX_FAVORITES);
    return favorites;
  }

  // the user's company matches the provided favorite type
  const isMatchingType = matchesFavoriteType(company.companyTypes, type);
  // their company is not included in the results yet
  const isAlreadyListed = favorites.find(
    favorite => favorite.orgId === company.orgId
  );
  if (isMatchingType && !isAlreadyListed) {
    try {
      const companySearch = await searchCompany(company.orgId);
      favorites.push(companySearch);
    } catch {}
  }

  // Return up to MAX_FAVORITES results
  favorites.splice(MAX_FAVORITES);
  return favorites;
};

/**
 * ElasticSearhc identifier constructor
 */
export function getIndexFavoritesId({ orgId, type }: FavoritesInput) {
  return `${orgId}-${type}`;
}

/**
 * Create/update a favorite in Elastic Search.
 */
export function indexFavorites(
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

export const indexFavoritesJob = async (job: Job<FavoritesInput>) => {
  const { orgId, type } = job.data;

  try {
    // Index the companies in Elasticsearch
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

export interface FavoritesInputBenoit {
  bsdId: string;
}

export const indexFavoritesJobBenoit = async (
  job: Job<FavoritesInputBenoit>
) => {
  const { bsdId } = job.data;

  if (bsdId.startsWith("BSD" || bsdId.startsWith("TD"))) {
    // Il s'agit d'une BSDD

    const form = await prisma.form.findUniqueOrThrow({
      where: { readableId: bsdId },
      include: { transporters: true, forwardedIn: true }
    });

    if (!["SENT", "RESENT"].includes(form.status)) {
      // À DISCUTER, on met à jour les favoris uniquement lorsque
      // le bordereau est pris en charge par le transporteur
      return;
    }

    const emitter = form.emitterCompanySiret;
    const transporters = form.transporters
      ?.map(t => getTransporterCompanyOrgId(t))
      .filter(Boolean);
    const destination = form.recipientIsTempStorage
      ? form.forwardedIn?.recipientCompanySiret
      : form.recipientCompanySiret;
    const tempStorage = form.recipientIsTempStorage
      ? form.recipientCompanySiret
      : null;
    const nextDestination = form.nextDestinationCompanySiret;
    const broker = form.brokerCompanySiret;
    const trader = form.traderCompanySiret;

    const orgIds = [
      emitter,
      ...transporters,
      destination,
      tempStorage,
      nextDestination,
      broker,
      trader
    ].filter(Boolean);

    const orgIdByFavoriteType: Record<FavoriteType, string | null | undefined> =
      {
        EMITTER: emitter,
        DESTINATION: destination,
        TEMPORARY_STORAGE_DETAIL: tempStorage,
        NEXT_DESTINATION: nextDestination,
        TRADER: trader,
        BROKER: broker,
        WORKER: null,
        // je ne suis pas sur de comprendre la différence entre RECIPIENT et DESTINATION / TEMPORARY_STORAGE_DETAIL
        RECIPIENT: destination,
        TRANSPORTER: transporters[0] // il faudrait pouvoir gérer tous les transporteurs
      };

    // On itère sur tous les types de favoris
    for (const favoriteType of Object.keys(orgIdByFavoriteType)) {
      // Si un orgId est présent pour ce type de favoris
      if (orgIdByFavoriteType[favoriteType]) {
        const orgId = orgIdByFavoriteType[favoriteType];
        // ON ajoute cet orgId à la liste des favoris de ce type des autres orgId
        for (const otherOrgId of orgIds.filter(id => id !== orgId)) {
          const ES = {}; // dummy ES
          const currentFavorites = ES[`${otherOrgId}-${favoriteType}`]; // TODO récupères les favoris depuis ES
          const newFavorites = [...new Set([...currentFavorites, orgId])]; // s'assure que les orgId sont uniques
          ES[`${otherOrgId}-${favoriteType}`] = newFavorites; // TODO sauvegarde dans ES
        }
      }
    }
  }
};
