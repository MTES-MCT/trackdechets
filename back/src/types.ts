import { ExpressContext } from "apollo-server-express/dist/ApolloServer";

export type GraphQLContext = ExpressContext & {
  user: Express.User | undefined;
};
