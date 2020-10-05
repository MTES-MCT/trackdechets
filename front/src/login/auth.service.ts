import client from "../graphql-client";
import { SIRET_STORAGE_KEY } from "src/dashboard/CompanySelector";

export const localAuthService = {
  locallySignOut() {
    client.resetStore();
    window.localStorage.removeItem(SIRET_STORAGE_KEY);
  },
};
