import { createTestClient } from "apollo-server-integration-testing";
import { sign } from "jsonwebtoken";
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
  // Generate and pass token into Auth header
  const token = sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "1d"
  });
  setOptions({
    request: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
  return { mutate };
};

export default makeClient;
