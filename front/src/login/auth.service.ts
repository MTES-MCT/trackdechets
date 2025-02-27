import client from "../graphql-client";

export const localAuthService = {
  locallySignOut() {
    client.stop();
    client.clearStore();
  }
};
