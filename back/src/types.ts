import { ExpressContext } from "apollo-server-express/dist/ApolloServer";

import { AuthUser } from "./auth";

export type GraphQLContext = ExpressContext & {
  user: AuthUser;
};
