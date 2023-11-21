import client from "../graphql-client";
import { SIRET_STORAGE_KEY } from "../dashboard/DashboardCompanySelector";

export const localAuthService = {
  locallySignOut() {
    client.resetStore();
    window.localStorage.removeItem(SIRET_STORAGE_KEY);
  }
};
