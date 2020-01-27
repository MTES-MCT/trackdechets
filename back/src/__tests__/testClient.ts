import { createTestClient } from "apollo-server-integration-testing";
import { server } from "../server";

const { JWT_SECRET } = process.env;
/**
 * Instatiate test client and return a mutate helper for an authenticated user
 * @param user
 */
const makeClient = user => {
  // instantiate test client
  const { mutate, setOptions } = createTestClient({
    apolloServer: server
  });
 
  setOptions({
    request: {
      user: user
    }
  });
  return { mutate };
};

export default makeClient;
