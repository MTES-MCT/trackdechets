import { AuthType, User } from "@prisma/client";
import { createTestClient } from "./apollo-integration-testing";
import { server } from "../server";

/**
 * Instantiate test client
 */
function makeClient(user?: (User & { auth?: AuthType }) | null) {
  const { mutate, query, setOptions } = createTestClient({
    apolloServer: server
  });

  if (user) {
    setOptions({
      request: {
        user: { auth: AuthType.SESSION, ...user }
      }
    });
  }

  return { mutate, query };
}

export default makeClient;
