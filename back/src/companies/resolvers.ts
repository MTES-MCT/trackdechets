import { Context } from "../types";
import { randomNumber } from "../utils";
import {
  getUserCompanies,
  getCompanyInstallation,
  getInstallationRubriques,
  getInstallationDeclarations,
  getCompany,
  getUserRole,
  getCompanyUsers
} from "./helper";
import { getCachedCompanySireneInfo, searchCompanies } from "./insee";
import updateCompany from "./mutations/updateCompany";

type FavoriteType = "EMITTER" | "TRANSPORTER" | "RECIPIENT" | "TRADER";

const companyTrackdechetsInfoResolvers = {
  // TODO add these fields in prisma
  website: () => "",
  phoneNumber: () => "",
  email: () => ""
};

const companySireneInfoResolvers = {
  latitude: parent => {
    return parent.latitude ? parseFloat(parent.latitude) : null;
  },
  longitude: parent => {
    return parent.latitude ? parseFloat(parent.longitude) : null;
  }
};

const companyIcpeInfoResolvers = {
  installation: parent => {
    return getCompanyInstallation(parent.siret);
  }
};

export default {
  CompanyPrivate: {
    ...companyTrackdechetsInfoResolvers,
    ...companySireneInfoResolvers,
    ...companyIcpeInfoResolvers,
    users: parent => {
      return getCompanyUsers(parent.siret);
    },
    userRole: (parent, _, context: Context) => {
      const userId = context.user.id;
      return getUserRole(userId, parent.siret);
    }
  },
  CompanyPublic: {
    ...companyTrackdechetsInfoResolvers,
    ...companySireneInfoResolvers,
    ...companyIcpeInfoResolvers,
    isRegistered: async parent => {
      const company = await getCompany(parent.siret);
      return company ? true : false;
    }
  },
  CompanyMember: {
    isMe: (parent, _, context: Context) => {
      return parent.id == context.user.id;
    }
  },
  Installation: {
    rubriques: async parent => {
      return getInstallationRubriques(parent.codeS3ic);
    },
    declarations: async parent => {
      return getInstallationDeclarations(parent.codeS3ic);
    }
  },
  Query: {
    companyInfos: async (_, { siret }) => {
      if (siret.length < 14) {
        return null;
      }

      const trackdechetsCompanyInfo = await getCompany(siret);
      const sireneCompanyInfo = await getCachedCompanySireneInfo(siret);
      const companyIcpeInfo = {
        installation: await getCompanyInstallation(siret)
      };

      const company = {
        ...companyIcpeInfo,
        ...trackdechetsCompanyInfo,
        ...sireneCompanyInfo
      };

      if (!!trackdechetsCompanyInfo) {
        company.isRegistered = true;
      }

      return company;
    },
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
      context: Context
    ) => {
      const lowerType = type.toLowerCase();
      const userId = context.user.id;
      const userCompanies = await getUserCompanies(userId);

      if (!userCompanies.length) {
        throw new Error(
          `Vous n'appartenez à aucune entreprise, vous n'avez pas de favori.`
        );
      }

      const forms = await context.prisma.forms({
        where: {
          OR: [
            { owner: { id: userId } },
            { recipientCompanySiret: userCompanies[0].siret },
            { emitterCompanySiret: userCompanies[0].siret }
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
          userCompanies.map(c => getCachedCompanySireneInfo(c.siret))
        );
      }

      return favorites;
    }
  },
  Mutation: {
    renewSecurityCode: async (_, { siret }, context: Context) => {
      return context.prisma.updateCompany({
        where: { siret },
        data: {
          securityCode: randomNumber(4)
        }
      });
    },
    updateCompany
  }
};
