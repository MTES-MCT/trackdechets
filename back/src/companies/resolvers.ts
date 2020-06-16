import { prisma } from "../generated/prisma-client";
import { searchCompany, searchCompanies } from "./sirene";
import { renewSecurityCode, updateCompany } from "./mutations";
import createCompany from "./mutations/create-company";
import createUploadLink from "./mutations/create-upload-link";
import createTransporterReceipt from "./mutations/transporterReceipt/createTransporterReceipt";
import createTraderReceipt from "./mutations/traderReceipt/createTraderReceipt";
import updateTransporterReceipt from "./mutations/transporterReceipt/updateTransporterReceipt";
import updateTraderReceipt from "./mutations/traderReceipt/updateTraderReceipt";
import deleteTransporterReceipt from "./mutations/transporterReceipt/deleteTransporterReceipt";
import deleteTraderReceipt from "./mutations/traderReceipt/deleteTraderReceipt";
import {
  getCompanyInfos,
  getCompanyUsers,
  getDeclarations,
  getRubriques,
  getUserCompanies,
  getUserRole,
  getInstallation
} from "./queries";
import {
  QueryResolvers,
  MutationResolvers,
  CompanyPrivateResolvers,
  CompanyMemberResolvers,
  InstallationResolvers,
  CompanyPublicResolvers,
  CompanyFavoriteResolvers,
  CompanySearchResultResolvers
} from "../generated/graphql/types";

// lookup for transporter and trader receipt in db
const receiptsResolvers = {
  transporterReceipt: parent =>
    prisma.company({ siret: parent.siret }).transporterReceipt(),
  traderReceipt: parent =>
    prisma.company({ siret: parent.siret }).traderReceipt()
};

const queryResolvers: QueryResolvers = {
  companyInfos: async (_, { siret }) => getCompanyInfos(siret),
  searchCompanies: async (_, { clue, department }) => {
    const companies = await searchCompanies(clue, department);
    return companies.map(async company => {
      return {
        ...company,
        installation: await getInstallation(company.siret)
      };
    });
  },
  favorites: async (_parent, { type }, context) => {
    const lowerType = type.toLowerCase();
    const userId = context.user.id;
    const companies = await getUserCompanies(userId);

    if (!companies.length) {
      throw new Error(
        `Vous n'appartenez à aucune entreprise, vous n'avez pas de favori.`
      );
    }

    const forms = await prisma.forms({
      where: {
        OR: [
          { owner: { id: userId } },
          { recipientCompanySiret: companies[0].siret },
          { emitterCompanySiret: companies[0].siret }
        ],
        isDeleted: false
      },
      orderBy: "createdAt_DESC",
      first: 50
    });

    const favorites = forms
      // Filter out forms with no data
      .filter(f => f[`${lowerType}CompanySiret`])
      .map(f => ({
        name: f[`${lowerType}CompanyName`],
        siret: f[`${lowerType}CompanySiret`],
        address: f[`${lowerType}CompanyAddress`],
        contact: f[`${lowerType}CompanyContact`],
        phone: f[`${lowerType}CompanyPhone`],
        mail: f[`${lowerType}CompanyMail`]
      }))
      // Remove duplicates (by company names)
      .reduce((prev, cur) => {
        if (prev.findIndex(el => el.name === cur.name) === -1) {
          prev.push(cur);
        }
        return prev;
      }, [])
      .slice(0, 10);

    // If there is no data yet, propose his own companies as favorites
    // We won't have every props populated, but it's a start
    if (!favorites.length) {
      return Promise.all(companies.map(c => searchCompany(c.siret)));
    }

    return favorites;
  },
  ecoOrganismes: () => prisma.ecoOrganismes()
};

const mutationResolvers: MutationResolvers = {
  renewSecurityCode: (_, { siret }) => renewSecurityCode(siret),
  updateCompany: (_, args) => updateCompany(args),
  createCompany: (_, args, context) => createCompany(context.user, args),
  createTransporterReceipt: (_, { input }) => createTransporterReceipt(input),
  updateTransporterReceipt: (_, { input }) => updateTransporterReceipt(input),
  deleteTransporterReceipt: (_, { input }) => deleteTransporterReceipt(input),
  deleteTraderReceipt: (_, { input }) => deleteTraderReceipt(input),
  createTraderReceipt: (_, { input }) => createTraderReceipt(input),
  updateTraderReceipt: (_, { input }) => updateTraderReceipt(input),
  createUploadLink: (_, args, context) =>
    createUploadLink(context.user.id, args)
};

const companyPrivateResolvers: CompanyPrivateResolvers = {
  users: async (parent, _, context) => {
    context.company = parent;
    return getCompanyUsers(parent.siret);
  },
  userRole: (parent, _, context) => {
    const userId = context.user.id;
    return getUserRole(userId, parent.siret);
  },
  ...receiptsResolvers
};

const companyPublicResolvers: CompanyPublicResolvers = {
  ...receiptsResolvers
};

const companyFavoriteResolvers: CompanyFavoriteResolvers = {
  ...receiptsResolvers
};

const companySearchResultResolvers: CompanySearchResultResolvers = {
  ...receiptsResolvers
};

const companyMemberResolvers: CompanyMemberResolvers = {
  role: (parent, _, context, info) => {
    const siret = context.company?.siret;
    return siret ? getUserRole(parent.id, siret) : null;
  },
  isMe: (parent, _, context) => {
    return parent.id === context.user.id;
  }
};

const installationResolvers: InstallationResolvers = {
  urlFiche: parent =>
    `https://www.georisques.gouv.fr/dossiers/installations/donnees/details/${parent.codeS3ic}#/`,
  rubriques: async parent => {
    const rub = await getRubriques(parent.codeS3ic);

    return rub.map(el => ({ ...el, category: el.category || "" }));
  },
  declarations: async parent => getDeclarations(parent.codeS3ic)
};
export default {
  CompanyPrivate: companyPrivateResolvers,
  CompanyPublic: companyPublicResolvers,
  CompanyFavorite: companyFavoriteResolvers,
  CompanySearchResult: companySearchResultResolvers,
  CompanyMember: companyMemberResolvers,
  Installation: installationResolvers,
  Query: queryResolvers,
  Mutation: mutationResolvers
};
