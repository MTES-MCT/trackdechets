import { AuthType } from "@prisma/client";
import { createTestClient } from "apollo-server-integration-testing";
import { server } from "../server";

/**
 * Instantiate test client
 */
function makeClient(user?: Express.User) {
  const { mutate, query, setOptions } = createTestClient({
    apolloServer: server
  });

  if (user) {
    setOptions({
      request: {
        user: { ...user, auth: AuthType.SESSION }
      }
    });
  }

  return { mutate, query };
}

export default makeClient;
