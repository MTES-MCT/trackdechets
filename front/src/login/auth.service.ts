import client from "../graphql-client";
import { SIRET_STORAGE_KEY } from "../Apps/common/Components/CompanySwitcher/CompanySwitcher";

export const localAuthService = {
  locallySignOut() {
    client.resetStore();
    window.localStorage.removeItem(SIRET_STORAGE_KEY);
  }
};
