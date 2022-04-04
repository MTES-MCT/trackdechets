import { ExpressContext } from "apollo-server-express/dist/ApolloServer";
import { GqlInfo } from "./common/middlewares/graphqlQueryParser";
import { createCompanyDataLoaders } from "./companies/dataloaders";
import { createUserDataLoaders } from "./users/dataloaders";

export type AppDataloaders = ReturnType<typeof createUserDataLoaders> &
  ReturnType<typeof createCompanyDataLoaders>;

export type GraphQLContext = ExpressContext & {
  user: Express.User | null;
  dataloaders: AppDataloaders;
};

declare module "express-session" {
  interface SessionData {
    warningMessage?: string;
  }
}

declare module "express" {
  interface Request {
    gqlInfos?: GqlInfo[];
  }
}
