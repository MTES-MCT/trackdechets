import { createTestClient } from "apollo-server-integration-testing";
import { server } from "../server";
import { User } from "../generated/prisma-client";

/**
 * Instantiate test client
 */
function makeClient(user?: User) {
  const { mutate, query, setOptions } = createTestClient({
    apolloServer: server
  });

  if (user) {
    setOptions({
      request: {
        user
      }
    });
  }

  return { mutate, query };
}

export default makeClient;
