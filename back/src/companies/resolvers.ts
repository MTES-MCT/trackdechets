import axios from "axios";
import { Context } from "../types";
import { getUserId } from "../utils";

const requests = {};
function memoizeRequest(siret) {
  if (!(siret in requests)) {
    requests[siret] = axios.get<Company>(`http://td-insee:81/siret/${siret}`);
  }

  return requests[siret]
    .then(v => v.data)
    .catch(err => {
      delete requests[siret];
      console.error("Error while querying INSEE service", err);
    });
}

type Company = {
  address: string;
  name: string;
  siret: string;
  contact?: string;
  phone?: string;
  mail?: string;
};
export default {
  Company: {
    address: async parent => {
      const company = await memoizeRequest(parent.siret);
      return company.address;
    },
    name: async parent => {
      const company = await memoizeRequest(parent.siret);
      return company.name;
    },
    admin: async (parent, _, context: Context) => {
      return context.prisma
        .company({ siret: parent.siret })
        .admin()
        .catch(_ => null);
    }
  },
  Query: {
    companyInfos: async (parent, { siret }) => {
      if (siret.length < 14) {
        return null;
      }

      return await memoizeRequest(siret);
    },
    companyUsers: async (_, { siret }, context: Context) => {
      const companyAdmin = await context.prisma.company({ siret }).admin();

      const currentUserId = getUserId(context);
      if (companyAdmin.id !== currentUserId) {
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
            role: u.id === currentUserId ? "Administrateur" : "Membre"
          }))
        );

      return [...users, ...invitedUsers];
    },
    searchCompanies: async (parent, { clue, department = '' }) => {
      const isNumber = /^[0-9\s]+$/.test(clue);

      if (!isNumber) {
        const response: any = await axios
          .get<Company>(
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
    favorites: async (parent, { type }, context: Context) => {
      const lowerType = type.toLowerCase();
      const userId = getUserId(context);
      const userCompanies = await context.prisma
        .user({ id: userId })
        .companies();
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
        }
      });

      const formsWithValue = forms.filter(f => f[`${lowerType}CompanySiret`]);

      if (!formsWithValue.length) {
        return [memoizeRequest(userCompanies[0].siret)];
      }

      return formsWithValue
        .map(f => ({
          name: f[`${lowerType}CompanyName`],
          siret: f[`${lowerType}CompanySiret`],
          address: f[`${lowerType}CompanyAddress`],
          contact: f[`${lowerType}CompanyContact`],
          phone: f[`${lowerType}CompanyPhone`],
          mail: f[`${lowerType}CompanyMail`]
        }))
        .filter(
          (thing, index, self) =>
            index === self.findIndex(t => t.name === thing.name)
        );
    }
  }
};
