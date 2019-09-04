
import axios from "axios";

const requests = {};

export function memoizeRequest(siret) {
  if (!(siret in requests)) {
    requests[siret] = axios.get(`http://td-insee:81/siret/${siret}`);
  }

  return requests[siret]
    .then(v => v.data)
    .catch(err => {
      delete requests[siret];
      console.error("Error while querying INSEE service", err);
    });
}