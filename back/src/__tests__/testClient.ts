import { createTestClient } from "apollo-server-integration-testing";
import { server } from "../server";
import { User } from "../generated/prisma-client";
import { AuthType } from "../auth";

/**
 * Instantiate test client
 */
function makeClient(user?: User, authType?: AuthType) {
  const { mutate, query, setOptions } = createTestClient({
    apolloServer: server
  });

  if (user) {
    setOptions({
      request: {
        user: {
          ...user,
          ...(authType ? { auth: authType } : {})
        }
      }
    });
  }

  return { mutate, query };
}

export default makeClient;
