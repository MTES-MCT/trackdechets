import { ExpressContext } from "apollo-server-express/dist/ApolloServer";

import { Prisma, User } from "./generated/prisma-client";

export type GraphQLContext = ExpressContext & {
  user: User;
  prisma: Prisma;
  request: any;
};
