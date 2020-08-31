import { prisma } from "../generated/prisma-client";
import createTransporterReceipt from "./mutations/transporterReceipt/createTransporterReceipt";
import createTraderReceipt from "./mutations/traderReceipt/createTraderReceipt";
import updateTransporterReceipt from "./mutations/transporterReceipt/updateTransporterReceipt";
import updateTraderReceipt from "./mutations/traderReceipt/updateTraderReceipt";
import deleteTransporterReceipt from "./mutations/transporterReceipt/deleteTransporterReceipt";
import deleteTraderReceipt from "./mutations/traderReceipt/deleteTraderReceipt";
import {
  getCompanyUsers,
  getDeclarations,
  getRubriques,
  getUserRole
} from "./database";
import {
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

const mutationResolvers: MutationResolvers = {
  createTransporterReceipt: (_, { input }) => createTransporterReceipt(input),
  updateTransporterReceipt: (_, { input }) => updateTransporterReceipt(input),
  deleteTransporterReceipt: (_, { input }) => deleteTransporterReceipt(input),
  deleteTraderReceipt: (_, { input }) => deleteTraderReceipt(input),
  createTraderReceipt: (_, { input }) => createTraderReceipt(input),
  updateTraderReceipt: (_, { input }) => updateTraderReceipt(input)
};

const companyPrivateResolvers: CompanyPrivateResolvers = {
  users: parent => {
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
  Mutation: mutationResolvers
};
