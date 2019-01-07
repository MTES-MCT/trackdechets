import axios from "axios";
import { Context } from "../types";
import { getUserId } from "../utils";

const requests = {};
function memoizeRequest(siret) {
  if (!(siret in requests)) {
    requests[siret] = axios.get<Company>(`http://td-insee:81/siret/${siret}`); // TODO
  }

  return requests[siret].then(v => v.data);
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
    }
  },
  Query: {
    companyInfos: async (parent, { siret }) => {
      if (siret.length < 14) {
        return null;
      }

      return await memoizeRequest(siret);
    },
    favorites: async (parent, { type }, context: Context) => {
      const lowerType = type.toLowerCase();
      const userId = getUserId(context);
      const userCompany = await context.prisma.user({ id: userId }).company();

      const forms = await context.prisma.forms({
        where: { [`${lowerType}CompanySiret`]: userCompany.siret }
      });

      const formsWithValue = forms.filter(f => f[`${lowerType}Siret`]);

      if (!formsWithValue.length) {
        return [memoizeRequest(userCompany.siret)];
      }

      return formsWithValue
        .map(f => ({
          name: f[`${lowerType}Name`],
          siret: f[`${lowerType}Siret`],
          address: f[`${lowerType}Address`],
          contact: f[`${lowerType}Contact`],
          phone: f[`${lowerType}Phone`],
          mail: f[`${lowerType}Mail`]
        }))
        .filter(
          (thing, index, self) =>
            index === self.findIndex(t => t.name === thing.name)
        );
    }
  }
};
