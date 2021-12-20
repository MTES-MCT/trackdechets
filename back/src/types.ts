import { ExpressContext } from "apollo-server-express/dist/ApolloServer";
import { createCompanyDataLoaders } from "./companies/dataloaders";
import { createUserDataLoaders } from "./users/dataloders";

export type GraphQLContext = ExpressContext & {
  user: Express.User | null;
  dataloaders: ReturnType<typeof createUserDataLoaders> &
    ReturnType<typeof createCompanyDataLoaders>;
};
