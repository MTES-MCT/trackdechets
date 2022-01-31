import { ExpressContext } from "apollo-server-express/dist/ApolloServer";
import { createCompanyDataLoaders } from "./companies/dataloaders";
import { createUserDataLoaders } from "./users/dataloaders";

export type AppDataloaders = ReturnType<typeof createUserDataLoaders> &
  ReturnType<typeof createCompanyDataLoaders>;

export type GraphQLContext = ExpressContext & {
  user: Express.User | null;
  dataloaders: AppDataloaders;
};
