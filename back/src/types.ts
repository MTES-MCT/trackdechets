import { ExpressContext } from "apollo-server-express/dist/ApolloServer";
import { createEventsDataLoaders } from "./activity-events/dataloader";
import { GqlInfo } from "./common/middlewares/graphqlQueryParser";
import { createCompanyDataLoaders } from "./companies/dataloaders";
import { createFormDataLoaders } from "./forms/dataloader";
import { createUserDataLoaders } from "./users/dataloaders";

export type AppDataloaders = ReturnType<typeof createUserDataLoaders> &
  ReturnType<typeof createCompanyDataLoaders> &
  ReturnType<typeof createFormDataLoaders> &
  ReturnType<typeof createEventsDataLoaders>;

export type GraphQLContext = ExpressContext & {
  user: Express.User | null;
  dataloaders: AppDataloaders;
};

export type Nullable<T> = {
  [P in keyof T]: T[P] | null;
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
