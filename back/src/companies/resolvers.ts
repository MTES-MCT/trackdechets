import axios from "axios";
import { Context } from "../types";
import {
  getUserId,
  currentUserBelongsToCompanyAdmins,
  randomNumber
} from "../utils";
import {
  getCompanyAdmins,
  getUserCompanies,
  getCompanyInstallation,
  getInstallationRubriques,
  getInstallationDeclarations,
  getCompany
} from "./helper";
import { memoizeRequest } from "./cache";

type FavoriteType = "EMITTER" | "TRANSPORTER" | "RECIPIENT" | "TRADER";

export default {
  Installation: {
    rubriques: async parent => {
      return getInstallationRubriques(parent.codeS3ic);
    },
    declarations: async parent => {
      return getInstallationDeclarations(parent.codeS3ic);
    }
  },
  Company: {
    latitude: parent => {
      return parent.latitude ? parseFloat(parent.latitude) : null;
    },
    longitude: parent => {
      return parent.latitude ? parseFloat(parent.longitude) : null;
    },
    installation: parent => {
      return getCompanyInstallation(parent.siret);
    },
    isRegistered: async parent => {
      const company = await getCompany(parent.siret);
      return company ? true : false;
    },
    admins: parent => {
      return getCompanyAdmins(parent.siret).catch(_ => null);
    }
  },
  Query: {
    companyInfos: (parent, { siret }) => {
      if (siret.length < 14) {
        return null;
      }
      return memoizeRequest(siret);
    },
    companyUsers: async (_, { siret }, context: Context) => {
      const companyAdmins = await getCompanyAdmins(siret);

      const currentUserId = getUserId(context);
      if (!companyAdmins.find(a => a.id === currentUserId)) {
        return [];
      }

      const invitedUsers = await context.prisma
        .userAccountHashes({ where: { companySiret: siret } })
        .then(hashes =>
          hashes.map(h => ({
            id: h.email,
            name: "Invité",
            email: h.email,
            role: "En attente"
          }))
        );

      const users = await context.prisma
        .users({
          where: { companies_some: { siret: siret } }
        })
        .then(users =>
          users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.id === currentUserId ? "Administrateur" : "Collaborateur"
          }))
        );

      return [...users, ...invitedUsers];
    },
    searchCompanies: async (parent, { clue, department = "" }) => {
      const isNumber = /^[0-9\s]+$/.test(clue);

      if (!isNumber) {
        const response: any = await axios
          .get(
            `http://td-insee:81/search?clue=${clue}&department=${department}`
          )
          .catch(err =>
            console.error("Error while querying INSEE service", err)
          );
        return response.data;
      }

      if (clue.length < 14) {
        return;
      }

      return [await memoizeRequest(clue)];
    },
    favorites: async (
      parent,
      { type }: { type: FavoriteType },
      context: Context
    ) => {
      const lowerType = type.toLowerCase();
      const userId = getUserId(context);
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
        return Promise.all(userCompanies.map(c => memoizeRequest(c.siret)));
      }

      return favorites;
    }
  },
  Mutation: {
    renewSecurityCode: async (_, { siret }, context: Context) => {
      if (!currentUserBelongsToCompanyAdmins(context, siret)) {
        throw new Error(
          "Vous n'êtes pas autorisé à modifier ce code de sécurité."
        );
      }

      return context.prisma.updateCompany({
        where: { siret },
        data: {
          securityCode: randomNumber(4)
        }
      });
    }
  }
};
