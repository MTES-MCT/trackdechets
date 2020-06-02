import { ExpressContext } from "apollo-server-express/dist/ApolloServer";

import { User } from "./generated/prisma-client";

export type GraphQLContext = ExpressContext & {
  user: User;
};
