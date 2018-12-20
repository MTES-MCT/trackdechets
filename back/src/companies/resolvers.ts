import axios from "axios";
import { request } from "http";

const requests = {};
function memoizeRequest(siret) {
  if (!(siret in requests)) {
    requests[siret] = axios.get<Company>(`http://td-insee:81/siret/${siret}`);// TODO
  }

  return requests[siret];
}

type Company = { address: string; name: string; siret: string };
export default {
  Company: {
    address: async parent => {
      const company = await memoizeRequest(parent.siret);
      return company.data.address;
    },
    name: async parent => {
      const company = await memoizeRequest(parent.siret);
      return company.data.name;
    }
  }
};
