import { GraphQLContext } from "../types";
import { prisma } from "../generated/prisma-client";
import { getCachedCompanySireneInfo, searchCompanies } from "./insee";
import {
  getCompanyInfos,
  getCompanyUsers,
  getUserRole,
  getUserCompanies,
  getDeclarations,
  getRubriques
} from "./queries";
import { updateCompany, renewSecurityCode } from "./mutations";
import createCompany from "./mutations/create-company";
import createUploadLink from "./mutations/create-upload-link";

type FavoriteType = "EMITTER" | "TRANSPORTER" | "RECIPIENT" | "TRADER";

const companySireneInfoResolvers = {
  latitude: parent => {
    return parent.latitude ? parseFloat(parent.latitude) : null;
  },
  longitude: parent => {
    return parent.latitude ? parseFloat(parent.longitude) : null;
  }
};

export default {
  CompanyPrivate: {
    ...companySireneInfoResolvers,
    users: parent => {
      return getCompanyUsers(parent.siret);
    },
    userRole: (parent, _, context: GraphQLContext) => {
      const userId = context.user.id;
      return getUserRole(userId, parent.siret);
    }
  },
  CompanyPublic: {
    ...companySireneInfoResolvers
  },
  CompanyMember: {
    isMe: (parent, _, context: GraphQLContext) => {
      return parent.id === context.user.id;
    }
  },
  Installation: {
    urlFiche: parent =>
      `https://www.georisques.gouv.fr/dossiers/installations/donnees/details/${parent.codeS3ic}#/`,
    rubriques: async parent => getRubriques(parent.codeS3ic),
    declarations: async parent => getDeclarations(parent.codeS3ic)
  },
  Query: {
    companyInfos: async (_, { siret }) => getCompanyInfos(siret),
    searchCompanies: async (_, { clue, department = "" }) => {
      const isNumber = /^[0-9\s]+$/.test(clue);
      if (!isNumber) {
        return searchCompanies(clue, department);
      }
      if (clue.length < 14) {
        return [];
      }
      return [await getCachedCompanySireneInfo(clue)];
    },
    favorites: async (
      parent,
      { type }: { type: FavoriteType },
      context: GraphQLContext
    ) => {
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
        return Promise.all(
          companies.map(c => getCachedCompanySireneInfo(c.siret))
        );
      }

      return favorites;
    }
  },
  Mutation: {
    renewSecurityCode: (_, { siret }) => renewSecurityCode(siret),
    updateCompany: (_, payload) => updateCompany(payload),
    createCompany,
    createUploadLink
  }
};
